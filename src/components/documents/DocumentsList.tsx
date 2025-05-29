import { useState, useEffect } from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { documentsApi } from '../../services/api';

interface Document {
  id: number;
  filename: string;
  document_type: string;
  upload_date: string;
  file_size: number;
}

interface DocumentsListProps {
  memberId: number;
  refreshTrigger: number;
}

const DocumentsList = ({ memberId, refreshTrigger }: DocumentsListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [memberId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsApi.getMemberDocuments(memberId);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Błąd podczas pobierania dokumentów:', error);
      toast.error('Nie udało się pobrać dokumentów');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (documentId: number) => {
    try {
      await documentsApi.downloadDocument(documentId);
    } catch (error) {
      console.error('Błąd podczas pobierania dokumentu:', error);
      toast.error('Nie udało się pobrać dokumentu');
    }
  };

  const handleDelete = async (documentId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten dokument? Tej operacji nie można cofnąć.')) {
      try {
        setIsDeleting(documentId);
        await documentsApi.deleteDocument(documentId);
        setDocuments(documents.filter(doc => doc.id !== documentId));
        toast.success('Dokument został pomyślnie usunięty');
      } catch (error) {
        console.error('Błąd podczas usuwania dokumentu:', error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bajtów';
    
    const k = 1024;
    const sizes = ['Bajtów', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Dokumenty</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-[#0A2463]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Dokumenty</h3>
      
      {documents.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Nie dodano jeszcze żadnych dokumentów.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dokument
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data dodania
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rozmiar
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                          {doc.filename}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {doc.document_type}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(doc.upload_date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {formatFileSize(doc.file_size)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="text-[#0A2463] hover:text-[#051b4a] transition-colors"
                        title="Pobierz"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={isDeleting === doc.id}
                        className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Usuń"
                      >
                        {isDeleting === doc.id ? (
                          <svg className="animate-spin h-5 w-5\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                            <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;