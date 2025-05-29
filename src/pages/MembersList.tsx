import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, UserX, Edit, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { membersApi } from '../services/api';
import { ITEMS_PER_PAGE, MEMBER_STATUSES } from '../config/constants';

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  join_date: string;
  party_role: string;
}

const MembersList = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('Wszystkie');

  useEffect(() => {
    fetchMembers();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await membersApi.getMembers(
        currentPage,
        ITEMS_PER_PAGE,
        searchTerm,
        statusFilter !== 'Wszystkie' ? statusFilter : ''
      );
      
      setMembers(response.members || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error('Błąd podczas pobierania członków:', error);
      toast.error('Nie udało się załadować listy członków');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMembers();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego członka? Tej operacji nie można cofnąć.')) {
      try {
        setIsDeleting(id);
        await membersApi.deleteMember(id);
        setMembers(members.filter(member => member.id !== id));
        toast.success('Członek został pomyślnie usunięty');
      } catch (error) {
        console.error('Błąd podczas usuwania członka:', error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktywny':
        return 'bg-green-100 text-green-800';
      case 'Oczekujący':
        return 'bg-yellow-100 text-yellow-800';
      case 'Zawieszony':
        return 'bg-red-100 text-red-800';
      case 'Wygasły':
        return 'bg-gray-100 text-gray-800';
      case 'Nieaktywny':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Członkowie partii</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Szukaj członków..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
          >
            <option value="Wszystkie">Wszystkie statusy</option>
            {MEMBER_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <Link
            to="/members/add"
            className="flex items-center justify-center px-4 py-2 bg-[#0A2463] hover:bg-[#051b4a] text-white rounded-md transition-colors"
          >
            <Plus className="h-5 w-5 mr-1" />
            Dodaj członka
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0A2463]"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <UserX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">Nie znaleziono członków</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? `Brak wyników dla "${searchTerm}"`
              : 'Nie ma jeszcze zarejestrowanych członków.'}
          </p>
          <Link
            to="/members/add"
            className="inline-flex items-center px-4 py-2 bg-[#0A2463] hover:bg-[#051b4a] text-white rounded-md transition-colors"
          >
            <Plus className="h-5 w-5 mr-1" />
            Dodaj pierwszego członka
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imię i nazwisko
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data dołączenia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rola
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.join_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.party_role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/members/${member.id}`}
                            className="text-[#0A2463] hover:text-[#051b4a] transition-colors"
                            title="Podgląd"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/members/edit/${member.id}`}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="Edytuj"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(member.id)}
                            disabled={isDeleting === member.id}
                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            title="Usuń"
                          >
                            {isDeleting === member.id ? (
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
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Strona {currentPage} z {totalPages}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MembersList;