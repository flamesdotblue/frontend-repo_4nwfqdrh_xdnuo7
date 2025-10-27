import { useEffect, useRef, useState } from 'react'

export default function TextBox({
  id,
  pageIndex,
  box,
  zoom,
  selected,
  onChange,
  onSelect,
  onMove,
}) {
  const ref = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (selected && ref.current) ref.current.focus()
  }, [selected])

  const handleMouseDown = (e) => {
    if ((e.target).dataset.handle === 'resize') return
    setDragging(true)
    setStart({ x: e.clientX, y: e.clientY })
    e.stopPropagation()
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    const dx = (e.clientX - start.x) / zoom
    const dy = (e.clientY - start.y) / zoom
    setStart({ x: e.clientX, y: e.clientY })
    onMove(id, pageIndex, box.x + dx, box.y + dy)
  }

  const handleMouseUp = () => setDragging(false)

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  })

  const style = {
    left: box.x * zoom,
    top: box.y * zoom,
    width: box.w * zoom,
    height: box.h * zoom,
    fontSize: box.fontSize * zoom,
  }

  return (
    <div
      className={`absolute group rounded ${selected ? 'ring-2 ring-blue-500' : 'ring-1 ring-transparent hover:ring-blue-300'} bg-transparent`}
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(id, pageIndex) }}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full outline-none cursor-text bg-transparent text-black"
        onInput={(e) => onChange(id, pageIndex, { text: e.currentTarget.innerText })}
        style={{ fontFamily: box.fontFamily, lineHeight: 1.2, whiteSpace: 'pre-wrap' }}
      >
        {box.text}
      </div>
      {selected && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-[10px] px-1 rounded">Text</div>
      )}
    </div>
  )
}
