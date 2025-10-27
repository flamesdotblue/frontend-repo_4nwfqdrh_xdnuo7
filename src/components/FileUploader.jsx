import React, { useCallback, useRef, useState } from 'react';

export default function FileUploader({ onLoad }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = useCallback(async (files) => {
    const file = files && files[0];
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Keep a copy as Uint8Array to avoid transfer-related detach issues
      const uint8 = new Uint8Array(arrayBuffer);
      onLoad({ file, data: uint8 });
    } catch (e) {
      console.error(e);
      setError('Failed to read the file.');
    }
  }, [onLoad]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-neutral-300 hover:border-neutral-400'}`}
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-neutral-700">Drag and drop a PDF here, or click to select</p>
        <p className="text-xs text-neutral-500 mt-2">Only .pdf files are supported. All processing happens in your browser.</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
