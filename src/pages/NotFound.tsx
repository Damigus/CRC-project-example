import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertTriangle className="h-16 w-16 text-[#990000] mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Nie znaleziono strony</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        Strona której szukasz nie istnieje lub została przeniesiona.
      </p>
      <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
        <Link
          to="/"
          className="px-6 py-3 bg-[#0A2463] hover:bg-[#051b4a] text-white font-medium rounded-md transition-colors"
        >
          Wróć do strony głównej
        </Link>
        <Link
          to="/members"
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
        >
          Zobacz członków
        </Link>
      </div>
    </div>
  );
};

export default NotFound;