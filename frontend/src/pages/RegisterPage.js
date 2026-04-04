import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2, Mail } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [role, setRole] = useState('client');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', display_name: '', username: '', city: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const handleTurnstile = useCallback((token) => setTurnstileToken(token), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (!turnstileToken) { toast.error(t('captcha_failed')); return; }
    setLoading(true);
    try {
      const result = await register({
        email: form.email, password: form.password, role,
        display_name: form.display_name || undefined,
        username: form.username || undefined,
        city: form.city || undefined,
        phone: form.phone || undefined,
        turnstile_token: turnstileToken
      });
      if (result.email_verification_required) {
        setShowVerification(true);
      } else {
        toast.success(`Welcome, ${result.user.display_name}!`);
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen noise-overlay" data-testid="verification-notice-page">
        <Header />
        <main className="relative z-10 flex items-center justify-center py-12 px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="glass rounded-2xl p-8 md:p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="text-gold" size={28} />
              </div>
              <h1 className="font-heading text-2xl text-[#F5F5F5] mb-2">{t('check_email')}</h1>
              <p className="text-[#888] text-sm mb-6">{t('verification_sent')}</p>
              <p className="text-[#525252] text-xs mb-6">Sent to: {form.email}</p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition" data-testid="go-login-after-register">
                {t('nav_login')}
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen noise-overlay" data-testid="register-page">
      <Header />
      <main className="relative z-10 flex items-center justify-center py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl text-[#F5F5F5]">{t('register_title')}</h1>
              <p className="text-[#525252] text-sm mt-2">{t('register_subtitle')}</p>
            </div>

            <div className="flex gap-3 mb-6">
              <button onClick={() => setRole('client')} data-testid="role-client-btn"
                className={`flex-1 py-3 rounded-full text-sm font-medium transition-all duration-300 ${role === 'client' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-[#A3A3A3] border border-white/10 hover:border-white/20'}`}>
                {t('register_client')}
              </button>
              <button onClick={() => setRole('escort')} data-testid="role-escort-btn"
                className={`flex-1 py-3 rounded-full text-sm font-medium transition-all duration-300 ${role === 'escort' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-[#A3A3A3] border border-white/10 hover:border-white/20'}`}>
                {t('register_escort')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('email')} *</label>
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-11" data-testid="register-email-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('password')} *</label>
                  <Input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-11" data-testid="register-password-input" />
                </div>
                <div>
                  <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('confirm_password')} *</label>
                  <Input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-11" data-testid="register-confirm-password-input" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('display_name')}</label>
                <Input value={form.display_name} onChange={(e) => update('display_name', e.target.value)} className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-11" data-testid="register-displayname-input" />
              </div>
              {role === 'client' && (
                <div>
                  <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('username')}</label>
                  <Input value={form.username} onChange={(e) => update('username', e.target.value)} className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-11" data-testid="register-username-input" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('city')}</label>
                  <Input value={form.city} onChange={(e) => update('city', e.target.value)} className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-11" data-testid="register-city-input" />
                </div>
                {role === 'escort' && (
                  <div>
                    <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('phone')}</label>
                    <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-11" data-testid="register-phone-input" />
                  </div>
                )}
              </div>

              <TurnstileWidget onVerify={handleTurnstile} />

              <Button type="submit" disabled={loading || !turnstileToken}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C158] h-12 rounded-full font-medium text-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] mt-2"
                data-testid="register-submit-btn">
                {loading ? <Loader2 className="animate-spin" size={18} /> : t('nav_register')}
              </Button>
            </form>

            <p className="text-center text-[#525252] text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-gold hover:underline" data-testid="login-link">{t('nav_login')}</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
