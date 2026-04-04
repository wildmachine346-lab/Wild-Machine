import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { supportedLanguages } from '../lib/i18n';
import { Menu, X, Heart, LayoutDashboard, Shield, LogOut, User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 h-16 md:h-20" data-testid="main-header">
        <div className="h-full max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group" data-testid="header-logo">
            <img src="/logo.png" alt="Wild Machine" className="h-10 md:h-12 w-auto transition-opacity duration-300 group-hover:opacity-80" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-[#A3A3A3] hover:text-white text-sm transition-colors duration-300" data-testid="nav-home">
              {t('nav_home')}
            </Link>
            {user?.role === 'escort' && (
              <Link to="/dashboard" className="text-[#A3A3A3] hover:text-white text-sm transition-colors duration-300 flex items-center gap-1.5" data-testid="nav-dashboard">
                <LayoutDashboard size={14} />
                {t('nav_dashboard')}
              </Link>
            )}
            {user && (
              <Link to="/favorites" className="text-[#A3A3A3] hover:text-white text-sm transition-colors duration-300 flex items-center gap-1.5" data-testid="nav-favorites">
                <Heart size={14} />
                {t('nav_favorites')}
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-[#A3A3A3] hover:text-white text-sm transition-colors duration-300 flex items-center gap-1.5" data-testid="nav-admin">
                <Shield size={14} />
                {t('nav_admin')}
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 text-xs" data-testid="language-switcher">
              {supportedLanguages.map((lang, i) => (
                <span key={lang.code} className="flex items-center">
                  {i > 0 && <span className="text-white/20 mx-1">|</span>}
                  <button
                    onClick={() => setLanguage(lang.code)}
                    data-testid={`lang-${lang.code}`}
                    className={`transition-colors duration-300 px-1 py-0.5 ${
                      language === lang.code ? 'text-gold font-semibold' : 'text-[#525252] hover:text-[#A3A3A3]'
                    }`}
                  >
                    {lang.label}
                  </button>
                </span>
              ))}
            </div>

            {/* Auth buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#A3A3A3] flex items-center gap-1.5">
                    <User size={12} />
                    {user.display_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    data-testid="logout-btn"
                    className="text-[#525252] hover:text-[#A3A3A3] transition-colors duration-300"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    data-testid="nav-login-btn"
                    className="text-[#A3A3A3] hover:text-white text-sm transition-colors duration-300"
                  >
                    {t('nav_login')}
                  </Link>
                  <Link
                    to="/register"
                    data-testid="nav-register-btn"
                    className="bg-[#D4AF37] text-black hover:bg-[#E5C158] text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                  >
                    {t('nav_register')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white/70 hover:text-white"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-black/95 backdrop-blur-lg md:hidden" data-testid="mobile-menu">
          <nav className="flex flex-col p-6 gap-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-white text-lg py-2 border-b border-white/5">{t('nav_home')}</Link>
            {user?.role === 'escort' && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-white text-lg py-2 border-b border-white/5">{t('nav_dashboard')}</Link>
            )}
            {user && (
              <Link to="/favorites" onClick={() => setMobileOpen(false)} className="text-white text-lg py-2 border-b border-white/5">{t('nav_favorites')}</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-white text-lg py-2 border-b border-white/5">{t('nav_admin')}</Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="text-[#A3A3A3] text-lg py-2 text-left">{t('nav_logout')}</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-white text-lg py-2 border-b border-white/5">{t('nav_login')}</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-gold text-lg py-2">{t('nav_register')}</Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
}
