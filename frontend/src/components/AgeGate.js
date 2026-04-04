import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';

export function AgeGate({ children }) {
  const { t } = useI18n();
  const [verified, setVerified] = useState(() => localStorage.getItem('pl_age_verified') === 'true');

  if (verified) return children;

  const handleEnter = () => {
    localStorage.setItem('pl_age_verified', 'true');
    setVerified(true);
  };

  const handleLeave = () => {
    window.location.href = 'https://google.com';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] age-gate-bg flex items-center justify-center"
        data-testid="age-gate-overlay"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1769123012414-6c6b5c17ad45?w=1200)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(30px)'
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 glass rounded-2xl p-12 md:p-16 max-w-lg mx-4 text-center"
        >
          {/* Logo */}
          <div className="mb-8">
            <img src="/logo.png" alt="Wild Machine" className="h-16 md:h-20 w-auto" />
            <div className="w-16 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
          </div>

          <h2 className="font-heading text-xl md:text-2xl text-[#F5F5F5] mb-4">
            {t('age_gate_title')}
          </h2>
          <p className="text-[#A3A3A3] text-sm md:text-base leading-relaxed mb-10">
            {t('age_gate_text')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleEnter}
              data-testid="age-gate-enter-btn"
              className="bg-[#D4AF37] text-black hover:bg-[#E5C158] font-medium px-10 py-3.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] text-sm tracking-wide"
            >
              {t('age_gate_enter')}
            </button>
            <button
              onClick={handleLeave}
              data-testid="age-gate-leave-btn"
              className="bg-transparent border border-white/20 text-[#A3A3A3] hover:text-white hover:border-white/40 font-medium px-10 py-3.5 rounded-full transition-all duration-300 text-sm tracking-wide"
            >
              {t('age_gate_leave')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
