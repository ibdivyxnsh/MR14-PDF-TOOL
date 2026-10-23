# PDF KING Studio

A premium, futuristic document and image workspace. This starter is a browser-first React + TypeScript + Vite app with local-first PDF operations.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deploy to Render (free static site)

1. Create a GitHub repository and push this project.
2. In Render, choose **New → Static Site** and connect the repository.
3. Build command: `npm ci && npm run build`
4. Publish directory: `dist`
5. Deploy.

A `render.yaml` Blueprint is included as a starting point. Render's free static-site availability and plan terms can change; verify current terms in Render's dashboard.

## Current working features

- Responsive animated dashboard with navigation and tool search.
- Drag-and-drop / file picker for PDFs and common images.
- Local PDF merge, split-by-page, and rotate pages.
- Local image conversion/resizing to PNG/JPEG/WebP.
- No document upload to a server in this starter.
- Processing feedback, download outputs, and error messages.

## Architecture

- **UI:** React, TypeScript, Vite, Lucide icons, CSS animations.
- **PDF engine:** `pdf-lib` for supported structural edits; PDF.js can be added for a richer multi-page viewer.
- **Local image engine:** Browser Canvas APIs.
- **Later server adapters:** OCRmyPDF, qpdf, LibreOffice and other engines can be added behind explicit server-side tool adapters when needed. Do not send files to a server without clear user consent and a privacy notice.

## Limitations

- This is a first working foundation, not the final full suite.
- PDF-to-image rasterization for arbitrary PDFs needs a renderer such as PDF.js; it is not implemented in this starter yet.
- PDF text editing, OCR, Office conversion, password removal, archive extraction and advanced repair are not implemented yet.
- Password-protected/encrypted PDFs may not be supported by `pdf-lib`.
- Compression results vary; this starter does not claim universal size reduction.

## Security and licensing

Treat files as untrusted input. Before adding server processing, set upload limits, timeouts, temporary-file cleanup, sandboxing, rate limits and safe archive extraction. Review licenses of all dependencies and native tools before redistribution or commercial use.
