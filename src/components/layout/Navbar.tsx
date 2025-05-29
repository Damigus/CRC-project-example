import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Home, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { APP_NAME } from '../../config/constants';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-[#0A2463] shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo and site name */}
          <Link to="/" className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-white" />
            <span className="text-white font-bold text-lg md:text-xl">{APP_NAME}</span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
              aria-label="Przełącz menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Strona główna</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/members"
                  className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors"
                >
                  <Users className="h-5 w-5" />
                  <span>Członkowie</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Wyloguj</span>
                </button>
                <div className="ml-2 px-3 py-1 bg-[#990000] text-white rounded-full text-sm">
                  {user?.username}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Logowanie</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Rejestracja</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <Link
              to="/"
              className="block py-2 text-white hover:text-gray-300 transition-colors"
              onClick={toggleMenu}
            >
              Strona główna
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/members"
                  className="block py-2 text-white hover:text-gray-300 transition-colors"
                  onClick={toggleMenu}
                >
                  Członkowie
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="block py-2 text-white hover:text-gray-300 transition-colors w-full text-left"
                >
                  Wyloguj
                </button>
                <div className="mt-2 inline-block px-3 py-1 bg-[#990000] text-white rounded-full text-sm">
                  {user?.username}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-white hover:text-gray-300 transition-colors"
                  onClick={toggleMenu}
                >
                  Logowanie
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-white hover:text-gray-300 transition-colors"
                  onClick={toggleMenu}
                >
                  Rejestracja
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;