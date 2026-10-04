---
version: alpha
name: Azimut
description: The implemented cartographic workshop proposal for address review.
colors:
  destino-yellow: "#cbff6a"
  primary-hover: "#e0ffae"
  tech-cyan: "#78e4ef"
  tech-violet: "#b7aaff"
  survey-signal: "#ff9b8c"
  tech-canvas: "#10141c"
  survey-paper: "#171c26"
  survey-muted: "#202a38"
  survey-ink: "#eff5fb"
  survey-secondary: "#a9b6c8"
  survey-rule: "#344252"
  tech-on-accent: "#111b20"
  field-border: "#667991"
  white: "#ffffff"
  selected-surface: "#163139"
  review-surface: "#3c282b"
  review-text: "#ffb2a6"
  error-surface: "#3f252e"
  error-text: "#ffb4b9"
  error-border: "#aa5466"
  recorded-surface: "#19382f"
  recorded-text: "#aaf0cf"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(40px,4.7vw,68px)"
    fontWeight: 500
    lineHeight: 0.99
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  inspector-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  panel-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.875rem"
  supporting:
    fontFamily: "Outfit, sans-serif"
    fontSize: "13px"
    lineHeight: 1.55
  button:
    fontFamily: "Outfit, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0em"
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0em"
  data:
    fontFamily: "Outfit, sans-serif"
    fontSize: "12px"
  table-label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.02em"
  status:
    fontFamily: "Outfit, sans-serif"
    fontSize: "11px"
    letterSpacing: "0em"
rounded:
  control: "4px"
  panel: "12px"
spacing:
  micro: "4px"
  inline: "8px"
  compact: "12px"
  gutter: "16px"
  panel-inset: "20px"
  outer: "24px"
components:
  button-primary:
    backgroundColor: "{colors.destino-yellow}"
    textColor: "{colors.tech-on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.survey-paper}"
    textColor: "{colors.survey-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
  button-secondary-hover:
    backgroundColor: "{colors.survey-muted}"
  button-disabled:
    backgroundColor: "{colors.survey-muted}"
    textColor: "{colors.survey-secondary}"
  input:
    backgroundColor: "{colors.survey-paper}"
    textColor: "{colors.survey-ink}"
    rounded: "{rounded.control}"
    height: "44px"
  nav-selected:
    backgroundColor: "{colors.selected-surface}"
    textColor: "{colors.tech-cyan}"
    rounded: "{rounded.control}"
  status-review:
    backgroundColor: "{colors.review-surface}"
    textColor: "{colors.review-text}"
    typography: "{typography.status}"
    rounded: "{rounded.control}"
  status-recorded:
    backgroundColor: "{colors.recorded-surface}"
    textColor: "{colors.recorded-text}"
    typography: "{typography.status}"
    rounded: "{rounded.control}"
  panel:
    backgroundColor: "{colors.survey-paper}"
    textColor: "{colors.survey-ink}"
    rounded: "{rounded.panel}"
  selected-reference:
    backgroundColor: "{colors.tech-cyan}"
    textColor: "{colors.tech-on-accent}"
    rounded: "{rounded.control}"
  marker:
    backgroundColor: "{colors.survey-paper}"
    textColor: "{colors.survey-ink}"
    rounded: "{rounded.control}"
    size: "32px"
---

# Design System: Azimut

## Overview

**Creative North Star: "Cartographic workshop"**

Azimut's current functional proposal is a cartographic workshop: geometric lettering, graphite working surfaces and a repeated azimuth bearing give a GIS tool an expressive identity. The lowercase wordmark and local Outfit face answer the user's rejection of the former typography and anonymous identity. This document records the implemented proposal; aesthetic acceptance by the user remains open.

Art comes from native vector geometry and restrained response to input. Working content retains ordinary buttons, inputs, tables, disclosures and a real map. Bright colors identify actions, selection, review and provenance; the bearing is a brand gesture and conveys no geographic evidence. The earlier Swiss comparison remains available as a legacy view and is outside this default system.

**Key Characteristics:**

