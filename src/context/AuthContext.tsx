import { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config/constants';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Verify token and set user data
        const decoded = jwtDecode<User & { exp: number }>(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setUser({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
          });
          setIsAuthenticated(true);
          
          // Set auth header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        
        // Decode token to get user data
        const decoded = jwtDecode<User & { exp: number }>(res.data.token);
        
        setUser({
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role
        });
        
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        
        // Decode token to get user data
        const decoded = jwtDecode<User & { exp: number }>(res.data.token);
        
        setUser({
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role
        });
        
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};