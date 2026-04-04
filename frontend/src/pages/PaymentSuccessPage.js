import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Bitcoin } from 'lucide-react';
import api from '../lib/api';

export default function PaymentSuccessPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [attempts, setAttempts] = useState(0);
  const txnId = searchParams.get('txn_id');

  useEffect(() => {
    if (!txnId) { setStatus('error'); return; }
    const pollStatus = async () => {
      try {
        const res = await api.get(`/api/btcpay/payment-status/${txnId}`);
        if (res.data.payment_status === 'paid') {
          setStatus('success');
        } else if (res.data.payment_status === 'expired') {
          setStatus('expired');
        } else if (res.data.status === 'Processing') {
          setStatus('processing');
          if (attempts < 30) setTimeout(() => setAttempts(a => a + 1), 5000);
        } else if (attempts < 20) {
          setTimeout(() => setAttempts(a => a + 1), 4000);
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('error');
      }
    };
    pollStatus();
  }, [txnId, attempts]);

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111] border border-[#222] rounded-2xl p-8 text-center" data-testid="payment-result-card">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto text-gold animate-spin mb-4" size={48} />
            <h2 className="text-xl text-white font-heading mb-2" data-testid="payment-processing-title">{t('payment_processing')}</h2>
            <p className="text-[#888]">{t('payment_verifying_btc')}</p>
          </>
        )}
        {status === 'processing' && (
          <>
            <Bitcoin className="mx-auto text-[#F7931A] mb-4" size={48} />
            <h2 className="text-xl text-white font-heading mb-2">{t('payment_confirming')}</h2>
            <p className="text-[#888] mb-4">{t('payment_confirming_desc')}</p>
            <div className="w-full bg-[#222] rounded-full h-2 mb-4">
              <div className="bg-[#F7931A] h-2 rounded-full animate-pulse" style={{width: '60%'}} />
            </div>
            <p className="text-xs text-[#555]">{t('payment_auto_activate')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-400" size={32} />
            </div>
            <h2 className="text-xl text-white font-heading mb-2" data-testid="payment-success-title">{t('payment_success')}</h2>
            <p className="text-[#888] mb-6">{t('payment_success_desc')}</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition" data-testid="back-to-dashboard-btn">
              <ArrowLeft size={16} /> {t('dashboard_title')}
            </Link>
          </>
        )}
        {(status === 'error' || status === 'expired') && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-400" size={32} />
            </div>
            <h2 className="text-xl text-white font-heading mb-2" data-testid="payment-failed-title">{status === 'expired' ? t('payment_cancelled') : t('payment_failed')}</h2>
            <p className="text-[#888] mb-6">{status === 'expired' ? t('payment_expired_desc') : t('payment_error_desc')}</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-[#222] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#333] transition" data-testid="back-to-dashboard-failed-btn">
              <ArrowLeft size={16} /> {t('dashboard_title')}
            </Link>
          </>
        )}
        {status === 'pending' && (
          <>
            <Bitcoin className="mx-auto text-[#F7931A] mb-4" size={48} />
            <h2 className="text-xl text-white font-heading mb-2">{t('payment_pending')}</h2>
            <p className="text-[#888] mb-6">{t('payment_pending_desc')}</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition">
              <ArrowLeft size={16} /> {t('dashboard_title')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
