import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] mt-12" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <h3 className="text-gold font-heading text-sm mb-3">{t('site_name')}</h3>
            <p className="text-[#525252] text-xs leading-relaxed">The premier classified ads platform. Elegant, discreet, secure.</p>
          </div>
          <div>
            <h3 className="text-[#888] font-semibold text-xs uppercase tracking-wider mb-3">{t('legal')}</h3>
            <div className="space-y-2">
              <Link to="/privacy-policy" className="block text-[#525252] text-xs hover:text-gold transition" data-testid="footer-privacy-link">{t('privacy_policy')}</Link>
              <Link to="/privacy-policy" className="block text-[#525252] text-xs hover:text-gold transition" data-testid="footer-terms-link">{t('terms_of_service')}</Link>
              <Link to="/privacy-policy" className="block text-[#525252] text-xs hover:text-gold transition" data-testid="footer-guidelines-link">{t('content_guidelines')}</Link>
            </div>
          </div>
          <div>
            <h3 className="text-[#888] font-semibold text-xs uppercase tracking-wider mb-3">{t('about_us')}</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-[#525252] text-xs hover:text-gold transition" data-testid="footer-about-link">{t('about_platform')}</Link>
              <Link to="/about" className="block text-[#525252] text-xs hover:text-gold transition" data-testid="footer-contact-link">{t('contact_us')}</Link>
              <Link to="/about" className="block text-[#525252] text-xs hover:text-gold transition" data-testid="footer-how-link">{t('how_it_works')}</Link>
            </div>
          </div>
          <div>
            <h3 className="text-[#888] font-semibold text-xs uppercase tracking-wider mb-3">{t('contact')}</h3>
            <p className="text-[#525252] text-xs">support@wildmachine.com</p>
            <p className="text-[#525252] text-xs mt-1">Montréal, QC, Canada</p>
          </div>
        </div>
        <div className="border-t border-[#1a1a1a] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#333] text-xs">&copy; {year} Wild Machine. All rights reserved.</p>
          <p className="text-[#333] text-xs">18+ only. By using this site you confirm you are of legal age.</p>
        </div>
      </div>
    </footer>
  );
}
