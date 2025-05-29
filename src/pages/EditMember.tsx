import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserCog } from 'lucide-react';
import { membersApi } from '../services/api';
import MemberForm, { MemberFormData } from '../components/members/MemberForm';

const EditMember = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberData, setMemberData] = useState<MemberFormData | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchMember = async () => {
      try {
        if (!id) return;
        const response = await membersApi.getMember(parseInt(id));
        setMemberData(response.member);
      } catch (error) {
        console.error('Błąd podczas pobierania danych członka:', error);
        toast.error('Nie udało się pobrać danych członka');
        navigate('/members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMember();
  }, [id, navigate]);

  const handleSubmit = async (data: MemberFormData) => {
    try {
      setIsSubmitting(true);
      if (!id) return;
      await membersApi.updateMember(parseInt(id), data);
      toast.success('Dane członka zostały zaktualizowane');
      navigate('/members');
    } catch (error) {
      console.error('Błąd podczas aktualizacji danych członka:', error);
      toast.error('Nie udało się zaktualizować danych członka');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A2463]"></div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nie znaleziono danych członka</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center">
        <UserCog className="h-6 w-6 text-[#0A2463] mr-2" />
        <h1 className="text-2xl font-bold text-gray-800">Edytuj dane członka</h1>
      </div>
      
      <div className="mb-8">
        <p className="text-gray-600">
          Zaktualizuj dane członka partii w poniższym formularzu. Pola oznaczone gwiazdką (*) są obowiązkowe.
        </p>
      </div>
      
      <MemberForm
        initialData={memberData}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        buttonText="Zapisz zmiany"
      />
    </div>
  );
};

export default EditMember;