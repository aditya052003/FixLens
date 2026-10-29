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

3. In the Meta Model API dashboard, create a key and copy it from the one-time key dialog. In this folder, run:

   ```powershell
   .\Start-FixLens.ps1
   ```

   The launcher reads the copied key from the clipboard, clears the clipboard, and starts the server. It does not print or save the key in the project. Keep PowerShell open and visit `http://localhost:4173` in a regular browser.

If the key-creation dialog fails, do not run the launcher until Meta successfully creates a key. Without a key, the interface uses a clearly labeled example plan; it does not analyze the uploaded photo. Live analysis needs internet access and Meta Model API credits. Never place the key in browser code, messages, screenshots, or the repository.

## Live flow

- Upload a clear bicycle photo that shows the whole affected part plus nearby bike context, then choose a symptom. Avoid an extreme crop. For more precise segmentation, click or tap inside the part you want highlighted before diagnosing.
- Muse Spark 1.3 interprets the photo and symptom, selects the bike part to inspect, and returns cautious repair steps and safety guidance.
- If you selected a point, FixLens converts that screen position to source-image pixels and uses Meta's `buildObjectPrompt` to send SAM 3.1 a point-guided segmentation request. Otherwise, it passes Muse Spark's selected component as a concept prompt and retries once with a broader part name (for example, "tire") if no mask is found.
- The server parses SAM's streamed response and overlays the decoded mask. The UI labels it a candidate mask and asks the rider to verify it; a segmentation result is not proof of a diagnosis or safety.
- If SAM cannot return a mask, FixLens keeps the Muse Spark diagnosis and says the highlight is unavailable.

## Before submitting

- Run the app with your own API key and a real bicycle photo; make a short screen recording of the live flow.
- Try different photos, tap clearly inside the target part, and confirm the highlight matches. If it does not, try another point or retake the photo. Models can be wrong; treat the guidance as informational, not a safety certification.
- Add your own account of the problem and any rider feedback you gather. Submit through the event portal by its deadline.

The current offline example is a sample flat-tire plan, not a diagnosis of the uploaded image.





