# FixLens

**See the issue. Find the part. Take a safer next step.**

FixLens is a visual bicycle repair companion. A rider uploads a bicycle photo, describes a symptom, and gets a cautious repair plan. In live mode, Meta Muse Spark reasons about the photo and symptom, while Meta SAM 3.1 can return a candidate mask highlighting a relevant part.

> FixLens is a hackathon prototype, not a mechanic or a safety certification. A photo cannot confirm a puncture, diagnose every fault, or prove a bicycle is safe to ride.

## What FixLens does

- Accepts a bicycle photo, a reported issue, bike type, and optional rider notes.
- Uses **Meta Muse Spark 1.3** to return a structured, cautious diagnosis, practical checks, and safety guidance.
- Uses **Meta SAM 3.1** to segment a relevant part. Riders can tap a point on the photo to guide the mask; otherwise FixLens uses the component suggested by Spark and can retry with a broader part name.
- Overlays the candidate mask on the original photo and asks the rider to verify it.
- Keeps the Spark repair plan available if SAM cannot return a mask.
- Clearly labels the sample repair plan as **DEMO MODE** when live analysis is not running.

## Demo

For the strongest demo, use a clear photo showing the full affected part and nearby bicycle context. For a tire, include the wheel, tire, spokes, and part of the frame. Avoid extreme close-ups. In the app, select the reported issue and bike type, optionally tap the part to guide SAM, then choose **Diagnose my bike**.

The live result shows the diagnosis, ordered checks, safety note, and status:

- **LIVE · SPARK + SAM** — Spark returned a plan and SAM returned a candidate highlight.
- **LIVE · SPARK** — Spark returned a plan, but SAM did not return a highlight.
- **DEMO MODE** — the displayed plan is an example and did not analyze the uploaded photo.

## Run on Windows

### Requirements

- Windows PowerShell
- Node.js 22.9 or newer
- Internet access and a Meta Model API key with access/credits for the models used

### Try the interface in demo mode

1. Download or clone this repository and open the `FixLens` folder.
2. Double-click `Open-FixLens-Demo.cmd`.
3. Wait for the browser to open at `http://127.0.0.1:4173`.

This starts the local server and installs the SAM parser dependency if needed. Without a Meta API key, FixLens shows an example plan; it does not analyze the uploaded photo.

### Run live analysis

1. In the Meta Model API dashboard, create a key and click **Copy** while the full key is visible in its one-time dialog. A masked key in the keys list cannot be copied as the full secret.
2. While the key is still on your clipboard, open PowerShell in this repository folder and run:

   ```powershell
   .\Start-FixLens.ps1
   ```

3. The launcher reads the key directly from the clipboard, validates it, clears the clipboard, and starts the server. It does not ask you to type or paste the key into the terminal.
4. Keep the PowerShell window open and visit `http://localhost:4173` in your browser.

Use one launcher at a time. If another FixLens server already occupies port 4173, return to its terminal and press **Ctrl+C** before starting a new one. If the launcher says the clipboard does not contain a full key, copy it again from Meta's one-time dialog; if that dialog has closed and the key is masked, create a replacement key. The API key is not part of the repository and must never be added to browser code, screenshots, messages, or commits. If a key has been exposed, revoke it in Meta and use a new one.

## How the live flow works

1. The browser sends the selected photo and rider-provided context to the local Node.js server.
2. The server calls Meta Muse Spark for a structured bicycle diagnosis and repair plan.
3. FixLens sends a point-guided or component-guided segmentation request to Meta SAM 3.1.
4. The server parses SAM's streamed response with Meta's `@meta-sam/parser` package and returns a candidate mask for display over the photo.
5. The interface shows the plan and safety guidance, and labels the mask for human verification.

The Meta API key stays on the local server side; it is not embedded in the browser page. The local app does not write uploaded photos to disk, but it sends them to Meta's API for inference. Review Meta's current policies before using sensitive images.

## Troubleshooting

- **The browser cannot connect:** make sure the launcher window is still open and says `FixLens ready at http://localhost:4173`.
- **`EADDRINUSE` / port 4173 is busy:** an existing server is already running. Stop that server with **Ctrl+C** in its terminal, then start one launcher.
- **`DEMO MODE` or “Example plan only”:** live analysis did not run. Start FixLens with a valid Meta API key and check that the Meta project has access and credits.
- **Live request fails:** check the server terminal for the latest error, confirm the key was copied from Meta's one-time dialog, then restart the launcher. Never share the key when asking for help.
- **SAM returns no highlight:** try a wider, sharper photo and tap clearly inside the intended part. The repair plan may still be available without a mask.

## Safety and limitations

- A model-generated plan and candidate mask may be wrong or incomplete.
- A photo cannot reliably confirm pressure, a hidden puncture, component damage, or riding safety.
- Do not ride a flat, soft, visibly damaged, or uncertain bicycle. Stop and consult a qualified mechanic when in doubt.
- This prototype focuses on common bicycle symptoms and is not a substitute for professional inspection.

## Built with

- Meta Muse Spark 1.3 — image and symptom reasoning
- Meta SAM 3.1 — candidate part segmentation
- Meta `@meta-sam/parser` — decoding SAM's streamed mask response
- Node.js — local server and Meta API calls
- HTML, CSS, and JavaScript — browser interface

## Project

- Public repository: [github.com/aditya052003/FixLens](https://github.com/aditya052003/FixLens)
- Hackathon submission and demo video: add the final links here after submission materials are ready.

---

Built by Aditya Raut for the Meta Global AI Developer Hackathon.
