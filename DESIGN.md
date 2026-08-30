---
version: alpha
name: Resumely
description: Ranked job matching from company career pages, scored against a resume.
colors:
  background: oklch(0.975 0.004 160)
  foreground: oklch(0.175 0.012 250)
  card: oklch(0.995 0.002 160)
  card-foreground: oklch(0.175 0.012 250)
  primary: oklch(0.175 0.012 250)
  primary-foreground: oklch(0.985 0.002 160)
  muted: oklch(0.95 0.006 160)
  muted-foreground: oklch(0.48 0.012 250)
  secondary: oklch(0.95 0.006 160)
  secondary-foreground: oklch(0.175 0.012 250)
  border: oklch(0.90 0.008 160)
  ring: oklch(0.55 0.012 250)
typography:
  sans:
    fontFamily: IBM Plex Sans
  heading:
    fontFamily: Fraunces
  mono:
    fontFamily: IBM Plex Mono
rounded:
  base: 0.625rem
---

## Overview

Resumely ranks live jobs from company career pages against a resume. The interface is a cool office shortlist: ink on paper, with the match percentage as the one memorable element.

## Colors

Page chrome uses `{colors.background}` and `{colors.foreground}`. Surfaces use `{colors.card}`. Interactive ink is `{colors.primary}`. `{colors.muted-foreground}` is secondary copy. Do not introduce a second accent on marketing or jobs surfaces.

## Typography

Headlines use `{typography.heading.fontFamily}` at medium weight. Body and controls use `{typography.sans.fontFamily}`. Match scores, counts, and step numbers use `{typography.mono.fontFamily}` with tabular numerals. Headings wrap with `text-balance`; paragraphs wrap with `text-pretty`.

## Layout

Public pages share a sticky header, `min-h-svh` shell, and a skip link to `#main`. The landing hero is a split: offer on the left, example ranked shortlist on the right. Jobs stay a ranked list, not a search-first card grid. Signed-in chrome is shadcn Sidebar + Inset. Chat is assistant-ui Thread. Resume preview (Times New Roman paper) is a document artifact, not app chrome.

## Shapes

Corner radius comes from `{rounded.base}`. Do not flatten to hairline newspaper rules and do not scale every surface to `rounded-2xl`.

## Components

Primary actions are verb plus outcome: Get matched, Browse jobs, Generate resume. Icon-only controls require an accessible name. Loading copy ends with an ellipsis. Empty states include one next action.

## Do's and Don'ts

Do lead with the match percentage in tabular type.

Do keep one ink accent per view.

Don't use purple, gradients, or glow as brand color.

Don't use `h-screen`; use `min-h-svh` or `h-dvh`.
