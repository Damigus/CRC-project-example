import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config/constants';

// Configure axios
axios.defaults.baseURL = API_URL;

// Add a request interceptor to add the auth token to requests
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axios.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    
    if (response && response.status === 401) {
      // Unauthorized - clear token and redirect to login only if not on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Sesja wygasła. Zaloguj się ponownie.');
      }
    } else if (response && response.data && response.data.message) {
      // Show error message from the API
      toast.error(response.data.message);
    } else {
      // Generic error
      toast.error('Wystąpił błąd. Spróbuj ponownie później.');
    }
    
    return Promise.reject(error);
  }
);

// API service for members
export const membersApi = {
  // Get all members with pagination
  getMembers: async (page = 1, limit = 10, search = '', status = '') => {
    try {
      const response = await axios.get('/members', {
        params: { page, limit, search, status }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get a single member by ID
  getMember: async (id: number) => {
    try {
      const response = await axios.get(`/members/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a new member
  createMember: async (memberData: any) => {
    try {
      const response = await axios.post('/members', memberData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update an existing member
  updateMember: async (id: number, memberData: any) => {
    try {
      const response = await axios.put(`/members/${id}`, memberData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a member
  deleteMember: async (id: number) => {
    try {
      const response = await axios.delete(`/members/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// API service for documents
export const documentsApi = {
  // Upload a document for a member
  uploadDocument: async (memberId: number, documentType: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      
      const response = await axios.post(`/members/${memberId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get all documents for a member
  getMemberDocuments: async (memberId: number) => {
    try {
      const response = await axios.get(`/members/${memberId}/documents`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Download a document
  downloadDocument: async (documentId: number) => {
    try {
      const response = await axios.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      // Get content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      
      // Get the filename from the response headers if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a document
  deleteDocument: async (documentId: number) => {
    try {
      const response = await axios.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Auth service
export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('/auth/register', { username, email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};