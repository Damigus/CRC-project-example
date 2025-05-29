// API URL - change this to your Flask backend URL when deployed
export const API_URL = 'http://localhost:5000/api';

// App information
export const APP_NAME = 'Krajowy Rejestr Członków Partii';
export const APP_VERSION = '1.0.0';

// Pagination
export const ITEMS_PER_PAGE = 10;

// Document types
export const DOCUMENT_TYPES = [
  'Wniosek o członkostwo',
  'Dokument tożsamości',
  'Potwierdzenie adresu',
  'CV',
  'Inne'
];

// Member statuses
export const MEMBER_STATUSES = [
  'Aktywny',
  'Oczekujący',
  'Zawieszony',
  'Wygasły',
  'Nieaktywny'
];

// Party roles
export const PARTY_ROLES = [
  'Członek',
  'Lider lokalny',
  'Lider regionalny',
  'Członek zarządu',
  'Prezes',
  'Wiceprezes',
  'Sekretarz',
  'Skarbnik'
];