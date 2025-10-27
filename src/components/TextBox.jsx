import React, { useEffect, useRef, useState } from 'react';

export default function TextBox({
  id,
  pageIndex,
  box,
  scale,
  selected,
  onSelect,
  onChange,
  onDelete,
}) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Focus when selected
  useEffect(() => {
    if (selected && ref.current) {
      ref.current.focus();
    }
  }, [selected]);

  const startDrag = (e) => {
    e.preventDefault();
    const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragging(true);
    setOffset({ x: startX - box.x * scale, y: startY - box.y * scale });
  };

  const onMove = (e) => {
    if (!dragging) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const newX = (clientX - offset.x) / scale;
    const newY = (clientY - offset.y) / scale;
    onChange(id, pageIndex, { ...box, x: Math.max(0, newX), y: Math.max(0, newY) });
  };

  const endDrag = () => setDragging(false);

  const handleInput = (e) => {
    onChange(id, pageIndex, { ...box, text: e.currentTarget.textContent || '' });
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      // allow select all inside contentEditable without selecting overlays
      e.stopPropagation();
    }
    if (e.key === 'Backspace' && (e.currentTarget.textContent || '').length === 0) {
      onDelete(id, pageIndex);
    }
  };

  const styles = {
    left: box.x * scale,
    top: box.y * scale,
    width: box.w * scale,
    minHeight: box.h * scale,
    fontSize: box.fontSize * scale,
    fontFamily: box.fontFamily || 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
  };

  return (
    <div
      className={`absolute group ${selected ? 'ring-2 ring-blue-500' : 'ring-1 ring-transparent hover:ring-blue-300'} bg-transparent`}
      style={styles}
      onMouseDown={(e) => { onSelect(id, pageIndex); startDrag(e); }}
      onTouchStart={(e) => { onSelect(id, pageIndex); startDrag(e); }}
      onMouseMove={onMove}
      onTouchMove={onMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchEnd={endDrag}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className="outline-none text-black leading-tight px-1 py-0.5 bg-white/50"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      >
        {box.text}
      </div>
      {selected && (
        <button
          className="absolute -top-3 -right-3 bg-white border border-neutral-300 rounded-full p-1 shadow hover:bg-neutral-50"
          onClick={(e) => { e.stopPropagation(); onDelete(id, pageIndex); }}
          title="Delete"
        >
          ×
        </button>
      )}
    </div>
  );
}
