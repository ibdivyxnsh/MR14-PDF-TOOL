# PDF Studio

A premium, futuristic document and image workspace. This project uses React, TypeScript, and Vite, with browser-first PDF and image processing.

## Requirements

* Node.js 20.19+ or 22.12+
* npm

## Run Locally

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

## Deploy to Render

1. Push the project to GitHub.
2. Create a Static Site in Render.
3. Set the build command to `npm ci && npm run build`.
4. Set the publish directory to `dist`.
5. Deploy the application.

A `render.yaml` file is included as a starting point.

## Current Features

* Responsive, animated dashboard with navigation and tool search.
* Drag-and-drop file upload and file picker for PDFs and common images.
* Local PDF merging.
* Split PDFs into individual pages.
* Rotate PDF pages.
* Convert images to PNG, JPEG, and WebP.
* Resize images using browser Canvas APIs.
* Processing feedback, downloadable results, and error messages.

Files are processed locally in the browser by the implemented tools.

## Architecture

* **Frontend:** React, TypeScript, Vite, Lucide icons, and CSS animations.
* **PDF processing:** `pdf-lib` for supported structural edits.
* **Image processing:** Browser Canvas APIs.
* **Future backend:** Python, FastAPI, OCRmyPDF, qpdf, LibreOffice, and other suitable processing engines where needed.

## Limitations

This is an initial foundation, not the complete PDF KING Studio suite.

The following features still need implementation:

* PDF-to-image rasterization.
* OCR and scanned-document recognition.
* Office document conversion.
* Advanced PDF text editing.
* Archive extraction and creation.
* Advanced PDF repair and optimization.

Processing capabilities vary by file type and encryption.

## Security and Privacy

* Prefer local processing whenever practical.
* Treat uploaded files as untrusted input.
* Validate files and limit processing resources.
* Use appropriate timeouts and temporary-file cleanup for server processing.
* Clearly disclose server-side processing and obtain user consent where appropriate.
* Review dependency and native-tool licenses before redistribution.

## Development Roadmap

PDF KING Studio will expand incrementally into a broader PDF, image, document, and archive utility suite, with testing and GitHub commits after each meaningful feature.
