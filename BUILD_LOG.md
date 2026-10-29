# FixLens hackathon build log

**Project:** FixLens, a bicycle repair-triage companion  
**Work period recorded:** October 28–29, 2026 (India time)  
**Participant:** Aditya Raut

## October 28 — working prototype

- Built the single-page photo and symptom workflow, ordered repair-plan view, safety notes, and clearly labeled offline example mode.
- Connected the server to Muse Spark 1.3 for photo-and-symptom repair guidance.
- Connected SAM 3.1, parsed its streamed segmentation response with Meta's `@meta-sam/parser`, and drew a mask over the uploaded photo.
- Added a broader noun-prompt retry when a bicycle-specific SAM prompt returns no mask, plus visible status for live, demo, and unavailable-mask outcomes.

## October 29 — rider-guided highlighting

- Added an optional click/tap target point on the displayed photo.
- Converted that point from the displayed, aspect-fit image to source-image pixels and built a SAM point prompt with `buildObjectPrompt` from `@meta-sam/parser`.
- Kept the concept-prompt path for riders who do not select a point, and made the interface describe results as candidate masks that need visual checking.

## Validation and contribution notes

- Earlier live screenshots showed Muse Spark and SAM 3.1 responding, including a mask that was incomplete on one tire photo. The point-guided path is intended to give the rider more control; it still needs a live check with the photos used in the final video.
- No measured repair-success rate or rider-study result is claimed. Add rider feedback only after collecting it and getting permission to quote it.
- Codex was used as coding assistance. Aditya supplied the product direction, configured the Meta API locally, and exercised the live flow. Review this description and the dates for accuracy before submission.
