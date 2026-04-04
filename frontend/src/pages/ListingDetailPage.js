import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ListingCard } from '../components/ListingCard';
import { BannerDisplay } from '../components/BannerDisplay';
import api, { getMediaUrl, getCoverImage } from '../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, BadgeCheck, Crown, Heart, Flag, Clock, Globe, Ruler, DollarSign, Phone, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { motion } from 'framer-motion';

export default function ListingDetailPage() {
  const { id, city: urlCity, slug: urlSlug } = useParams();
  const { user, toggleFavorite, isFavorited } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [phoneData, setPhoneData] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        let data;
        if (id) {
          const res = await api.get(`/listings/${id}`);
          data = res.data;
        } else if (urlCity && urlSlug) {
          const res = await api.get(`/escort/${urlCity}/${urlSlug}`);
          data = res.data;
        }
        if (!data) throw new Error('Not found');
        setListing(data);
        const relRes = await api.get('/listings', { params: { city: data.city, limit: 4 } });
        setRelated(relRes.data.listings.filter(l => l.id !== data.id).slice(0, 3));
      } catch {
        toast.error('Listing not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, urlCity, urlSlug, navigate]);

  const handleReport = async () => {
    if (!reportReason) return;
    try {
      await api.post('/reports', { listing_id: listing.id, reason: reportReason, details: reportDetails });
      toast.success('Report submitted');
      setReportOpen(false);
    } catch {
      toast.error('Failed to submit report');
    }
  };

  const handleRevealPhone = async () => {
    try {
      const { data } = await api.post(`/listings/${listing.id}/reveal-phone`);
      setPhoneData(data);
      setPhoneRevealed(true);
    } catch {
      toast.error('Failed to reveal phone');
    }
  };

  const handlePhoneClick = async () => {
    try {
      await api.post(`/listings/${listing.id}/phone-click`);
    } catch {}
  };

  if (loading || !listing) {
    return (
      <div className="min-h-screen noise-overlay">
        <Helmet><title>Loading... - Wild Machine</title></Helmet>
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const media = listing.media || [];
  const currentMedia = media[selectedImage] || media[0];
  const seoTitle = `${listing.display_name}, ${listing.age} - ${listing.city} | Wild Machine`;
  const seoDesc = listing.short_summary || listing.description?.slice(0, 160) || '';
  const seoImage = getCoverImage(media);

  return (
    <div className="min-h-screen noise-overlay" data-testid="listing-detail-page">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        {seoImage && <meta property="og:image" content={seoImage} />}
        <meta property="og:type" content="profile" />
        <link rel="canonical" href={`/escort/${listing.city?.toLowerCase()}/${listing.slug}`} />
      </Helmet>
      <Header />
      <main className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#A3A3A3] hover:text-white text-sm mb-6 transition-colors" data-testid="back-btn">
          <ArrowLeft size={16} /> {t('back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-7">
            <div className="rounded-xl overflow-hidden bg-[#0F0F0F] border border-white/5">
              <div className="aspect-[4/5] relative">
                {(currentMedia?.type === 'video' || currentMedia?.content_type?.startsWith('video')) ? (
                  <video
                    key={currentMedia?.id}
                    src={getMediaUrl(currentMedia)}
                    controls
                    className="w-full h-full object-contain bg-black"
                    data-testid="listing-main-video"
                  />
                ) : (
                  <img
                    src={getMediaUrl(currentMedia) || getCoverImage(media)}
                    alt={listing.display_name}
                    className="w-full h-full object-cover"
                    data-testid="listing-main-image"
                  />
                )}
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {listing.premium_type === 'top_featured' && (
                    <span className="flex items-center gap-1 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]" data-testid="detail-badge-top-featured"><Crown size={12} /> {t('top_featured')}</span>
                  )}
                  {listing.premium_type === 'featured' && (
                    <span className="flex items-center gap-1 bg-[#D4AF37]/90 text-black text-xs font-bold px-3 py-1.5 rounded-full" data-testid="detail-badge-featured"><Crown size={12} /> {t('featured')}</span>
                  )}
                  {listing.is_verified && (
                    <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full" data-testid="detail-badge-verified"><BadgeCheck size={12} /> {t('verified')}</span>
                  )}
                </div>
              </div>
              {/* Thumbnails */}
              {media.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto" data-testid="listing-thumbnails">
                  {media.map((m, i) => {
                    const isVid = m.type === 'video' || m.content_type?.startsWith('video');
                    return (
                      <button
                        key={m.id || i}
                        onClick={() => setSelectedImage(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative ${i === selectedImage ? 'border-[#D4AF37]' : 'border-transparent opacity-50 hover:opacity-80'}`}
                      >
                        {isVid ? (
                          <div className="w-full h-full bg-black flex items-center justify-center">
                            <video src={getMediaUrl(m)} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                          </div>
                        ) : (
                          <img src={getMediaUrl(m)} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-5 flex flex-col gap-6">
            {/* Name & Location */}
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-[#F5F5F5]">
                {listing.display_name}
                <span className="text-[#A3A3A3] text-xl ml-2">{listing.age}</span>
              </h1>
              <div className="flex items-center gap-2 mt-2 text-[#A3A3A3]">
                <MapPin size={14} /> <span className="text-sm">{listing.city}</span>
                {listing.service_area && <span className="text-[#525252]">&middot; {listing.service_area}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[#525252] text-xs">
                <Eye size={12} /> {listing.views} {t('views')}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {user && (
                <Button
                  onClick={() => toggleFavorite(listing.id)}
                  variant="outline"
                  className={`border-white/10 gap-2 ${isFavorited(listing.id) ? 'text-[#C58F9D] border-[#C58F9D]/30' : 'text-[#A3A3A3]'}`}
                  data-testid="detail-favorite-btn"
                >
                  <Heart size={16} className={isFavorited(listing.id) ? 'fill-current' : ''} />
                  {t('favorite')}
                </Button>
              )}
              {user && (
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-white/10 text-[#A3A3A3] gap-2" data-testid="report-btn">
                      <Flag size={14} /> {t('report')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0F0F0F] border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white font-heading">{t('report')}</DialogTitle>
                      <DialogDescription className="text-[#525252]">Submit a report for this listing</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-4">
                      <Select value={reportReason} onValueChange={setReportReason}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="report-reason-select">
                          <SelectValue placeholder={t('report_reason')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-white/10">
                          <SelectItem value="fake" className="text-white">Fake Profile</SelectItem>
                          <SelectItem value="spam" className="text-white">Spam</SelectItem>
                          <SelectItem value="scam" className="text-white">Scam</SelectItem>
                          <SelectItem value="duplicate" className="text-white">Duplicate Listing</SelectItem>
                          <SelectItem value="underage" className="text-white">Underage Suspicion</SelectItem>
                          <SelectItem value="inappropriate" className="text-white">Inappropriate Content</SelectItem>
                          <SelectItem value="other" className="text-white">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder={t('report_details')}
                        className="bg-white/5 border-white/10 text-white min-h-[80px]"
                        data-testid="report-details-input"
                      />
                      <Button onClick={handleReport} className="bg-[#D4AF37] text-black hover:bg-[#E5C158]" data-testid="report-submit-btn">
                        {t('report_submit')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Phone Contact Section */}
            {listing.phone_number && (
              <div className="glass rounded-xl p-6 border border-[#D4AF37]/20" data-testid="phone-contact-section">
                <h3 className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-4 flex items-center gap-2"><Phone size={12} /> {t('contact_info')}</h3>
                {!phoneRevealed ? (
                  <Button
                    onClick={handleRevealPhone}
                    className="w-full bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white border border-white/10 h-12 gap-2"
                    data-testid="reveal-phone-btn"
                  >
                    <Phone size={16} /> {t('reveal_phone')}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <a
                      href={`tel:${phoneData?.phone_number || listing.phone_number}`}
                      onClick={handlePhoneClick}
                      className="flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-full h-12 transition-all font-medium"
                      data-testid="call-now-btn"
                    >
                      <Phone size={16} /> {t('call_now')}: {phoneData?.phone_number || listing.phone_number}
                    </a>
                    {phoneData?.whatsapp && (
                      <a
                        href={`https://wa.me/${phoneData.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={handlePhoneClick}
                        className="flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-full h-10 transition-all text-sm"
                        data-testid="whatsapp-btn"
                      >
                        WhatsApp: {phoneData.whatsapp}
                      </a>
                    )}
                    {phoneData?.telegram && (
                      <a
                        href={`https://t.me/${phoneData.telegram.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={handlePhoneClick}
                        className="flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-full h-10 transition-all text-sm"
                        data-testid="telegram-btn"
                      >
                        Telegram: {phoneData.telegram}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pricing Card */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign size={12} /> {t('pricing')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {listing.price_30min && (
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <span className="text-xs text-[#525252] block">{t('time_30min')}</span>
                    <span className="text-gold text-lg font-semibold">${listing.price_30min}</span>
                  </div>
                )}
                <div className="bg-white/5 rounded-lg p-3 text-center border border-[#D4AF37]/20">
                  <span className="text-xs text-[#525252] block">{t('time_1h')}</span>
                  <span className="text-gold text-xl font-bold">${listing.price_1h}</span>
                </div>
                {listing.price_2h && (
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <span className="text-xs text-[#525252] block">{t('time_2h')}</span>
                    <span className="text-gold text-lg font-semibold">${listing.price_2h}</span>
                  </div>
                )}
                {listing.price_overnight && (
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <span className="text-xs text-[#525252] block">{t('time_overnight')}</span>
                    <span className="text-gold text-lg font-semibold">${listing.price_overnight}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {listing.incall && <Badge className="bg-white/5 text-[#A3A3A3] border-white/10 hover:bg-white/10">{t('incall')}</Badge>}
                {listing.outcall && <Badge className="bg-white/5 text-[#A3A3A3] border-white/10 hover:bg-white/10">{t('outcall')}</Badge>}
                {listing.car_call && <Badge className="bg-white/5 text-[#A3A3A3] border-white/10 hover:bg-white/10">{t('car_call')}</Badge>}
                {listing.en_ligne && <Badge className="bg-white/5 text-[#A3A3A3] border-white/10 hover:bg-white/10">{t('en_ligne')}</Badge>}
                {listing.is_trans && <Badge className="bg-[#D4AF37]/10 text-[#E5C158] border-[#D4AF37]/20 hover:bg-[#D4AF37]/20">{t('trans')}</Badge>}
              </div>
            </div>

            {/* Details */}
            <div className="glass rounded-xl p-6 flex flex-col gap-4">
              {listing.origin && (
                <div className="flex items-start gap-3">
                  <Globe size={14} className="text-[#525252] mt-0.5 flex-shrink-0" />
                  <div><span className="text-xs text-[#525252] uppercase tracking-widest block">{t('origin')}</span><span className="text-[#F5F5F5] text-sm">{listing.origin}</span></div>
                </div>
              )}
              {listing.measurements && (
                <div className="flex items-start gap-3">
                  <Ruler size={14} className="text-[#525252] mt-0.5 flex-shrink-0" />
                  <div><span className="text-xs text-[#525252] uppercase tracking-widest block">{t('measurements')}</span><span className="text-[#F5F5F5] text-sm">{listing.measurements}</span></div>
                </div>
              )}
              {listing.languages_spoken?.length > 0 && (
                <div className="flex items-start gap-3">
                  <Globe size={14} className="text-[#525252] mt-0.5 flex-shrink-0" />
                  <div><span className="text-xs text-[#525252] uppercase tracking-widest block">{t('languages_spoken')}</span><span className="text-[#F5F5F5] text-sm">{listing.languages_spoken.join(', ')}</span></div>
                </div>
              )}
              {listing.availability && (
                <div className="flex items-start gap-3">
                  <Clock size={14} className="text-[#525252] mt-0.5 flex-shrink-0" />
                  <div><span className="text-xs text-[#525252] uppercase tracking-widest block">{t('availability')}</span><span className="text-[#F5F5F5] text-sm">{listing.availability}</span></div>
                </div>
              )}
              {listing.contact_method && (
                <div className="flex items-start gap-3">
                  <Phone size={14} className="text-[#525252] mt-0.5 flex-shrink-0" />
                  <div><span className="text-xs text-[#525252] uppercase tracking-widest block">{t('contact')}</span><span className="text-[#F5F5F5] text-sm capitalize">{listing.contact_method}</span></div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-3">{t('about')}</h3>
              <p className="text-[#A3A3A3] text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          </motion.div>
        </div>

        {/* Related Listings */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-2xl text-[#F5F5F5] mb-6">{t('related')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
            </div>
          </div>
        )}

        {/* Bottom Banner */}
        <BannerDisplay position="listing_bottom_banner" className="mt-12" />
      </main>
      <Footer />
    </div>
  );
}
