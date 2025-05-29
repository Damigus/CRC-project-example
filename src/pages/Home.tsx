import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, Shield, FileText, Database } from 'lucide-react';
import { APP_NAME } from '../config/constants';

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero section */}
      <section className="bg-[#0A2463] text-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-12 md:px-12 md:py-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {APP_NAME}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            Kompleksowe rozwiązanie cyfrowe do zarządzania rejestrem członków partii, dokumentacją i strukturą organizacyjną.
          </p>
          {isAuthenticated ? (
            <Link
              to="/members"
              className="inline-block px-6 py-3 bg-[#990000] hover:bg-[#7c0000] text-white font-medium rounded-md transition-colors duration-300"
            >
              Przejdź do listy członków
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-[#990000] hover:bg-[#7c0000] text-white font-medium rounded-md transition-colors duration-300"
              >
                Logowanie
              </Link>
              <Link
                to="/register"
                className="inline-block px-6 py-3 bg-white hover:bg-gray-100 text-[#0A2463] font-medium rounded-md transition-colors duration-300"
              >
                Rejestracja
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features section */}
      <section className="py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-gray-800">
          Główne funkcje
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#0A2463]/10 rounded-full">
                <Users className="h-8 w-8 text-[#0A2463]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center text-gray-800">
              Zarządzanie członkami
            </h3>
            <p className="text-gray-600 text-center">
              Kompleksowe narzędzia do zarządzania informacjami o członkach partii, ich statusem i historią.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#0A2463]/10 rounded-full">
                <FileText className="h-8 w-8 text-[#0A2463]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center text-gray-800">
              Zarządzanie dokumentami
            </h3>
            <p className="text-gray-600 text-center">
              Bezpieczne przechowywanie i wyszukiwanie dokumentów i formularzy związanych z członkami.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#0A2463]/10 rounded-full">
                <Shield className="h-8 w-8 text-[#0A2463]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center text-gray-800">
              Bezpieczna autentykacja
            </h3>
            <p className="text-gray-600 text-center">
              Kontrola dostępu oparta na rolach z bezpiecznym logowaniem i ochroną danych.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#0A2463]/10 rounded-full">
                <Database className="h-8 w-8 text-[#0A2463]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center text-gray-800">
              Analiza danych
            </h3>
            <p className="text-gray-600 text-center">
              Narzędzia do analizy i raportowania trendów członkowskich i analizy organizacyjnej.
            </p>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-gray-100 rounded-lg p-8 my-12">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
            Gotowy do rozpoczęcia?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Dołącz do naszej platformy, aby zmodernizować system zarządzania członkami partii i poprawić efektywność operacyjną.
          </p>
          {isAuthenticated ? (
            <Link
              to="/members"
              className="inline-block px-6 py-3 bg-[#0A2463] hover:bg-[#051b4a] text-white font-medium rounded-md transition-colors duration-300"
            >
              Zobacz członków
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-block px-6 py-3 bg-[#0A2463] hover:bg-[#051b4a] text-white font-medium rounded-md transition-colors duration-300"
            >
              Utwórz konto
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;