import { useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import TextBox from './TextBox'

// Worker setup for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

const CSS_UNITS = 96.0 / 72.0

export default function PDFViewer({
  file,
  zoom,
  textBoxes,
  setTextBoxes,
  selected,
  setSelected,
}) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [pageSizes, setPageSizes] = useState([]) // in CSS px at scale=1

  const docPromise = useMemo(() => {
    if (!file?.arrayBuffer) return null
    return pdfjs.getDocument({ data: file.arrayBuffer }).promise
  }, [file])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!docPromise) return
      setLoading(true)
      try {
        const pdf = await docPromise
        if (cancelled) return
        setNumPages(pdf.numPages)
        const sizes = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1 })
          sizes.push({ width: viewport.width, height: viewport.height })
        }
        if (!cancelled) setPageSizes(sizes)
      } catch (e) {
        console.error(e)
        alert('Failed to load PDF')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [docPromise])

  const ensurePageBoxes = (pageIndex) => {
    setTextBoxes((prev) => {
      const next = { ...prev }
      if (!next[pageIndex]) next[pageIndex] = {}
      return next
    })
  }

  const addTextBox = (pageIndex, x, y) => {
    ensurePageBoxes(pageIndex)
    const id = crypto.randomUUID()
    setTextBoxes((prev) => {
      const next = { ...prev }
      const page = next[pageIndex] ? { ...next[pageIndex] } : {}
      page[id] = {
        x, y, w: 160, h: 28, text: 'Edit me', fontSize: 16, fontFamily: 'Helvetica'
      }
      next[pageIndex] = page
      return next
    })
    setSelected({ id, pageIndex })
  }

  const onMove = (id, pageIndex, x, y) => {
    setTextBoxes((prev) => ({
      ...prev,
      [pageIndex]: { ...prev[pageIndex], [id]: { ...prev[pageIndex][id], x, y } },
    }))
  }

  const onChange = (id, pageIndex, patch) => {
    setTextBoxes((prev) => ({
      ...prev,
      [pageIndex]: { ...prev[pageIndex], [id]: { ...prev[pageIndex][id], ...patch } },
    }))
  }

  const renderPage = async (canvas, pageIndex) => {
    if (!docPromise) return
    const pdf = await docPromise
    const page = await pdf.getPage(pageIndex + 1)
    const viewport = page.getViewport({ scale: zoom })

    const ctx = canvas.getContext('2d')
    canvas.width = Math.floor(viewport.width * window.devicePixelRatio)
    canvas.height = Math.floor(viewport.height * window.devicePixelRatio)
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport.clone({ dontFlip: true, scale: zoom * window.devicePixelRatio }),
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    await page.render(renderContext).promise
  }

  const handlePageClick = (e, pageIndex) => {
    const pageEl = e.currentTarget
    const rect = pageEl.getBoundingClientRect()
    const xCss = (e.clientX - rect.left)
    const yCss = (e.clientY - rect.top)
    const x = xCss / zoom
    const y = yCss / zoom
    addTextBox(pageIndex, x, y)
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto">
      {loading && (
        <div className="p-8 text-center text-gray-500">Loading PDF…</div>
      )}
      {!loading && !file && (
        <div className="p-8 text-center text-gray-500">Upload a PDF to start editing</div>
      )}
      {!loading && file && (
        <div className="mx-auto w-full max-w-5xl flex flex-col items-center gap-8 py-6">
          {Array.from({ length: numPages }).map((_, i) => (
            <PageView
              key={i}
              pageIndex={i}
              pageSize={pageSizes[i]}
              zoom={zoom}
              renderPage={renderPage}
              onClick={handlePageClick}
            >
              {textBoxes[i] && Object.entries(textBoxes[i]).map(([id, box]) => (
                <TextBox
                  key={id}
                  id={id}
                  pageIndex={i}
                  box={box}
                  zoom={zoom}
                  selected={selected && selected.id === id && selected.pageIndex === i}
                  onSelect={(id2, p) => setSelected({ id: id2, pageIndex: p })}
                  onMove={onMove}
                  onChange={onChange}
                />
              ))}
            </PageView>
          ))}
        </div>
      )}
    </div>
  )
}

function PageView({ pageIndex, pageSize, zoom, renderPage, onClick, children }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current || !pageSize) return
    renderPage(canvasRef.current, pageIndex)
  }, [pageIndex, pageSize, zoom])

  const width = (pageSize?.width || 612) * zoom
  const height = (pageSize?.height || 792) * zoom

  return (
    <div
      className="relative bg-white shadow-xl border rounded-md overflow-hidden"
      style={{ width, height }}
      onClick={(e) => onClick(e, pageIndex)}
    >
      <canvas ref={canvasRef} />
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }} />
      <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
