# Anya avatar assets

Generated using the built-in `image_gen` tool as an optional importable avatar pack. The original SVGs remain the default character. The 12 states use static, transparent PNG stickers; state changes swap images rather than play frame animations.

## Base prompt

Use case: stylized-concept. Asset type: one transparent PNG avatar sticker for a Chrome AI chat companion, readable at 128px. Primary request: Anya Forger from SPY x FAMILY (間諜家家酒安妮雅), recognizable pink bob hair, green eyes, black and gold horn-shaped hair ornaments, black Eden school dress with gold trim and white collar. Cute polished 2D chibi anime illustration, clean dark outlines, gentle cel shading. Single character only, head and upper torso, front facing, centered in a square canvas with generous transparent margin around hair and shoulders, nothing cropped. Expression: relaxed friendly idle face, open green eyes, tiny closed-mouth smile, hands resting together at chest. Actual transparent background, no scene, no lettering, no text, no watermark, no border or sticker white outline. This will be the identity reference for a matching 12-expression set.

## Shared variant prompt

Use case: identity-preserve. Create ONE matching transparent avatar sticker of Anya Forger from SPY x FAMILY. The provided image is the character identity and style reference. Preserve pink bob hair, black/gold hair ornaments, Eden uniform, green eyes, linework, cel shading, centered head-and-upper-torso composition and scale. Change only the expression and hand gesture as specified. Entire head and shoulders visible, clear transparent padding all around (hair must not touch canvas). Actual alpha transparency, no background, no text, no watermark, no white sticker outline. Expression:

Each variant used the generated `idle` image as its reference, with the shared prompt followed by the matching expression below. All calls requested `transparent_background: true`.

| File | Expression appended to shared variant prompt |
| --- | --- |
| idle.png | Base prompt above |
| idle2.png | Anya's iconic mischievous smug heh smile, half-lidded green eyes, hands tucked together. |
| idle3.png | calm contented idle, eyes closed in a small peaceful smile, relaxed hands. |
| thinking.png | thoughtful, glancing upward with one index finger resting on chin, slightly pursed lips. |
| happy.png | delighted cheerful smile, eyes happily closed in arcs, little rosy cheeks, hands gently clasped. |
| sad.png | sad and disappointed, downturned eyebrows and mouth, watery green eyes with a small tear, hands clasped low. |
| excited.png | waku waku excitement, huge sparkling green eyes, wide happy open mouth, both little fists raised beside cheeks. |
| confused.png | puzzled and uncertain, one eyebrow raised, small crooked mouth, head slightly tilted, one hand touching cheek. |
| angry.png | comically angry pout, eyebrows angled down, puffed rosy cheeks, tiny clenched fists, still cute. |
| surprised.png | astonished, eyes wide round green, small O-shaped mouth, both hands raised near cheeks. |
| worried.png | worried and nervous, eyebrows lifted toward the middle, uneasy small mouth, hands clasped tightly. |
| neutral.png | composed neutral face, open relaxed green eyes, closed straight small mouth, hands resting calmly together. |

## Integration

- Final files: `public/assets/avatar/anya/*.png`.
- Images are mechanically resized to fit within 480px on a 512px transparent canvas, preserving their aspect ratio and generated alpha channel.
- The original default SVG mapping remains in `src/common/constants.ts`.
- `public/manifest.json` exposes this PNG directory to supported chat pages.
- `npm run build` copies the assets into `dist/assets/avatar/anya/`.
- The build also creates the portable single-file `dist/packs/anya.avatar-pack.json` with all 12 embedded PNGs. Import it from extension options, or use the bundled Anya import button, preview and save.
- Existing custom avatar uploads override these defaults until reset in extension options.
