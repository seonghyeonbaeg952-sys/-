# Figma Home V5 Storyboard Plan

## Status

Figma MCP tools are available in the Codex environment, but this run did not have a target Figma `fileKey` or a `planKey` for creating a new file. No Figma canvas was modified.

This document is the fallback storyboard plan for implementation or later Figma creation.

## Page Name

SMYC Home V5 Cinematic

## Frames

| Frame | Purpose | React Mapping | CMS Mapping |
|---|---|---|---|
| 01 Full Home Flow Map | End-to-end scene sequence | `HomePage`, `HomeFlowProvider` | all home data |
| 02 Stage Hero Slider | Slideshow first impression | `HomeHeroSlideshow` | `hero_slides`, `site_settings` |
| 03 Quick Guide Cards | Three primary entry points | `FloatingInfoCards` | static home links |
| 04 Motet Score Cue | Early scorebook motif | `ScrollScoreBookReveal` | static identity copy |
| 05 About Preview | Mission and intro preview | `AboutPreview` | `about_sections`, `site_settings`, `gallery` |
| 06 Spirit Scorebook Page 1 | Motet meaning | `HomeSpiritScoreBook` | `about_sections.home_spirit_motet` |
| 07 Spirit Scorebook Page 2 | Honest music | `HomeSpiritScoreBook` | `about_sections.home_spirit_honest-music` |
| 08 Spirit Scorebook Page 3 | Church music/community | `HomeSpiritScoreBook` | `about_sections.home_spirit_*` |
| 09 Concert Template Panel Closed | Desktop preview state | `ConcertTemplatePanel` | `concerts` |
| 10 Concert Template Panel Open | Desktop open/pinned state | `ConcertTemplatePanel` | `concerts` |
| 11 Program Notes Panel | Notice preview as program notes | `NoticeProgramNotes` | `notices` |
| 12 Archive Motion Wall | Gallery preview | `GalleryPreview` | `gallery` |
| 13 Join Invitation | Invitation copy | `JoinCTA` | static/CMS future |
| 14 Partner Curtain | Sponsor rhythm | `SponsorQuietMarquee` | `sponsors` |
| 15 Support Letter | Support pledge invitation | `SupportLetterFold` | `site_settings` |
| 16 Footer Curtain Call | Brand and contact close | `Footer` | `site_settings`, `sponsors` |
| 17 Mobile Flow | 390px readable stack | same components | same CMS data |
| 18 Reduced Motion | Static fallback | CSS media query | same CMS data |
| 19 Accessibility States | focus, hover, selected | buttons/links/aria | none |
| 20 QA Checklist | validation matrix | docs only | none |
| 21 Subagent Findings | research summary | docs only | none |

## Motion Rules

- Scene entry uses fixed duration.
- Scroll updates orientation only.
- No wheel interception.
- No mandatory full-page snapping.
- Reduced motion shows static content.

## Next Figma Step

Provide either:

- an existing Figma design URL with `/design/:fileKey/...`, or
- a Figma `planKey` so a new design file can be created.
