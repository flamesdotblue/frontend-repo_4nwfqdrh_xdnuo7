import { Download, Redo2, Undo2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export default function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDownload,
  fileName,
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border rounded-xl shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-3 py-2 rounded-md border ${canUndo ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-3 py-2 rounded-md border ${canRedo ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button onClick={onZoomOut} className="px-3 py-2 rounded-md border hover:bg-gray-50">
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="text-sm tabular-nums w-20 text-center">{Math.round(zoom * 100)}%</div>
        <button onClick={onZoomIn} className="px-3 py-2 rounded-md border hover:bg-gray-50">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={onZoomReset} className="px-3 py-2 rounded-md border hover:bg-gray-50">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onDownload} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Download{fileName ? `: ${fileName.replace(/\.pdf$/i,'')}-edited.pdf` : ''}</span>
        </button>
      </div>
    </div>
  )
}
