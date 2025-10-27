import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

export default function FileUploader({ onLoad }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = async (files) => {
    const file = files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid .pdf file')
      return
    }
    const arrayBuffer = await file.arrayBuffer()
    onLoad({ arrayBuffer, name: file.name })
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        <div className="flex flex-col items-center gap-3">
          <UploadCloud className="h-8 w-8 text-blue-600" />
          <p className="text-gray-700 font-medium">Drag & drop a PDF here</p>
          <p className="text-sm text-gray-500">or</p>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>
    </div>
  )
}