- Locally served Outfit with tabular figures and a lowercase wordmark.
- Graphite layers with distinct action, selection, review and provenance colors.
- One repeated native azimuth symbol and finite, optional motion.
- Real cartographic geometry, visible evidence and standard web controls.

## Colors

Vivid functional accents sit on a cool graphite field. Frontmatter values are normative; the sidecar's synthesized tonal ramps are preview metadata, not additional application tokens.

### Primary

- **Action lime** (`destino-yellow`): primary processing and export actions, the opening import surface and brand arc. Its lighter hover value responds to interaction.
- **Accent ink** (`tech-on-accent`): readable dark lettering on lime and cyan.

### Secondary

- **Linked cyan** (`tech-cyan`): selected references, active navigation, focus, selected marker and actual street evidence.
- **Source violet** (`tech-violet`): provenance in the ledger and the title bearing.

### Tertiary

- **Review coral** (`survey-signal`): review counts and unavailable-source cues.
- **Review pair** (`review-surface`, `review-text`): warning and review badges.
- **Error pair** (`error-surface`, `error-text`, `error-border`): failed reads/exports and missing locations.
- **Recorded mint** (`recorded-surface`, `recorded-text`): registered method/status. This treatment follows the result's actual state.

### Neutral

- **Graphite canvas**, **working graphite**, and **muted graphite** (`tech-canvas`, `survey-paper`, `survey-muted`): page, panels and secondary states.
- **Pale ink**, **slate text**, **slate rule**, and **field border** (`survey-ink`, `survey-secondary`, `survey-rule`, `field-border`): readable hierarchy and controls.
- **White**: header/title and the dark import button.
- **Selected surface**: the muted cyan background shared by active navigation and a selected table row.

**The Linked Reference Rule.** Use cyan to connect the selected row reference, map number and evidence reference. Keep the same row identity visible in all three.

**The Evidence Before Certainty Rule.** Keep status words, method and source visible beside their colors. An evidence score must never become a probability or a metric-precision claim.

## Typography

**Display Font:** Outfit, with sans-serif fallback.  
**Body Font:** Outfit, with the same fallback.  
**Data Font:** Outfit with tabular numerals; no separate monospace face.

Outfit is self-hosted as a variable font (weights 100–900) with `font-display: swap`. The geometric face supplies both identity and dense data lettering. The lowercase wordmark uses a heavier weight (600), tight spacing and a native bearing beside it.

### Hierarchy

- **Display:** opening heading only; the token records the implemented fluid rule. Mobile overrides live in the sidecar.
- **Headline:** normal task heading after rows exist.
- **Inspector title:** the selected address; wraps without losing the row reference.
- **Panel title:** compact importer headings; the ledger heading has its observed local size (18px).
- **Body / Supporting:** base text and short explanatory paragraphs.
- **Button / Label:** ordinary controls and field labels.
- **Data / Status / Table label:** ledger values, status badges and column headings. Functional evidence labels are not a display-kicker pattern.

**The One Typeface Rule.** Use Outfit for display, controls, data and captions. Distinguish roles with size, weight and spacing; retain tabular numerals for coordinates and row references.

## Layout

The default surface uses a fluid grid with minimum-zero content columns, explicit bounded working regions and a repeated compact spacing rhythm. Desktop gutters use the recorded gutter step; inner panel content usually uses the panel-inset step. The header and outer desktop margin use the outer step.

The present batch workspace has three desktop columns (288px, flexible map, 300px evidence). Before rows, the importer is wider (320px) and the map spans the two right columns. With rows, a horizontal ledger spans the map/evidence width while the importer continues down the left. These are current surface compositions, not requirements for every future Azimut screen.

At the observed medium and narrow breakpoints, content moves into two columns and then an ordered single column. The table retains horizontal scrolling, sticky headings and a bounded body; it does not squeeze away its source/status columns. The sidecar records exact breakpoints, empty/populated composition, sizes and verification surfaces.

## Elevation & Depth

Graphite tone and fine slate borders define the main regions. Containers carry no general-purpose drop shadow. Floating Leaflet zoom controls retain the observed diffuse shadow; selected markers use an outline instead of a shadow.

