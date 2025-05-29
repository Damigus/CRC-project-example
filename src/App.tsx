import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MembersList from './pages/MembersList';
import MemberDetails from './pages/MemberDetails';
import AddMember from './pages/AddMember';
import EditMember from './pages/EditMember';
import NotFound from './pages/NotFound';

// Auth context
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-900"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/members" element={
                <PrivateRoute>
                  <MembersList />
                </PrivateRoute>
              } />
              <Route path="/members/:id" element={
                <PrivateRoute>
                  <MemberDetails />
                </PrivateRoute>
              } />
              <Route path="/members/add" element={
                <PrivateRoute>
                  <AddMember />
                </PrivateRoute>
              } />
              <Route path="/members/edit/:id" element={
                <PrivateRoute>
                  <EditMember />
                </PrivateRoute>
              } />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer position="bottom-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;