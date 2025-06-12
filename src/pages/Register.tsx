import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
      toast.error('Proszę wypełnić wszystkie pola');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Hasła nie są identyczne');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Hasło musi mieć co najmniej 6 znaków');
      return;
    }
    
    try {
      setIsLoading(true);
      await register(username, email, password);
      toast.success('Rejestracja udana!');
      navigate('/');
    } catch (error: any) {
      // Error is already handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="py-4 px-6 bg-[#0A2463] text-white text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center">
          <UserPlus className="mr-2 h-6 w-6" />
          Utwórz konto
        </h2>
      </div>
      
      <div className="py-8 px-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">
              Nazwa użytkownika
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
              placeholder="Wybierz nazwę użytkownika"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Adres email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
              placeholder="Wprowadź swój email"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Hasło
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
              placeholder="Utwórz hasło"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-700">
              Potwierdź hasło
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-transparent"
              placeholder="Potwierdź swoje hasło"
              required
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-[#0A2463] focus:ring-[#0A2463] border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                Akceptuję <a href="#" className="text-[#0A2463] hover:underline">Regulamin</a> i <a href="#" className="text-[#0A2463] hover:underline">Politykę Prywatności</a>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-[#0A2463] hover:bg-[#051b4a] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A2463] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                  <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Tworzenie konta...
              </span>
            ) : (
              'Zarejestruj się'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Masz już konto?{' '}
            <Link to="/login" className="text-[#0A2463] hover:underline font-medium">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
