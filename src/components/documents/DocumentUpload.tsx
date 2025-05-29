import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { documentsApi } from '../../services/api';
import { DOCUMENT_TYPES } from '../../config/constants';

interface DocumentUploadProps {
  memberId: number;
  onUploadSuccess: () => void;
}

const DocumentUpload = ({ memberId, onUploadSuccess }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Wybierz plik do przesłania');
      return;
    }

    try {
      setIsUploading(true);
      await documentsApi.uploadDocument(memberId, documentType, file);
      toast.success('Dokument został pomyślnie przesłany');
      setFile(null);
      setDocumentType(DOCUMENT_TYPES[0]);
      onUploadSuccess();
    } catch (error) {
      console.error('Błąd podczas przesyłania dokumentu:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Prześlij dokument</h3>
      
      <div className="mb-4">
        <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
          Typ dokumentu
        </label>
        <select
          id="document-type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
        >
          {DOCUMENT_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${dragActive ? 'border-[#0A2463] bg-[#0A2463]/5' : 'border-gray-300'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                <FileIcon extension={file.name.split('.').pop() || ''} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-1">Przeciągnij i upuść plik tutaj, lub</p>
            <label className="inline-block px-4 py-2 bg-[#0A2463] hover:bg-[#051b4a] text-white rounded-md transition-colors cursor-pointer">
              Przeglądaj pliki
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full px-4 py-2 bg-[#0A2463] hover:bg-[#051b4a] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Przesyłanie...
            </span>
          ) : (
            'Prześlij dokument'
          )}
        </button>
      </div>
    </div>
  );
};

// Helper components and functions
const FileIcon = ({ extension }: { extension: string }) => {
  const getIconColor = () => {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return 'text-red-500';
      case 'doc':
      case 'docx':
        return 'text-blue-500';
      case 'xls':
      case 'xlsx':
        return 'text-green-500';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`h-6 w-6 flex items-center justify-center ${getIconColor()}`}>
      {extension.toUpperCase()}
    </div>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bajtów';
  
  const k = 1024;
  const sizes = ['Bajtów', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default DocumentUpload;