**The Tonal Frames Rule.** Separate working regions with graphite tones and a fine slate boundary. Reserve the observed diffuse shadow for floating map controls.

## Shapes

Working panels and importer surfaces have gently rounded corners (`rounded.panel`); buttons, fields, status badges, map controls and numbered references use the smaller corner (`rounded.control`). Rectangular references remain legible and distinct from point geometry.

The signature azimuth uses an orbit, one quarter arc, crossing axes and a two-color needle. It repeats at different scales in the wordmark, opening title and importer. Use its existing native SVG geometry, not a glyph or a replacement icon family.

## Components

### Buttons

Primary actions use action lime and accent ink. Standard buttons have a minimum target height (44px), compact padding (12px 16px) and medium type. Hover lightens lime; secondary hover/pressed states use muted graphite. Disabled states use muted graphite and slate text. The empty import surface contains a dark button rather than a second lime action. Its target is slightly taller (48px).

Keyboard focus is a visible outline (2px, offset 3px): cyan within the workspace and lime in the header. Small arrow responses occur only on the implemented importer/primary-action icons.

### Inputs / Fields

Text and select controls have fixed height (`components.input.height`), a fine field border, dark fill and the small corner. Labels remain associated with inputs; placeholder and helper text use slate. File reads and processing retain their implemented disabled states.

### Navigation

Two ordinary buttons switch between batch and single-address work. The active page combines cyan text with the selected surface; hover uses muted graphite. The mobile header places navigation on a full-width second line with two equal controls. The legacy comparison link preserves the working session.

### Chips / Status

Compact badges use review, error, pending or recorded treatments, always accompanied by words. Manual corrections retain "Manual · revisar"; they do not adopt a verified visual state. Cyan references identify selection rather than evidence strength.

### Cards / Containers

Fine slate borders frame working graphite panels. Interior headings and content use the observed compact spacing. On desktop the importer and evidence can scroll internally; mobile exposes the full evidence content and collapses processed import settings into a disclosure.

### Importer

Before a file is selected, the single lime surface combines the bearing, two-line text and one dark import button. A selected file becomes a dashed-border graphite surface with filename and change-file control. Dragging shows the existing cyan outline. Read errors remain visible; export failures stay outside the mobile disclosure.

### Map and linked reference

Real OSM tiles remain attributed. Dark map tone is a presentation filter; the light-map button explicitly restores `filter: none`. Selection links the numbered marker, cyan ledger reference and evidence reference. The selected street trace uses the actual result polyline. Manual editing retains a crosshair cursor and the existing drag/click controls.

### Bearing and motion

A finite opening arc, mouse-bearing response, selected-marker arrival and real street trace provide the implemented expression. The SVG is hidden from assistive technology; it is a visual brand device. The sidecar records exact timing, easing, geometry and reduction behavior.

**The Steady Alternative Rule.** Reduced motion keeps the bearing, selected marker and street geometry visible while disabling decorative pointer rotation, drawing and transitions.

## Do's and Don'ts

### Do:

- **Do** use the existing accent roles and keep status text beside color.
- **Do** reuse the same row reference across table, marker and evidence.
- **Do** retain the locally served Outfit face, its OFL license and tabular figures.
- **Do** expose keyboard focus with the observed cyan outline and lime header outline.
- **Do** keep map attribution visible and restore unfiltered tiles in the light map view.
- **Do** keep manual locations marked for review and source failures visible.

### Don't:

- **Don't** present this recorded proposal as a user-approved visual identity.
- **Don't** add a second import action to the current batch entry state.
- **Don't** make branded bearing motion imply geographic direction or precision.
- **Don't** add decorative animation loops or restore pointer rotation under reduced motion.
- **Don't** replace actual map geometry with decorative cartographic imagery.
- **Don't** merge the legacy Swiss typography or palette into this default identity.

<!-- Extracted from src/components/destino.css, inherited control behavior in src/index.css, ControlPanel.tsx, WorkspaceMap.tsx and index.html on 2026-10-04. Browser evidence and extraction provenance are in .impeccable/design.json. -->
