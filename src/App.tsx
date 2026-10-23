import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive, ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Check, ChevronDown,
  CircleHelp, Command, FileImage, FilePlus2, FileText, Files, Film, FolderOpen,
  Gauge, Image as ImageIcon, Layers3, Menu, Moon, MoreHorizontal, RotateCw,
  ScanText, Search, Settings2, ShieldCheck, Sparkles, UploadCloud, WandSparkles,
  X, Zap, FileStack, Combine, Split, RotateCcw, Download, Trash2, LockKeyhole,
} from 'lucide-react'
import { PDFDocument, degrees } from 'pdf-lib'

type Tool = {
  id: string
  name: string
  description: string
  category: string
  icon: typeof FileText
  accent: string
  tags: string[]
}
type PickedFile = { file: File; id: string }

const tools: Tool[] = [
  { id: 'merge', name: 'Merge PDF', description: 'Combine documents into one clean file.', category: 'PDF Studio', icon: Combine, accent: 'violet', tags: ['join', 'combine', 'merge'] },
  { id: 'split', name: 'Split PDF', description: 'Export each page as its own PDF.', category: 'PDF Studio', icon: Split, accent: 'blue', tags: ['separate', 'extract', 'pages'] },
  { id: 'rotate', name: 'Rotate PDF', description: 'Rotate every page in a document.', category: 'PDF Studio', icon: RotateCw, accent: 'cyan', tags: ['turn', 'orientation'] },
  { id: 'images', name: 'Image Converter', description: 'Convert images between common formats.', category: 'Image Lab', icon: FileImage, accent: 'pink', tags: ['jpg', 'png', 'webp', 'convert'] },
  { id: 'resize', name: 'Image Resizer', description: 'Resize images with control over dimensions.', category: 'Image Lab', icon: ArrowLeftRight, accent: 'orange', tags: ['scale', 'dimensions'] },
  { id: 'archive', name: 'ZIP Workspace', description: 'A future home for archive tools.', category: 'File Forge', icon: Archive, accent: 'green', tags: ['zip', 'compress', 'extract'] },
  { id: 'ocr', name: 'OCR Scanner', description: 'Make scanned documents searchable.', category: 'Smart Tools', icon: ScanText, accent: 'purple', tags: ['text', 'scan', 'recognition'] },
  { id: 'protect', name: 'Protect PDF', description: 'A future home for document protection.', category: 'PDF Studio', icon: LockKeyhole, accent: 'blue', tags: ['password', 'secure'] },
]

const categories = [
  { name: 'Overview', icon: Layers3 },
  { name: 'PDF Studio', icon: FileText },
  { name: 'Image Lab', icon: ImageIcon },
  { name: 'File Forge', icon: Archive },
  { name: 'Smart Tools', icon: Sparkles },
]

