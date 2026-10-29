import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildObjectPrompt, decodeMaskToSVGPath, parseImageStream, recordsOfKind } from '@meta-sam/parser';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const maxBody = 12_000_000;

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

function responseText(raw) {
  return (raw.output || []).flatMap(item => item.content || [])
    .filter(part => part.type === 'output_text').map(part => part.text).join('\n');
}

function redactSecrets(value) {
  return String(value)
    .replace(/\bLLM_[A-Za-z0-9_-]+\b/g, 'LLM_[REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]');
}

async function* responseEvents(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let dataLines = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      let lineEnd;
      while ((lineEnd = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, lineEnd).replace(/\r$/, '');
        buffer = buffer.slice(lineEnd + 1);
        if (line === '') {
          if (dataLines.length) {
            const data = dataLines.join('\n');
            dataLines = [];
            if (data === '[DONE]') { yield { type: 'response.completed' }; return; }
            yield JSON.parse(data);
          }
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (done) break;
    }
    if (buffer.startsWith('data:')) dataLines.push(buffer.slice(5).trimStart());
    if (dataLines.length) {
      const data = dataLines.join('\n');
      if (data !== '[DONE]') yield JSON.parse(data);
    }
  } finally {
    reader.releaseLock();
  }
}

async function analyzeWithSpark({ image, issue, bike, note }) {
  const prompt = `You are FixLens, a cautious bicycle repair helper. Analyze the user's bike photo and context. Never claim certainty from a photo. Give safe, practical beginner guidance. If the image is not a bicycle or the issue is unclear, say so and ask them to consult a mechanic rather than inventing a diagnosis. Do not instruct riding an unsafe bike. Context: reported issue=${issue}; bike type=${bike}; extra detail=${note || 'none'}. Return only valid JSON with keys title, summary, confidence, component, steps (array of 3-5 objects each with title and detail), safety. Set component to exactly one of: "bicycle tire", "bicycle chain", "bicycle brake", "bicycle wheel", or "other bicycle part". Choose the visible part most relevant to the reported symptom. Keep steps concise. Include stop/seek-mechanic conditions in safety.`;
  const response = await fetch('https://api.meta.ai/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model: 'muse-spark-1.3', reasoning: { effort: 'medium' },
      input: [{ type: 'message', role: 'user', content: [
        { type: 'input_text', text: prompt }, { type: 'input_image', image_url: image }
      ] }]
    })
  });
  const raw = await response.json();
  if (!response.ok) throw new Error(raw.error?.message || `Muse Spark API returned ${response.status}`);
  const clean = responseText(raw).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(clean);
}

function samPromptCandidates(component) {
  const candidates = {
    'bicycle tire': ['bicycle tire', 'tire'],
    'bicycle chain': ['bicycle chain', 'chain'],
    'bicycle brake': ['bicycle brake', 'brake'],
    'bicycle wheel': ['bicycle wheel', 'wheel'],
    'other bicycle part': ['bicycle part', 'bike component']
  };
  return candidates[component] || ['bicycle part'];
}

async function analyzeWithSam({ image, prompt, width, height }) {
  const response = await fetch('https://api.meta.ai/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model: 'sam-3.1',
      input: [{ type: 'message', role: 'user', content: [
        { type: 'input_text', text: prompt }, { type: 'input_image', image_url: image }
      ] }],
      stream: true,
      metadata: { mask_encoding: 'one_bit' }
    })
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message.slice(0, 500) || `SAM 3.1 returned ${response.status}`);
  }
  const parsed = parseImageStream(responseEvents(response));
  const result = await parsed.finalResult;
  if (result.outcome.status !== 'completed') {
    throw new Error(`SAM stream ended early (${result.outcome.reason}${result.outcome.detail ? `: ${result.outcome.detail}` : ''}).`);
  }
  const objects = recordsOfKind(result.records, 'mask').map(record => ({
    id: record.objectId,
    bounds: record.bounds,
    path: decodeMaskToSVGPath(record.mask),
    confidence: record.confidence ?? null
  })).filter(object => object.path).slice(0, 8);
  const diagnostics = result.diagnostics.slice(0, 5).map(({ severity, code, line, message }) => ({ severity, code, line, message }));
  return { status: objects.length ? 'complete' : 'no_match', prompt, width, height, objects, diagnostics };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(await readFile(path.join(here, 'index.html')));
    } catch {
      res.writeHead(500); res.end('App file not found.');
    }
    return;
  }
  if (req.method !== 'POST' || req.url !== '/api/diagnose') {
    res.writeHead(404); res.end('Not found'); return;
  }
  if (!process.env.MODEL_API_KEY) {
    json(res, 503, { error: 'MODEL_API_KEY is not set on the server.' }); return;
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > maxBody) { res.writeHead(413); res.end('Image too large'); return; }
  }
  try {
    const input = JSON.parse(body);
    if (typeof input.image !== 'string' || !input.image.startsWith('data:image/')) throw new Error('Please upload an image.');
    if (!Number.isInteger(input.width) || !Number.isInteger(input.height) || input.width < 1 || input.height < 1) throw new Error('The photo dimensions could not be read. Please upload it again.');
    let point = null;
    if (input.point !== undefined && input.point !== null) {
      point = input.point;
      if (!point || !Number.isInteger(point.x) || !Number.isInteger(point.y)
        || point.x < 0 || point.y < 0 || point.x >= input.width || point.y >= input.height) {
        throw new Error('The selected point is outside the photo. Tap the photo again.');
      }
    }
    const diagnosis = await analyzeWithSpark(input);
    const allowed = new Set(['bicycle tire', 'bicycle chain', 'bicycle brake', 'bicycle wheel', 'other bicycle part']);
    if (!allowed.has(diagnosis.component)) {
      diagnosis.component = input.issue.toLowerCase().includes('chain') ? 'bicycle chain'
        : input.issue.toLowerCase().includes('brake') ? 'bicycle brake' : 'bicycle tire';
    }
    try {
      if (point) {
        const prompt = buildObjectPrompt({
          size: { width: input.width, height: input.height },
          objects: [{ id: 1, prompts: [{ points: [{ x: point.x, y: point.y }] }] }]
        });
        diagnosis.sam = await analyzeWithSam({ ...input, prompt });
        diagnosis.sam.promptMode = 'point';
        diagnosis.sam.prompt = diagnosis.component;
        diagnosis.sam.target = point;
      } else {
        const prompts = samPromptCandidates(diagnosis.component);
        const attemptedPrompts = [];
        for (const prompt of prompts) {
          attemptedPrompts.push(prompt);
          diagnosis.sam = await analyzeWithSam({ ...input, prompt });
          if (diagnosis.sam.status === 'complete') break;
        }
        diagnosis.sam.promptMode = 'concept';
        diagnosis.sam.attemptedPrompts = attemptedPrompts;
      }
    } catch (err) {
      const detail = redactSecrets(err instanceof Error ? err.message : String(err)).slice(0, 500);
      console.error('[FixLens] SAM 3.1 failed:', detail);
      diagnosis.sam = { status: 'unavailable', prompt: diagnosis.component, message: 'Muse Spark diagnosis succeeded, but SAM 3.1 could not create a highlight. Check the FixLens server terminal for the SAM error.' };
    }
    json(res, 200, diagnosis);
  } catch (err) {
    console.error('FixLens request failed:', err.message || 'unknown error');
    json(res, 502, { error: err.message || 'Could not analyze this image.' });
  }
});
server.listen(port, () => console.log(`FixLens ready at http://localhost:${port}`));



