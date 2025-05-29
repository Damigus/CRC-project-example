import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';
import { membersApi } from '../services/api';
import MemberForm, { MemberFormData } from '../components/members/MemberForm';

const AddMember = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: MemberFormData) => {
    try {
      setIsSubmitting(true);
      await membersApi.createMember(data);
      toast.success('Członek został pomyślnie dodany');
      navigate('/members');
    } catch (error) {
      console.error('Błąd podczas dodawania członka:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center">
        <UserPlus className="h-6 w-6 text-[#0A2463] mr-2" />
        <h1 className="text-2xl font-bold text-gray-800">Dodaj nowego członka</h1>
      </div>
      
      <div className="mb-8">
        <p className="text-gray-600">
          Wypełnij poniższy formularz, aby dodać nowego członka partii do rejestru. Pola oznaczone gwiazdką (*) są obowiązkowe.
        </p>
      </div>
      
      <MemberForm
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        buttonText="Dodaj członka"
      />
    </div>
  );
};

export default AddMember;