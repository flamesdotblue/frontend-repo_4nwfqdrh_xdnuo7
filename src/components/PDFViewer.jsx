import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

// Render pages and overlay editable text boxes.
export default function PDFViewer({
  data,
  scale,
  textBoxesByPage,
  onAddTextBox,
  onChangeTextBox,
  onDeleteTextBox,
  selectedBox,
  onSelectBox,
  onPagesInfo,
}) {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]); // { width, height } at scale 1
  const pdfRef = useRef(null);

  // Prepare a safe copy to avoid ArrayBuffer detachment issues when pdf.js transfers it to worker
  const pdfDataForLoad = useMemo(() => (data ? new Uint8Array(data) : null), [data]);

  // Load document
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!pdfDataForLoad) return;
      try {
        const loadingTask = getDocument({ data: pdfDataForLoad, useWorkerFetch: false });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        const total = pdf.numPages;
        const pageDims = [];
        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          pageDims.push({ width: vp.width, height: vp.height });
        }
        setPages(pageDims);
        onPagesInfo?.(pageDims);
      } catch (err) {
        console.error('Failed to load PDF', err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pdfDataForLoad, onPagesInfo]);

  // Render each page to canvas with DPR-aware scaling
  const canvasesRef = useRef([]);
  useEffect(() => {
    async function render() {
      const pdf = pdfRef.current;
      if (!pdf || pages.length === 0) return;
      const dpr = window.devicePixelRatio || 1;
      for (let i = 1; i <= pages.length; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = canvasesRef.current[i - 1];
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        // Set canvas size for crisp rendering
        canvas.width = Math.floor(vp.width * dpr);
        canvas.height = Math.floor(vp.height * dpr);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;
        const renderContext = {
          canvasContext: ctx,
          viewport: vp,
          transform: [dpr, 0, 0, dpr, 0, 0],
          intent: 'display',
        };
        await page.render(renderContext).promise;
      }
    }
    render();
  }, [pages, scale]);

  const handlePageClick = (e, pageIndex) => {
    const pageRect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - pageRect.left) / scale;
    const y = (e.clientY - pageRect.top) / scale;
    const defaultBox = {
      x: Math.max(0, x - 40),
      y: Math.max(0, y - 10),
      w: 160,
      h: 28,
      text: 'Text',
      fontSize: 14,
      fontFamily: 'Helvetica',
    };
    onAddTextBox(pageIndex, defaultBox);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-6">
      {pages.map((p, idx) => (
        <div key={idx} className="relative shadow border border-neutral-200" style={{ width: p.width * scale }}>
          <canvas ref={(el) => (canvasesRef.current[idx] = el)} />
          {/* Overlay boxes */}
          <div
            className="absolute inset-0"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onSelectBox(null, idx); }}
            onClick={(e) => handlePageClick(e, idx)}
          >
            {(textBoxesByPage[idx] || []).map((box, i) => (
              <React.Fragment key={box.id}>
                <TextBox
                  id={box.id}
                  pageIndex={idx}
                  box={box}
                  scale={scale}
                  selected={selectedBox && selectedBox.id === box.id && selectedBox.pageIndex === idx}
                  onSelect={onSelectBox}
                  onChange={onChangeTextBox}
                  onDelete={onDeleteTextBox}
                />
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Local import to avoid circular dependency warnings
import TextBox from './TextBox';
