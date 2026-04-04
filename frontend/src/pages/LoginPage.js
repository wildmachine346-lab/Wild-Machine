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
import { Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [failCount, setFailCount] = useState(0);

  const handleTurnstile = useCallback((token) => setTurnstileToken(token), []);

  const checkCaptchaRequired = async (emailVal) => {
    try {
      const res = await api.get(`/api/auth/login-captcha-status?email=${encodeURIComponent(emailVal)}`);
      if (res.data.captcha_required) setShowCaptcha(true);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (showCaptcha && !turnstileToken) { toast.error(t('captcha_failed')); return; }
    setLoading(true);
    try {
      const user = await login(email, password, turnstileToken || undefined);
      toast.success(`Welcome back, ${user.display_name}`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'escort') navigate('/dashboard');
      else navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed';
      toast.error(detail.split('|')[0]);
      setFailCount(f => f + 1);
      if (detail.includes('captcha_required') || failCount >= 2) {
        setShowCaptcha(true);
      }
      await checkCaptchaRequired(email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen noise-overlay" data-testid="login-page">
      <Header />
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl text-[#F5F5F5]">{t('login_title')}</h1>
              <p className="text-[#525252] text-sm mt-2">{t('login_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('email')}</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-12" data-testid="login-email-input" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1.5 block">{t('password')}</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                  className="bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white h-12" data-testid="login-password-input" />
              </div>

              {showCaptcha && <TurnstileWidget onVerify={handleTurnstile} />}

              <Button type="submit" disabled={loading || (showCaptcha && !turnstileToken)}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C158] h-12 rounded-full font-medium text-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] mt-2"
                data-testid="login-submit-btn">
                {loading ? <Loader2 className="animate-spin" size={18} /> : t('nav_login')}
              </Button>
            </form>

            <p className="text-center text-[#525252] text-sm mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold hover:underline" data-testid="register-link">{t('nav_register')}</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
