# Home V5 Reference Research

## Verification Summary

- Confirmed sources: 67
- Failed or not directly verifiable sources: 9
- Directly adopted patterns: restrained arts-institution hierarchy, event-first program panels, accessible carousel/tab semantics, reduced-motion fallbacks, quiet sponsor presentation, and non-hijacking scroll cues.
- Copy/license policy: no third-party code was copied into production. Motion and component ideas were interpreted into the existing React/Tailwind/Supabase codebase.

## Source Groups

| Group | Sources Checked | Adopted for SMYC | Rejected |
|---|---:|---|---|
| Arts institutions and orchestras | 20+ | editorial hero, program/event hierarchy, restrained CTA density | heavy marketing hero, excessive overlay badges |
| Choir and youth music organizations | 15+ | mission-first language, education/community framing | old bulletin-board structures |
| Component pattern libraries | 15+ | carousel/tabs/dialog semantics, card/panel rhythm | code copying, dependency additions |
| Motion and accessibility guidance | 17+ | fixed-duration scene motion, reduced motion, no scroll hijacking | scrubbed scroll animation, hover-only information |

## Representative Confirmed Sources

| No | Source | Reference Element | SMYC Use |
|---|---|---|---|
| 1 | Seoul Philharmonic Orchestra | arts-program hierarchy | restrained event section rhythm |
| 2 | Sejong Center | public cultural navigation | clear public information architecture |
| 3 | Seoul Metropolitan Chorus | chorus information structure | choir intro, performance, notice grouping |
| 4 | Vienna Boys Choir | youth choir identity | next-generation and education framing |
| 5 | London Youth Choirs | join/support language | youth-safe public copy |
| 6 | National Children's Chorus | audition and program hierarchy | join section clarity |
| 7 | Young People's Chorus of NYC | youth choral mission | community and education language |
| 8 | Uniting Voices Chicago | civic youth choir tone | inclusive support/sponsor framing |
| 9 | Metropolitan Opera | performance-first card pattern | concert template panel direction |
| 10 | New York Philharmonic | concert listing clarity | date/location/status facts |
| 11 | LA Phil | editorial event promotion | event CTA balance |
| 12 | Berlin Philharmonic | premium arts tone | restrained navy/gold hierarchy |
| 13 | London Symphony Orchestra | season and event structure | program notes as public content |
| 14 | Carnegie Hall | event detail clarity | accessible CTA placement |
| 15 | Sydney Opera House | venue-grade visual rhythm | section spacing and image discipline |
| 16 | WAI-ARIA Carousel Pattern | accessible carousel behavior | hero and spirit controls |
| 17 | WAI-ARIA Tabs Pattern | selected state semantics | section tab references |
| 18 | WAI-ARIA Disclosure/Dialog Patterns | explicit controls | no hover-only content |
| 19 | MDN prefers-reduced-motion | motion accessibility | static reduced-motion states |
| 20 | MDN Intersection Observer | section detection model | passive scene progress |
| 21 | web.dev animation guidance | transform/opacity motion | no layout-thrashing animation |
| 22 | Component Gallery carousel/tabs | component taxonomy | control semantics, not visual copy |
| 23 | SmoothUI reveal/card references | restrained reveal rhythm | CSS-only reinterpretation |
| 24 | Magic UI marquee/text reveal | micro-interaction ideas | local implementation, no dependency |
| 25 | Uiverse interaction examples | hover/focus affordances | only high-level inspiration |

## Failed or Unverified Sources

Nine listed references were not treated as confirmed because of access limits, page changes, missing docs pages, or browser protection. They were not used as factual evidence.

## Final Adopted Patterns

1. Keep the hero as a slideshow, but reduce competing badge/control weight.
2. Use a passive flow rail as orientation, not a scroll controller.
3. Replace the old concert book metaphor with a stable `ConcertTemplatePanel`.
4. Present choir spirit as an arrow-controlled scorebook, not a long vertical text block.
5. Keep mobile readable and always open where hover would hide information.
6. Keep sponsors quiet and consent-based, never derived automatically from pledge submissions.
7. Respect reduced motion for all decorative movement.

## Subagent Notes

This document consolidates the `reference_motion_researcher`, `home_failure_auditor`, `typography_motion_director`, `concert_panel_engineer`, `spirit_booklet_architect`, and `supabase_privacy_guard` reports. The main implementation kept their architecture-level recommendations and did not copy external code.
