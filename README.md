# FixLens — Meta Global AI Developer Hackathon

FixLens is a bicycle repair companion that turns a rider's photo and symptom into a cautious, beginner-friendly repair plan. In live mode, Muse Spark reasons over the photo and SAM 3.1 segments the relevant bike part. The server decodes SAM's mask with Meta's official `@meta-sam/parser` package and overlays it on the photo.

## Open the demo quickly

Double-click `Open-FixLens-Demo.cmd` to start the local server and open FixLens in your default browser. It opens in demo mode unless a Meta API key is set in the environment. Keep the launcher window open while using the app. If the server fails to start, the launcher prints its error instead of opening a broken page.

## Run on Windows

1. Install Node.js 22.9 or newer.
2. Open PowerShell in this folder and install the parser dependency:

   ```powershell
   npm install
   ```

3. Set your Meta Model API key and start the server in that same PowerShell window:

   ```powershell
   $env:MODEL_API_KEY = "paste your Meta Model API key here"
   node .\server.mjs
   ```

4. Keep PowerShell open and visit `http://localhost:4173` in a regular browser.

Without a key, the interface uses a clearly labeled example plan; it does not analyze the uploaded photo. Live analysis needs internet access and Meta Model API credits. The key stays on the server. Do not place it in browser code or commit it.

## Live flow

- Upload a clear bicycle photo and choose a symptom.
- Muse Spark 1.3 interprets the photo and symptom, selects the bike part to inspect, and returns cautious repair steps and safety guidance.
- FixLens passes Muse Spark's selected component to SAM 3.1. If a bicycle-specific prompt returns no mask, it retries once with a broader part name (for example, "tire"). The server parses SAM's streamed response and the app draws the decoded mask on the photo, making this a connected vision workflow.
- If SAM cannot return a mask, FixLens keeps the Muse Spark diagnosis and says the highlight is unavailable.

## Before submitting

- Run the app with your own API key and a real bicycle photo; make a short screen recording of the live flow.
- Try different photos and confirm the highlight matches the intended part. Models can be wrong; treat the guidance as informational, not a safety certification.
- Add your own account of the problem and any rider feedback you gather. Submit through the event portal by its deadline.

The current offline example is a sample flat-tire plan, not a diagnosis of the uploaded image.





