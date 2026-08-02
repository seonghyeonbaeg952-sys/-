# Performance Stage AI Layer Prompts

## Layer contract

1. `stage-rear-shell.png`: rear architectural niche and material texture.
2. `stage-front-occluder-wide.png`: transparent foreground proscenium used as the real occlusion layer.
3. Concert titles, dates, locations, templates, controls, and overlays remain editable Figma/CMS elements.

## Rear shell prompt

Create a production-ready architectural background layer for a Figma UI carousel. Use the approved performance-section composition as a reference only. Build a perfectly front-facing, symmetrical warm-ivory recessed exhibition niche with a stepped lintel, rear wall, side jambs, bottom plinth, subtle handmade-paper grain, shallow museum-display depth, and restrained warm ambient light. Leave the central and side template areas empty. Do not include books, program templates, posters, text, letters, logos, people, buttons, UI labels, black vertical objects, or orange graphics.

## Foreground occlusion prompt

Create a matching foreground architectural occlusion layer using the rear shell as the material reference. Keep the same square canvas, orthographic front elevation, symmetry, warm-ivory plaster/paper material, bevel language, grain, and lighting. Build a closer proscenium plane with broad left and right wings, a stepped top lintel, a substantial bottom sill, and a centered opening. Place the architecture on a perfectly flat `#00ff00` chroma-key background with no gradient, texture, shadow, floor, reflection, or lighting variation. Do not include text, logos, books, concert templates, black strips, UI, or people.

The chroma-key output was converted to an alpha PNG with the image-generation skill's `remove_chroma_key.py` helper using soft matte and despill.
