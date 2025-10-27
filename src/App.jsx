import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FileUploader from './components/FileUploader';
import EditorToolbar from './components/EditorToolbar';
import PDFViewer from './components/PDFViewer';
import { PDFDocument, StandardFonts } from 'pdf-lib';

function pxToPt(px) {
  return (px * 72) / 96;
}

export default function App() {
  const [fileMeta, setFileMeta] = useState(null); // { file, data: Uint8Array }
  const [scale, setScale] = useState(1);
  const [pagesInfo, setPagesInfo] = useState([]); // [{width,height}]
  const [textBoxesByPage, setTextBoxesByPage] = useState({}); // pageIndex -> [ { id, x,y,w,h,text,fontSize,fontFamily } ]
  const [selectedBox, setSelectedBox] = useState(null); // {id, pageIndex}

  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const pushHistory = useCallback((nextState) => {
    setHistory((h) => [...h, JSON.stringify(nextState)]);
    setFuture([]);
  }, []);

  // When a new PDF is loaded, reset state
  const onLoad = useCallback(({ file, data }) => {
    setFileMeta({ file, data });
    setScale(1);
    setPagesInfo([]);
    setTextBoxesByPage({});
    setSelectedBox(null);
    setHistory([]);
    setFuture([]);
  }, []);

  const onPagesInfo = useCallback((info) => {
    setPagesInfo(info);
  }, []);

  const onAddTextBox = useCallback((pageIndex, box) => {
    setTextBoxesByPage((prev) => {
      const pageArr = prev[pageIndex] ? [...prev[pageIndex]] : [];
      const withId = { id: crypto.randomUUID(), ...box };
      const next = { ...prev, [pageIndex]: [...pageArr, withId] };
      pushHistory(next);
      setSelectedBox({ id: withId.id, pageIndex });
      return next;
    });
  }, [pushHistory]);

  const onChangeTextBox = useCallback((id, pageIndex, updated) => {
    setTextBoxesByPage((prev) => {
      const pageArr = prev[pageIndex] ? [...prev[pageIndex]] : [];
      const idx = pageArr.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      pageArr[idx] = { ...updated };
      const next = { ...prev, [pageIndex]: pageArr };
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const onDeleteTextBox = useCallback((id, pageIndex) => {
    setTextBoxesByPage((prev) => {
      const pageArr = prev[pageIndex] ? [...prev[pageIndex]] : [];
      const nextArr = pageArr.filter((b) => b.id !== id);
      const next = { ...prev, [pageIndex]: nextArr };
      pushHistory(next);
      setSelectedBox(null);
      return next;
    });
  }, [pushHistory]);

  const onSelectBox = useCallback((id, pageIndex) => {
    if (!id) return setSelectedBox(null);
    setSelectedBox({ id, pageIndex });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setFuture((f) => [JSON.stringify(textBoxesByPage), ...f]);
      const prevState = JSON.parse(last);
      setTextBoxesByPage(prevState);
      setSelectedBox(null);
      return h.slice(0, -1);
    });
  }, [textBoxesByPage]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [first, ...rest] = f;
      setHistory((h) => [...h, JSON.stringify(textBoxesByPage)]);
      const nextState = JSON.parse(first);
      setTextBoxesByPage(nextState);
      setSelectedBox(null);
      return rest;
    });
  }, [textBoxesByPage]);

  const zoomIn = () => setScale((s) => Math.min(4, +(s + 0.1).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.25, +(s - 0.1).toFixed(2)));
  const resetZoom = () => setScale(1);

  const onDownload = useCallback(async () => {
    if (!fileMeta?.data) return;
    try {
      const pdfDoc = await PDFDocument.load(fileMeta.data, { ignoreEncryption: true });
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      // Draw text boxes per page
      Object.entries(textBoxesByPage).forEach(([pageIndexStr, boxes]) => {
        const pageIndex = Number(pageIndexStr);
        const page = pages[pageIndex];
        if (!page || !boxes || boxes.length === 0) return;

        const { height } = page.getSize();
        boxes.forEach((b) => {
          const xPt = pxToPt(b.x);
          // Convert top-left y in CSS to PDF bottom-left origin
          const yPtFromTop = pxToPt(b.y);
          const yPt = height - yPtFromTop - pxToPt(b.fontSize);
          page.drawText(b.text || '', {
            x: xPt,
            y: yPt,
            size: pxToPt(b.fontSize),
            font: helvetica,
            color: undefined,
          });
        });
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (fileMeta.file?.name?.replace(/\.pdf$/i, '') || 'edited') + '_edited.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export PDF.');
    }
  }, [fileMeta, textBoxesByPage]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="py-6 border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">PDF Editor</h1>
          <div className="text-sm text-neutral-500">Client-side, no upload</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {!fileMeta?.data && (
          <FileUploader onLoad={onLoad} />
        )}

        {fileMeta?.data && (
          <>
            <EditorToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              zoom={scale}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
              onDownload={onDownload}
            />
            <PDFViewer
              data={fileMeta.data}
              scale={scale}
              textBoxesByPage={textBoxesByPage}
              onAddTextBox={onAddTextBox}
              onChangeTextBox={onChangeTextBox}
              onDeleteTextBox={onDeleteTextBox}
              selectedBox={selectedBox}
              onSelectBox={onSelectBox}
              onPagesInfo={onPagesInfo}
            />
          </>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-neutral-500">
        Built with React, Tailwind, pdf.js, and pdf-lib. All processing happens in your browser.
      </footer>
    </div>
  );
}
