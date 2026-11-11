'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { validateFile } from '@/lib/storage/validation';
import type { StorageBucket } from '@/lib/storage/constants';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface MediaUploadDropzoneProps {
  bucket: StorageBucket;
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

export function MediaUploadDropzone({
  bucket,
  accept,
  multiple = false,
  onFilesSelected,
  disabled = false,
  label = 'Upload media',
  helperText,
}: MediaUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;
    setErrorMessage(null);

    const files = Array.from(fileList);
    // Validate each file
    for (const file of files) {
      const res = validateFile(bucket, file);
      if (!res.valid) {
        setErrorMessage(res.error || 'One or more files are invalid.');
        return;
      }
    }

    try {
      setIsProcessing(true);
      await onFilesSelected(files);
    } catch {
      setErrorMessage('Something got in the way while processing files.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-accent bg-accent/5 scale-[0.99]'
            : 'border-border bg-surface hover:border-accent/50'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || isProcessing}
        />

        <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
          {isProcessing ? (
            <Spinner size="md" />
          ) : (
            <UploadCloud className="w-8 h-8 text-secondary-text" />
          )}

          <div className="font-medium text-sm text-primary-text">{label}</div>

          {helperText && (
            <p className="text-xs text-muted-text max-w-xs">{helperText}</p>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2 pointer-events-auto"
            disabled={disabled || isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select {multiple ? 'Files' : 'File'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
