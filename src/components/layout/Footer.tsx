import { APP_NAME, APP_VERSION } from '../../config/constants';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 py-6 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              &copy; {year} {APP_NAME}. Wszelkie prawa zastrzeżone.
            </p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-600 hover:text-[#0A2463] transition-colors text-sm">
              Polityka Prywatności
            </a>
            <a href="#" className="text-gray-600 hover:text-[#0A2463] transition-colors text-sm">
              Regulamin
            </a>
            <a href="#" className="text-gray-600 hover:text-[#0A2463] transition-colors text-sm">
              Kontakt
            </a>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-gray-500 text-xs">
              Wersja {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;