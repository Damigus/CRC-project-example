import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MEMBER_STATUSES, PARTY_ROLES } from '../../config/constants';

interface MemberFormProps {
  initialData?: Member;
  onSubmit: (data: MemberFormData) => Promise<void>;
  isLoading: boolean;
  buttonText: string;
}

export interface Member {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  status: string;
  join_date: string;
  party_role: string;
  notes?: string;
}

export type MemberFormData = Omit<Member, 'id'>;

const MemberForm = ({ initialData, onSubmit, isLoading, buttonText }: MemberFormProps) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    status: MEMBER_STATUSES[0],
    join_date: new Date().toISOString().split('T')[0],
    party_role: PARTY_ROLES[0],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        join_date: initialData.join_date ? initialData.join_date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is already handled in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Dane osobowe</h3>
        </div>
        
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            Imię <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nazwisko <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Adres email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Numer telefonu
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
          />
        </div>
        
        {/* Address Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Adres</h3>
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Ulica i numer
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Miasto
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
            Kod pocztowy
          </label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
          />
        </div>
        
        {/* Membership Details Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Szczegóły członkostwa</h3>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
            required
          >
            {MEMBER_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="party_role" className="block text-sm font-medium text-gray-700 mb-1">
            Rola w partii <span className="text-red-500">*</span>
          </label>
          <select
            id="party_role"
            name="party_role"
            value={formData.party_role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
            required
          >
            {PARTY_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="join_date" className="block text-sm font-medium text-gray-700 mb-1">
            Data dołączenia <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="join_date"
            name="join_date"
            value={formData.join_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Uwagi
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-[#0A2463] hover:bg-[#051b4a] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Zapisywanie...
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;