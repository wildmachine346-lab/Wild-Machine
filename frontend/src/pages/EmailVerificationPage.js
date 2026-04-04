import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function EmailVerificationPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    const verifyEmail = async () => {
      try {
        await api.post(`/api/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch (err) {
        const msg = err.response?.data?.detail || '';
        setStatus(msg.includes('expired') ? 'expired' : 'invalid');
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111] border border-[#222] rounded-2xl p-8 text-center" data-testid="email-verification-card">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto text-gold animate-spin mb-4" size={48} />
            <h2 className="text-xl text-white font-heading mb-2">{t('verify_your_email')}</h2>
            <p className="text-[#888]">Verifying your email address...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-400" size={32} />
            </div>
            <h2 className="text-xl text-white font-heading mb-2" data-testid="verification-success-title">{t('verification_success')}</h2>
            <p className="text-[#888] mb-6">Your account is now active. You can create and publish listings.</p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition" data-testid="go-to-login-btn">
              {t('nav_login')} <ArrowRight size={16} />
            </Link>
          </>
        )}
        {status === 'expired' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-amber-400" size={32} />
            </div>
            <h2 className="text-xl text-white font-heading mb-2">{t('verification_expired')}</h2>
            <p className="text-[#888] mb-6">Please log in and request a new verification email.</p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-[#222] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#333] transition">
              {t('nav_login')} <ArrowRight size={16} />
            </Link>
          </>
        )}
        {status === 'invalid' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-400" size={32} />
            </div>
            <h2 className="text-xl text-white font-heading mb-2">Invalid Verification Link</h2>
            <p className="text-[#888] mb-6">This link is invalid or has already been used.</p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-[#222] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#333] transition">
              {t('nav_login')} <ArrowRight size={16} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
