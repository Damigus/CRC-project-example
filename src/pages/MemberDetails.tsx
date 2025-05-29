import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Award, Edit, Trash2, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { membersApi } from '../services/api';
import { Member } from '../components/members/MemberForm';
import DocumentUpload from '../components/documents/DocumentUpload';
import DocumentsList from '../components/documents/DocumentsList';

const MemberDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [documentsRefreshTrigger, setDocumentsRefreshTrigger] = useState(0);

  useEffect(() => {
    if (id) {
      fetchMember(parseInt(id));
    }
  }, [id]);

  const fetchMember = async (memberId: number) => {
    try {
      setIsLoading(true);
      const data = await membersApi.getMember(memberId);
      setMember(data.member);
    } catch (error) {
      console.error('Błąd podczas pobierania członka:', error);
      toast.error('Nie udało się załadować danych członka');
      navigate('/members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Czy na pewno chcesz usunąć tego członka? Tej akcji nie można cofnąć.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await membersApi.deleteMember(parseInt(id));
      toast.success('Członek został pomyślnie usunięty');
      navigate('/members');
    } catch (error) {
      console.error('Błąd podczas usuwania członka:', error);
      setIsDeleting(false);
    }
  };

  const handleDocumentUploadSuccess = () => {
    setDocumentsRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0A2463]"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">Nie znaleziono członka</p>
        <Link to="/members" className="mt-4 inline-block text-[#0A2463] hover:underline">
          Powrót do listy członków
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/members" className="mr-4 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {member.first_name} {member.last_name}
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <Link
            to={`/members/edit/${id}`}
            className="flex items-center px-4 py-2 bg-[#0A2463] hover:bg-[#051b4a] text-white rounded-md transition-colors"
          >
            <Edit className="h-5 w-5 mr-1" />
            Edytuj
          </Link>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                  <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Usuwanie...
              </span>
            ) : (
              <>
                <Trash2 className="h-5 w-5 mr-1" />
                Usuń
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Member Details Card */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Szczegóły członka</h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Imię i nazwisko</p>
                  <p className="text-base font-medium text-gray-800">
                    {member.first_name} {member.last_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Adres email</p>
                  <p className="text-base font-medium text-gray-800">{member.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Numer telefonu</p>
                  <p className="text-base font-medium text-gray-800">
                    {member.phone || 'Nie podano'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Data dołączenia</p>
                  <p className="text-base font-medium text-gray-800">
                    {formatDate(member.join_date)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Award className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Rola w partii</p>
                  <p className="text-base font-medium text-gray-800">{member.party_role}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Adres</p>
                  <p className="text-base font-medium text-gray-800">
                    {member.address ? (
                      <>
                        {member.address}
                        {member.city && `, ${member.city}`}
                        {member.postal_code && ` ${member.postal_code}`}
                      </>
                    ) : (
                      'Nie podano'
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {member.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Notatki</h3>
                <p className="text-gray-600 whitespace-pre-line">{member.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Document Upload Section */}
        <div className="md:col-span-1">
          <DocumentUpload
            memberId={parseInt(id!)}
            onUploadSuccess={handleDocumentUploadSuccess}
          />
        </div>
        
        {/* Documents List Section */}
        <div className="md:col-span-3">
          <DocumentsList
            memberId={parseInt(id!)}
            refreshTrigger={documentsRefreshTrigger}
          />
        </div>
      </div>
    </div>
  );
};

export default MemberDetails;