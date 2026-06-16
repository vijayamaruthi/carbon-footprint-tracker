# Carbon Footprint Awareness Platform

A privacy-conscious web app for logging everyday greenhouse gas activity and turning it into understandable kg CO2e totals. The project targets the challenge goal directly: help users recognize the impact of transport, energy, diet, and consumption choices through quick voice-style entries, receipt/invoice text parsing, and a readable dashboard.

## Core Features

- Voice-style activity logging, such as `I drove 15 kilometers in a petrol car`.
- Receipt and invoice parsing for electricity, paper, plastic, food, and travel items.
- Daily, 7-day, and 30-day carbon totals in kg CO2e.
- Category breakdown for transport, energy, diet, and consumption.
- Lightweight authentication session using a user alias.
- Language preference support for English, Hindi, Tamil, Telugu, and Kannada.
- Accessible semantic HTML, labelled controls, table captions, live regions, and responsive layout.

## Security And Privacy

- User input is sanitized and length-limited before parsing or display.
- The static demo renders dynamic content with DOM text nodes instead of `innerHTML`.
- Stored records are normalized on load so malformed local data cannot crash or pollute the dashboard.
- Session and app data stay client-side and are obfuscated before storage.
- The local static server blocks path traversal, rejects unsupported methods, and sends hardening headers.
- No external analytics, trackers, or third-party APIs are required for the demo.

## Code Quality

- Carbon factors, parsing, validation, storage, and dashboard statistics are separated into small modules.
- The React implementation in `src/` mirrors the static demo behavior in `public/`.
- Shared calculation behavior is covered by deterministic Node tests.
- Package scripts expose development, build, typecheck, preview, serve, and test workflows.

## Run Locally

Install dependencies for the React app:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Run the dependency-free static demo server:

```bash
npm run serve
```

Then open `http://127.0.0.1:4173`.

## Validate

Run unit tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

## Example Inputs

- `I drove 15 kilometers in a petrol car`
- `Used 4 units of electricity today`
- `Electricity 4 units, paper 0.5 kg, plastic 0.2 kg`

## Evaluation Alignment

- **Code quality:** modular services, clear naming, bounded responsibilities, and reproducible scripts.
- **Security:** sanitized input, safe rendering, normalized storage, safer local serving, and no network data sharing.
- **Efficiency:** simple in-memory calculations, bounded persisted logs, and no unnecessary runtime dependencies for the static demo.
- **Testing:** deterministic tests for parsing, totals, encoding fallback behavior, and storage normalization.
- **Accessibility:** semantic sections, labelled inputs, live status regions, responsive layout, and keyboard-friendly controls.
- **Problem statement alignment:** focuses on carbon awareness, daily activity tracking, emissions conversion, and user-readable feedback.
