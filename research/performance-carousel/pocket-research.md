# Performance carousel pocket architecture — focused re-research

## Problem restatement

The previous sample placed the side templates outside an inner viewport and exposed only the clipped edges. That produced the appearance of cropped graphic strips, not full CMS templates stored inside an architectural recess. The corrected requirement is:

- all three templates remain complete objects inside the 847 × 847 stage;
- the left and right templates sit in real side pockets with visible air around them;
- the front facade hides most of each side template through layer order;
- the center template remains the sole front-facing focal object;
- carousel state 01 → 02 → 03 changes the center template and linked concert copy without altering the architectural geometry.

## Source-backed decisions

1. **Use non-destructive occlusion, not destructive crops.** Figma masks retain concealed portions of a layer and depend on layer order. The implementation follows the same principle with full template frames below an exact facade layer.  
   Source: [Figma — Masks](https://help.figma.com/hc/en-us/articles/360040450253-Masks)

2. **Make the front edge visibly cross the hidden object.** Occlusion boundaries and T-junctions are strong depth cues: they communicate that one surface passes in front of another. The pocket lips therefore sit above the template slivers.  
   Sources: [Occlusion contours and border ownership](https://pmc.ncbi.nlm.nih.gov/articles/PMC5871781/), [Depth and occlusion boundaries](https://pmc.ncbi.nlm.nih.gov/articles/PMC3485797/), [T-junctions as occlusion cues](https://pmc.ncbi.nlm.nih.gov/articles/PMC5731627/)

3. **Use restrained contact shadows to describe the recess.** Inner shadows belong to the pocket planes; drop shadows belong to the templates. This avoids the earlier appearance of two unrelated flat image layers.  
   Source: [Figma — Apply effects to layers](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)

4. **Keep the side objects complete and in-stage.** Frames can hide overflow, but the semantic carousel object should not live outside the stage merely to fake a sliver. The stage now contains the full side objects and the facade performs the concealment.  
   Source: [Figma — Groups versus frames](https://www.figma.com/best-practices/groups-versus-frames/)

5. **Preserve a clear active slide and previous/next controls.** The three states remain a circular carousel and keep the existing previous, next, count, and expand controls.  
   Sources: [WAI-ARIA APG — Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), [W3C WAI — Carousel animations](https://www.w3.org/WAI/tutorials/carousels/animations/)

6. **Use depth fading only as a supporting cue.** Recess shadows and lower-contrast pocket planes support depth, while the editable template face keeps full contrast and legibility.  
   Source: [Autodesk — Depth Cueing](https://help.autodesk.com/cloudhelp/2025/ENU/Revit-HaveYouTried/files/GUID-4C06C282-C106-4285-B677-1C5D3481717E.htm)

## Final layer contract

The same stack is used in all three carousel states:

1. `L00 · ARCHITECTURE · REAR BASE`
2. `L05 · REAL ARCHITECTURAL POCKETS · OPEN AIR`
3. `L10 · INTERNAL STAGE · FULL TEMPLATES IN CANVAS`
4. `L20 · FRONT FACADE · EXACT OCCLUSION WITH POCKET WINDOWS`
5. `L30 · POCKET LIPS · T-JUNCTION DEPTH CUES`

The ordering is the essential contract. Moving a side template above `L20` destroys the illusion; moving it outside `L10` returns to the rejected clipped-strip construction.

## Verified geometry

| Element | X | Y | W | H | Meaning |
| --- | ---: | ---: | ---: | ---: | --- |
| Stage | 0 | 0 | 847 | 847 | fixed architectural coordinate space |
| Center template | 273.5 | 211 | 300 | 413.5 | active CMS template |
| Left template | 0 | 248.2 | 246 | 339.1 | complete template, 82% of active size |
| Right template | 601 | 248.2 | 246 | 339.1 | complete template, 82% of active size |
| Left pocket aperture | 220 | 232 | 44 | 372 | 26px white face + 18px visible air |
| Right pocket aperture | 583 | 232 | 44 | 18px visible air + 26px black spine |

Both side templates remain fully inside the stage (`0…246` and `601…847`). Their visible areas are equal at 26px, while each pocket retains 18px of open air and roughly 16px of top/bottom clearance.

## Motion contract

- Previous/next navigation remains circular: `01 ↔ 02 ↔ 03 ↔ 01`.
- Smart Animate keeps the existing 460ms `cubic-bezier(0.16, 1, 0.3, 1)` transition.
- The architecture and pocket geometry do not move between states; only the CMS templates, concert metadata, state indicator, and center emphasis change.
- Reduced-motion implementation should replace spatial travel with a short cross-fade while keeping the same state change.

## Why the earlier result failed

The earlier viewport used side-wrapper coordinates outside the inner frame. The browser and Figma technically displayed slivers, but the composition had no representational empty space behind the facade. The revised construction fixes the cause rather than adding another crop: full templates are in the architectural coordinate space, real pocket planes create the cavity, and the facade hides them through z-order.
