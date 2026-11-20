import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  selectedFile?: File | null;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  acceptedTypes = '*',
  maxSizeMB = 10,
  label = 'Déposez votre fichier ici',
  hint = 'ou cliquez pour parcourir',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Le fichier dépasse la taille maximale de ${maxSizeMB}MB`);
        return false;
      }
      setError(null);
      return true;
    },
    [maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFileRemove) {
      onFileRemove();
    }
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : error
            ? 'border-danger-500 bg-red-50/30'
            : 'border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-neutral-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {onFileRemove && (
              <button
                onClick={handleRemove}
                className="p-1.5 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-danger-500 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-neutral-700">{label}</p>
            <p className="text-xs text-neutral-500 mt-1">{hint}</p>
            <p className="text-xs text-neutral-400 mt-2">Max {maxSizeMB}MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger-500">{error}</p>}
    </div>
  );
};

export default FileDropZone;
