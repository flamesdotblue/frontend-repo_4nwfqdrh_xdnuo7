import React from 'react';
import { Undo2, Redo2, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

export default function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onDownload,
}) {
  return (
    <div className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2">
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${canUndo ? 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'}`}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 size={16} /> Undo
        </button>
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${canRedo ? 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'}`}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2 size={16} /> Redo
        </button>
        <div className="mx-2 w-px h-6 bg-neutral-200" />
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <div className="px-2 text-sm text-neutral-700 min-w-[80px] text-center">{Math.round(zoom * 100)}%</div>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800"
          onClick={onZoomIn}
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800"
          onClick={onResetZoom}
          title="Reset zoom"
        >
          <RotateCcw size={16} /> Reset
        </button>
        <div className="mx-2 w-px h-6 bg-neutral-200" />
        <button
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-md border text-sm bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
          onClick={onDownload}
          title="Download PDF"
        >
          <Download size={16} /> Download
        </button>
      </div>
    </div>
  );
}
