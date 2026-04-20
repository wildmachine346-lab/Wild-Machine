import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from './components/ui/sonner';
import { AgeGate } from './components/AgeGate';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ListingDetailPage from './pages/ListingDetailPage';
import EscortDashboard from './pages/EscortDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FavoritesPage from './pages/FavoritesPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AboutPage from './pages/AboutPage';

function App() {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://js.juicyads.com/jp.php?c=446433y2s294u4r2p2a4x2c444&u=https%3A%2F%2Fwww.juicyads.rocks"]'
    );

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://js.juicyads.com/jp.php?c=446433y2s294u4r2p2a4x2c444&u=https%3A%2F%2Fwww.juicyads.rocks";
    script.type = "text/javascript";
    document.body.appendChild(script);
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <AgeGate />
            <Toaster position="top-right" theme="dark" richColors />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
              <Route path="/escort/:city/:slug" element={<ListingDetailPage />} />
              <Route path="/dashboard" element={<EscortDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
