# 91Mail Design System

The interface adapts the Resend-inspired system for a compact public inbox. It uses no Resend logos, assets, or product copy.

## Direction

- True-black canvas with cool off-white text and translucent hairline borders.
- The generated address, expiry timer, and inbox state are the visual hierarchy; this is an operational surface, not a marketing landing page.
- Atmospheric blue and green glows provide depth without imagery or drop shadows.
- Georgia/Noto Serif SC substitutes for the unavailable editorial display face; system sans-serif handles all controls and body copy.

## Tokens

- Canvas `#000000`; card `#0a0a0c`; elevated `#101012`.
- Primary ink `#fcfdff`; body at 82% white; muted `#a1a4a5`.
- Semantic green `#11ff99`, blue `#3b9eff`, orange `#ff801f`, red `#ff4060`.
- Controls use 8px radius, cards 12–16px, pills fully rounded.
- Spacing follows a 4/8/12/16/24/32/48px rhythm.

## Components and states

- Primary action is the only solid-white control in the main viewport.
- Secondary controls use elevated black with a 16% white border.
- Inputs and buttons expose visible `focus-visible` outlines; disabled states retain shape and reduce opacity.
- Inbox includes loading, empty, populated, expired, rate-limited, and generic error states.
- Mail content is always rendered as plain text; no remote images or HTML execution.

## Responsive and accessibility

- Desktop content width is 960px; the message table collapses to a two-row item below 680px.
- Touch controls are at least 44px tall on mobile.
- Address and sender fields truncate without changing layout; message body wraps arbitrary strings.
- Motion is suppressed under `prefers-reduced-motion`.