function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export default function App() {
  const [active, setActive] = useState('Overview')
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<PickedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toolModal, setToolModal] = useState<Tool | null>(null)
  const [imageFormat, setImageFormat] = useState('image/webp')
  const [resizeWidth, setResizeWidth] = useState('1200')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming)
    const accepted = list.filter((f) =>
      f.type === 'application/pdf' || f.type.startsWith('image/'),
    )
    if (accepted.length !== list.length) setNotice('Some files were skipped. Choose PDF or image files.')
    if (!accepted.length) return
    setFiles((prev) => {
      const additions = accepted.map((file) => ({ file, id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}` }))
      return [...prev, ...additions]
    })
    setNotice(`${accepted.length} file${accepted.length === 1 ? '' : 's'} added. Files stay on this device.`)
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setToolModal(null)
        setMobileMenu(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const visibleTools = useMemo(() => tools.filter((tool) => {
    const matchesCategory = active === 'Overview' || tool.category === active
    const haystack = `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(' ')}`.toLowerCase()
    return matchesCategory && haystack.includes(query.toLowerCase())
  }), [active, query])

  const pdfFiles = files.filter((f) => f.file.type === 'application/pdf')
  const imageFiles = files.filter((f) => f.file.type.startsWith('image/'))

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  async function runTool(tool: Tool) {
    if (tool.id === 'archive' || tool.id === 'ocr' || tool.id === 'protect') {
      setToolModal(tool)
      return
    }
    setBusy(true)
    setNotice('')
    try {
      if (tool.id === 'merge') {
        if (pdfFiles.length < 2) throw new Error('Add at least two PDF files to merge.')
        const merged = await PDFDocument.create()
        for (const item of pdfFiles) {
          const source = await PDFDocument.load(await item.file.arrayBuffer())
          const pages = await merged.copyPages(source, source.getPageIndices())
          pages.forEach((page) => merged.addPage(page))
        }
        const bytes = await merged.save()
        saveBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), 'pdf-king-merged.pdf')
        setNotice(`Merged ${pdfFiles.length} PDFs successfully.`)
      } else if (tool.id === 'split') {
        if (!pdfFiles.length) throw new Error('Add a PDF first.')
        if (pdfFiles.length > 1) throw new Error('Choose one PDF at a time for Split PDF.')
        const source = await PDFDocument.load(await pdfFiles[0].file.arrayBuffer())
        if (source.getPageCount() < 2) throw new Error('This PDF has only one page, so it cannot be split into multiple page files.')
        for (let i = 0; i < source.getPageCount(); i++) {
          const output = await PDFDocument.create()
          const [page] = await output.copyPages(source, [i])
          output.addPage(page)
          const bytes = await output.save()
          saveBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `page-${String(i + 1).padStart(2, '0')}.pdf`)
        }
        setNotice(`Exported ${source.getPageCount()} individual page PDFs.`)
      } else if (tool.id === 'rotate') {
        if (!pdfFiles.length) throw new Error('Add a PDF first.')
        const source = await PDFDocument.load(await pdfFiles[0].file.arrayBuffer())
        source.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + 90) % 360)))
        const bytes = await source.save()
        saveBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), 'pdf-king-rotated.pdf')
        setNotice('Rotated all pages 90° clockwise.')
      } else if (tool.id === 'images') {
        if (!imageFiles.length) throw new Error('Add one or more image files first.')
        for (const item of imageFiles) await convertImage(item.file, imageFormat)
        setNotice(`Converted ${imageFiles.length} image${imageFiles.length === 1 ? '' : 's'}.`)
      } else if (tool.id === 'resize') {
        if (!imageFiles.length) throw new Error('Add an image first.')
        const width = Number(resizeWidth)
        if (!Number.isFinite(width) || width < 1 || width > 12000) throw new Error('Enter a width between 1 and 12,000 pixels.')
        for (const item of imageFiles) await resizeImage(item.file, width)
        setNotice(`Resized ${imageFiles.length} image${imageFiles.length === 1 ? '' : 's'}.`)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Something went wrong while processing this file.')
    } finally {
      setBusy(false)
    }
  }

  function convertImage(file: File, mime: string) {
    return new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Could not create image canvas.')); return }
        ctx.drawImage(image, 0, 0)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url)
          if (!blob) { reject(new Error('This image format could not be converted.')); return }
          const ext = mime.split('/')[1].replace('jpeg', 'jpg')
          saveBlob(blob, `${file.name.replace(/\.[^.]+$/, '')}.${ext}`)
          resolve()
        }, mime, 0.9)
      }
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not read ${file.name}.`)) }
      image.src = url
    })
  }

  function resizeImage(file: File, width: number) {
    return new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        const targetWidth = Math.min(width, image.naturalWidth)
        const targetHeight = Math.max(1, Math.round(image.naturalHeight * targetWidth / image.naturalWidth))
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Could not create image canvas.')); return }
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url)
          if (!blob) { reject(new Error('Could not resize image.')); return }
          saveBlob(blob, `${file.name.replace(/\.[^.]+$/, '')}-${targetWidth}px.webp`)
          resolve()
        }, 'image/webp', 0.9)
      }
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not read ${file.name}.`)) }
      image.src = url
    })
  }

  return (
    <div className="app-shell" onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false) }} onDrop={handleDrop}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => { setActive('Overview'); setMobileMenu(false) }} aria-label="PDF KING Studio home">
          <span className="brand-mark"><Layers3 size={21} /></span>
          <span className="brand-copy"><strong>PDF KING</strong><small>STUDIO</small></span>
          <span className="brand-spark"><Sparkles size={15} /></span>
        </button>
        <div className="workspace-pill"><span className="status-dot" /> PERSONAL WORKSPACE <ChevronDown size={13} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav">
          {categories.map((category) => {
            const Icon = category.icon
            return <button key={category.name} className={`nav-item ${active === category.name ? 'active' : ''}`} onClick={() => { setActive(category.name); setMobileMenu(false) }}>
              <Icon size={17} strokeWidth={1.8} /><span>{category.name}</span>{category.name === 'Overview' && <span className="nav-indicator" />}
            </button>
          })}
        </nav>
        <div className="nav-label tools-label">QUICK ACCESS</div>
        <button className="nav-item" onClick={() => { setFiles([]); setNotice('Workspace cleared.') }}><RotateCcw size={17} /><span>Clear workspace</span></button>
        <button className="nav-item" onClick={() => setToolModal({ id: 'privacy', name: 'Privacy by design', description: 'Files are processed locally in this first version.', category: 'System', icon: ShieldCheck, accent: 'green', tags: [] })}><ShieldCheck size={17} /><span>Privacy center</span><span className="tiny-check"><Check size={11}/></span></button>
        <div className="sidebar-spacer" />
        <div className="upgrade-card">
          <div className="upgrade-orb"><Zap size={17} fill="currentColor" /></div>
          <strong>Your creative space.</strong>
          <p>Powerful tools. Your files. Your control.</p>
          <div className="free-tag"><span /> FREE CORE TOOLS</div>
        </div>
        <div className="profile-row">
          <div className="avatar">K</div>
          <div className="profile-copy"><strong>Studio workspace</strong><small>Local session</small></div>
          <MoreHorizontal size={18} className="muted-icon" />
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-btn icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu size={19}/></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{active}</strong></div>
          <div className="top-actions">
            <div className="search-box"><Search size={16}/><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools..." aria-label="Search tools"/><kbd>⌘ K</kbd></div>
            <button className="icon-button" title="Settings" onClick={() => setToolModal({ id: 'settings', name: 'Studio settings', description: 'Settings will grow with the workspace.', category: 'System', icon: Settings2, accent: 'violet', tags: [] })}><Settings2 size={17}/></button>
            <div className="top-divider" />
            <div className="privacy-chip"><ShieldCheck size={14}/> Local-first</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div className="welcome-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> YOUR CREATIVE COMMAND CENTER</div>
              <h1>Make files work<br/>for <span className="gradient-text">you.</span></h1>
              <p>One considered workspace for documents, images, and everything in between.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => inputRef.current?.click()}><UploadCloud size={17}/> Add files <ArrowUpRight size={15}/></button>
                <span className="safe-note"><ShieldCheck size={14}/> Files stay on your device</span>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="orbit orbit-outer"/><div className="orbit orbit-inner"/>
              <div className="hero-glow"/>
              <div className="floating-chip chip-top"><FileText size={15}/><span>PDF</span><i/></div>
              <div className="floating-chip chip-bottom"><ImageIcon size={15}/><span>IMAGE</span><i/></div>
              <div className="hero-core"><div className="core-ring"><Layers3 size={43}/></div><span>STUDIO</span></div>
              <div className="orbit-dot dot-one"/><div className="orbit-dot dot-two"/><div className="orbit-dot dot-three"/>
            </div>
          </section>

          <section className={`dropzone ${dragging ? 'dropzone-active' : ''}`} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}>
            <div className="upload-icon"><UploadCloud size={22}/></div>
            <div className="drop-copy"><strong>{dragging ? 'Drop to add to your workspace' : 'Drop your files here'}</strong><span>or <em>browse your device</em> to get started</span></div>
            <div className="drop-formats"><span>PDF</span><span>JPG</span><span>PNG</span><span>WEBP</span></div>
            <input ref={inputRef} type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.currentTarget.value = '' }}/>
          </section>

          {files.length > 0 && <section className="files-panel">
            <div className="section-heading"><div><span className="section-kicker">YOUR WORKSPACE</span><h2>Ready to work <span className="count-pill">{files.length}</span></h2></div><button className="text-button" onClick={() => setFiles([])}><Trash2 size={14}/> Clear all</button></div>
            <div className="file-list">{files.map(({ file, id }) => <div className="file-row" key={id}>
              <div className={`file-type-icon ${file.type === 'application/pdf' ? 'pdf-icon' : 'image-icon'}`}>{file.type === 'application/pdf' ? <FileText size={18}/> : <ImageIcon size={18}/>}</div>
              <div className="file-info"><strong>{file.name}</strong><span>{file.type === 'application/pdf' ? 'PDF document' : file.type || 'Image'} · {prettySize(file.size)}</span></div>
              <span className="local-label"><ShieldCheck size={13}/> Local</span>
              <button className="remove-file" aria-label={`Remove ${file.name}`} onClick={() => setFiles((prev) => prev.filter((item) => item.id !== id))}><X size={16}/></button>
            </div>)}</div>
          </section>}

          {notice && <div className={`notice ${notice.includes('successfully') || notice.includes('Converted') || notice.includes('Resized') || notice.includes('Rotated') || notice.includes('Exported') ? 'notice-success' : ''}`} role="status"><span className="notice-mark">{notice.includes('successfully') || notice.includes('Converted') || notice.includes('Resized') || notice.includes('Rotated') || notice.includes('Exported') ? <Check size={15}/> : <Sparkles size={15}/>}</span><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15}/></button></div>}

          <section className="tools-section">
            <div className="section-heading"><div><span className="section-kicker">THE TOOLKIT</span><h2>{active === 'Overview' ? 'Tools for every workflow' : active}<span className="heading-period">.</span></h2></div><button className="view-all" onClick={() => { setActive('Overview'); setQuery('') }}>Explore all tools <ArrowUpRight size={15}/></button></div>
            <div className="tool-filters">
              {['All tools', 'PDF Studio', 'Image Lab', 'File Forge', 'Smart Tools'].map((item) => <button key={item} className={`filter-chip ${(active === 'Overview' ? item === 'All tools' : active === item) ? 'filter-active' : ''}`} onClick={() => setActive(item === 'All tools' ? 'Overview' : item)}>{item}</button>)}
            </div>
            <div className="tool-grid">
              {visibleTools.map((tool, index) => {
                const Icon = tool.icon
                const isReady = ['merge', 'split', 'rotate', 'images', 'resize'].includes(tool.id)
                return <button key={tool.id} className={`tool-card ${tool.accent}`} style={{ animationDelay: `${index * 55}ms` }} onClick={() => isReady ? void runTool(tool) : setToolModal(tool)}>
                  <div className="tool-card-top"><div className="tool-icon"><Icon size={20} strokeWidth={1.8}/></div><span className={`tool-status ${isReady ? 'status-ready' : ''}`}>{isReady ? <><span/> READY</> : 'COMING UP'}</span></div>
                  <div className="tool-card-copy"><h3>{tool.name}</h3><p>{tool.description}</p></div>
                  <div className="tool-card-footer"><span>{tool.category}</span><span className="tool-arrow"><ArrowUpRight size={16}/></span></div>
                </button>
              })}
              {visibleTools.length === 0 && <div className="empty-state"><Search size={23}/><strong>No tools found</strong><span>Try a different search or category.</span></div>}
            </div>
          </section>

          <section className="bottom-strip">
            <div className="bottom-icon"><Gauge size={18}/></div><div><strong>Designed for focus. Built for speed.</strong><span>Local-first processing means your files don't need to leave your device.</span></div><div className="bottom-status"><span/> SYSTEM READY</div>
          </section>
          <footer><span>© 2026 PDF KING Studio</span><span className="footer-center"><span/> MADE FOR YOUR WORKFLOW</span><span><ShieldCheck size={13}/> Privacy-first by design</span></footer>
        </div>
      </main>

      {dragging && <div className="drag-overlay"><div><UploadCloud size={38}/><strong>Drop to add files</strong><span>PDFs and images · processed locally</span></div></div>}
      {toolModal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setToolModal(null) }}>
        <div className="modal-card">
          <button className="modal-close icon-button" onClick={() => setToolModal(null)} aria-label="Close"><X size={18}/></button>
          <div className={`modal-tool-icon ${toolModal.accent}`}><toolModal.icon size={25}/></div>
          <div className="modal-eyebrow">{toolModal.category}</div>
          <h2>{toolModal.name}</h2><p>{toolModal.description}</p>
          {toolModal.id === 'images' && <label className="field-label">Output format<select value={imageFormat} onChange={(e) => setImageFormat(e.target.value)}><option value="image/webp">WebP — compact</option><option value="image/png">PNG — lossless</option><option value="image/jpeg">JPEG — widely compatible</option></select></label>}
          {toolModal.id === 'resize' && <label className="field-label">Maximum width (pixels)<input value={resizeWidth} onChange={(e) => setResizeWidth(e.target.value)} inputMode="numeric"/></label>}
          {['merge','split','rotate','images','resize'].includes(toolModal.id) ? <button className="primary-button modal-action" onClick={() => { void runTool(toolModal); setToolModal(null) }}>Run tool <ArrowUpRight size={16}/></button> : <div className="coming-panel"><Sparkles size={17}/><div><strong>On the roadmap</strong><span>This workspace is designed to grow. This tool is not implemented in this first version yet.</span></div></div>}
          {toolModal.id === 'privacy' && <div className="privacy-details"><ShieldCheck size={17}/><span>This first version performs supported PDF and image operations in your browser. It does not upload your selected files to a PDF KING server.</span></div>}
          {toolModal.id === 'settings' && <div className="privacy-details"><Settings2 size={17}/><span>More controls, motion preferences, keyboard shortcuts and workspace settings will be added as the suite grows.</span></div>}
          <div className="modal-foot"><ShieldCheck size={13}/> YOUR FILES STAY IN YOUR BROWSER</div>
        </div>
      </div>}
      {busy && <div className="processing-toast"><span className="spinner"/><span>Processing locally…</span></div>}
    </div>
  )
}
