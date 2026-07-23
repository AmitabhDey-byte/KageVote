# KageVote — design system

## Product context

KageVote is a privacy-first community voting dApp for Midnight. A member proves that they are eligible to vote without exposing their identity; their vote remains private, while a public proposal and verifiable tally remain visible. The primary experience is a focused command centre: connect a wallet, inspect a proposal, cast a sealed vote, and follow the reveal / tally status.

## Audience and jobs to be done

- Privacy-conscious communities need trustworthy decisions without doxxing voters.
- Voters need to understand exactly what is public versus private before confirming.
- Organisers need a clear public tally and voting-window status, without a deanonymisation surface.

## Key screens and flows

1. Landing / mission introduction with privacy explainer.
2. Voting chamber: eligible status, proposal, option cards, private ballot confirmation, and receipt.
3. Results archive: public proposal metadata and tally only.
4. Privacy model panel: observer-visible versus protected data.

## Brand direction

Anime-inspired midnight command centre, borrowing from manga paneling and restrained Japanese sci-fi interfaces—not a parody or character art. The mood is calm, covert and trustworthy: ink-black space, moonlit paper, crimson seal accents, and a bright cyan privacy signal. Panels should feel like layered manga frames. Use diagonal speed-line flourishes sparingly as decorative CSS, never behind dense text.

Style source: adapt the selected **Red Noir Style** reference only for its cinematic dark layering, red emphasis, subtle grid texture, and composed entrance motion. Preserve the KageVote palette, hard-edged manga framing, and practical product-first hierarchy defined here; do not inherit its rounded glassmorphism, generic SaaS sections, or pricing patterns.

## Typography

- Display: `Bebas Neue`, sans-serif — uppercase, tightly tracked headings and numeric stats.
- Body / UI: `DM Sans`, sans-serif — readable UI text and labels.
- Mono: `Space Mono`, monospace — contract addresses, hashes, timestamps, status labels.
- H1: clamp(3.5rem, 8vw, 8rem), line-height .82, uppercase.
- H2: clamp(2rem, 4vw, 4rem), line-height .9, uppercase.
- Body: 1rem / 1.55.

## Palette

- `--ink`: `#09090B` — main canvas.
- `--ink-raised`: `#111114` — nav and elevated surfaces.
- `--paper`: `#F4F0E8` — high-contrast light panels / text.
- `--paper-muted`: `#C8C3B9` — secondary copy.
- `--line`: `rgba(244, 240, 232, 0.17)` — borders and dividers.
- `--moon`: `#E1D6FF` — moonlit lavender highlight.
- `--signal`: `#81F7D2` — verified privacy / live state.
- `--seal`: `#EE4B5D` — primary action and manga seal accent.
- `--warning`: `#F6C34D` — countdown / attention.

Use ink as the dominant background, paper for readable foreground text, seal for primary calls to action, and signal only for proof / success states. Never add a rainbow gradient or neon-purple gradient.

## Layout and spacing

- Full-bleed dark page with a 1240px content rail; 24px outer padding on desktop, 16px on mobile.
- 12-column desktop grid; collapse to one column under 760px.
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px.
- Main section rhythm: 96px desktop / 64px mobile.
- Cards: 1px solid `--line`, 0px radius or a very small 2px radius, intentional hard edges.
- Use 3–5px offset shadows in `--seal` or `--moon` only for selected, clickable, or focal objects.

## Components

- `TopNav`: wordmark KAGE//VOTE, three anchor links, green network indicator, wallet / demo control.
- `MangaTag`: compact mono label with a small square marker: `PREPROD`, `PRIVATE`, `PUBLIC TALLY`.
- `VoteOption`: stacked selectable option with keyboard focus, clear selected marker, and no suggestion of vote counts.
- `ProofStatus`: signal-coloured dot, monospace status, concise human explanation.
- `SplitDisclosure`: two-panel public/private explanation with distinct coloured leading rules.
- `Receipt`: contract-address / transaction-style information shown in mono with copy action.

## Motion

- Initial entry: panels rise 14px and fade in over 500–700ms; stagger by 80ms.
- Moon / orbital decoration: slow 18–24s linear rotation; respect `prefers-reduced-motion`.
- Buttons and cards: 160–220ms transform + colour transitions; selected card moves -2px with an offset shadow.
- Privacy proof: a one-time 600ms scan-line / pulse animation after casting a ballot; no infinite flashing.
- Hover: minimal `translateY(-2px)`, never scale text or cause layout shift.
- All non-essential animation is disabled under `prefers-reduced-motion`.

## Accessibility and usability

- Meet 4.5:1 contrast for text; do not rely on colour alone for selection/status.
- Use semantic buttons, visible focus rings in `--signal`, concise errors, and ARIA live regions for ballot progress.
- Keep the primary vote action pinned within the voting panel on desktop and accessible after option selection on mobile.
- Label the local simulator honestly as a demo; do not imply a production transaction or deployed contract when unavailable.

## Implementation notes

- Build with React, TypeScript and Vite. Use CSS variables and a single global stylesheet rather than a paid UI kit.
- Use Lucide icons if needed; use no paid plugins or proprietary image assets.
- The app’s copy must clearly distinguish: public proposal / open-close window / final tally from private eligibility witness / identity / ballot selection.
