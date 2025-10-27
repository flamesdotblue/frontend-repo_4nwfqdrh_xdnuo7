import { useCallback, useEffect, useMemo, useState } from 'react'
import FileUploader from './components/FileUploader'
import EditorToolbar from './components/EditorToolbar'
import PDFViewer from './components/PDFViewer'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

function App() {
  const [file, setFile] = useState(null) // { arrayBuffer, name }
  const [zoom, setZoom] = useState(1)
  const [textBoxes, setTextBoxes] = useState({}) // { [pageIndex]: { [id]: {x,y,w,h,text,fontSize,fontFamily} } }
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])

  // History management
  const pushHistory = useCallback((state) => {
    setHistory((h) => [...h, state])
    setFuture([])
  }, [])

  useEffect(() => {
    // push initial state when textBoxes change from user actions
    // To avoid infinite loops, we push snapshots only when textBoxes is updated via setTextBoxes calls in children
    // Here we track by reference changes and store a deep copy
  }, [textBoxes])

  const setTextBoxesTracked = (updater) => {
    setTextBoxes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      pushHistory(JSON.stringify(prev))
      return next
    })
  }

  const canUndo = history.length > 0
  const canRedo = future.length > 0

  const handleUndo = () => {
    if (!canUndo) return
    const prevState = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setFuture((f) => [JSON.stringify(textBoxes), ...f])
    setTextBoxes(JSON.parse(prevState))
  }

  const handleRedo = () => {
    if (!canRedo) return
    const nextState = future[0]
    setFuture((f) => f.slice(1))
    setHistory((h) => [...h, JSON.stringify(textBoxes)])
    setTextBoxes(JSON.parse(nextState))
  }

  const handleLoad = ({ arrayBuffer, name }) => {
    setFile({ arrayBuffer, name })
    setZoom(1)
    setTextBoxes({})
    setHistory([])
    setFuture([])
    setSelected(null)
  }

  const zoomIn = () => setZoom((z) => Math.min(3, z + 0.1))
  const zoomOut = () => setZoom((z) => Math.max(0.3, z - 0.1))
  const zoomReset = () => setZoom(1)

  const handleDownload = async () => {
    if (!file?.arrayBuffer) return
    const pdfDoc = await PDFDocument.load(file.arrayBuffer)

    // Embed a standard font as fallback
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const pages = pdfDoc.getPages()
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const pageBoxes = textBoxes[i]
      if (!pageBoxes) continue

      const pageHeightPt = page.getHeight()

      // We stored x,y,w,h in CSS pixels at pdfjs viewport scale=1
      // Convert CSS px to PDF points: points = px * 72 / 96
      const toPt = (px) => (px * 72) / 96

      Object.values(pageBoxes).forEach((box) => {
        const xPt = toPt(box.x)
        // In PDF coordinate system origin is bottom-left, so convert from top-left y
        const yPt = pageHeightPt - toPt(box.y) - toPt(box.h)
        const fontSize = toPt(box.fontSize)
        page.drawText(box.text, {
          x: xPt,
          y: yPt,
          size: fontSize,
          font: helvetica,
          color: rgb(0, 0, 0),
          lineHeight: fontSize * 1.2,
          maxWidth: toPt(box.w),
        })
      })
    }

    const bytes = await pdfDoc.save()
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const base = file.name?.replace(/\.pdf$/i, '') || 'document'

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}-edited.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">PDF Editor</h1>
          <div className="text-sm text-slate-600">No upload to server. All processing happens in your browser.</div>
        </div>

        {!file && (
          <div className="mt-2">
            <FileUploader onLoad={handleLoad} />
          </div>
        )}

        {file && (
          <div className="flex flex-col gap-4">
            <EditorToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onZoomReset={zoomReset}
              onDownload={handleDownload}
              fileName={file?.name}
            />

            <div
              className="border rounded-xl bg-slate-100 overflow-hidden"
              onClick={() => setSelected(null)}
            >
              <PDFViewer
                file={file}
                zoom={zoom}
                textBoxes={textBoxes}
                setTextBoxes={setTextBoxesTracked}
                selected={selected}
                setSelected={setSelected}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
