import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import { MediaUploader } from '../components/MediaUploader';
import api from '../lib/api';
import { getCoverImage } from '../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Heart, ToggleLeft, ToggleRight, Star, Phone, BadgeCheck, Crown, Image } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { motion } from 'framer-motion';

export default function EscortDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editListing, setEditListing] = useState(null);
  const [form, setForm] = useState({
    display_name: '', age: 25, origin: '', measurements: '', city: '',
    service_area: '', price_1h: 300, price_30min: null, price_2h: null,
    price_overnight: null, incall: true, outcall: false, car_call: false, en_ligne: false, is_trans: false, description: '',
    short_summary: '', languages_spoken: [], availability: '', contact_method: '',
    phone_number: '', whatsapp_optional: '', telegram_optional: '',
    country: '', latitude: null, longitude: null
  });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeListing, setUpgradeListing] = useState(null);
  const [upgradeType, setUpgradeType] = useState('featured');
  const [upgradeDays, setUpgradeDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listingsRes] = await Promise.all([
        api.get('/escort/stats'),
        api.get('/escort/listings')
      ]);
      setStats(statsRes.data);
      setListings(listingsRes.data.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const openCreate = () => {
    setEditListing(null);
    setForm({
      display_name: user?.display_name || '', age: 25, origin: '', measurements: '',
      city: user?.city || '', service_area: '', price_1h: 300, price_30min: null,
      price_2h: null, price_overnight: null, incall: true, outcall: false, car_call: false, en_ligne: false, is_trans: false,
      description: '', short_summary: '', languages_spoken: [], availability: '', contact_method: '',
      phone_number: user?.phone || '', whatsapp_optional: '', telegram_optional: '',
      country: '', latitude: null, longitude: null
    });
    setEditOpen(true);
  };

  const openEdit = (listing) => {
    setEditListing(listing);
    setForm({
      display_name: listing.display_name, age: listing.age, origin: listing.origin || '',
      measurements: listing.measurements || '', city: listing.city,
      service_area: listing.service_area || '', price_1h: listing.price_1h,
      price_30min: listing.price_30min, price_2h: listing.price_2h,
      price_overnight: listing.price_overnight, incall: listing.incall,
      outcall: listing.outcall, car_call: listing.car_call || false,
      en_ligne: listing.en_ligne || false, is_trans: listing.is_trans || false,
      description: listing.description,
      short_summary: listing.short_summary || '',
      languages_spoken: listing.languages_spoken || [],
      availability: listing.availability || '', contact_method: listing.contact_method || '',
      phone_number: listing.phone_number || '', whatsapp_optional: listing.whatsapp_optional || '',
      telegram_optional: listing.telegram_optional || '',
      country: listing.country || '', latitude: listing.latitude, longitude: listing.longitude
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        price_1h: parseFloat(form.price_1h),
        price_30min: form.price_30min ? parseFloat(form.price_30min) : null,
        price_2h: form.price_2h ? parseFloat(form.price_2h) : null,
        price_overnight: form.price_overnight ? parseFloat(form.price_overnight) : null,
        languages_spoken: typeof form.languages_spoken === 'string' ? form.languages_spoken.split(',').map(s => s.trim()).filter(Boolean) : form.languages_spoken
      };
      if (editListing) {
        await api.put(`/listings/${editListing.id}`, payload);
        toast.success('Listing updated');
      } else {
        const res = await api.post('/listings', payload);
        toast.success('Listing created! Now upload photos.');
        setEditListing(res.data);
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await api.put(`/listings/${id}/toggle`);
      toast.success(`Listing ${data.status}`);
      fetchData();
    } catch { toast.error('Failed to toggle'); }
  };

  const refreshEditListing = useCallback(async () => {
    if (!editListing?.id) return;
    try {
      const res = await api.get(`/listings/${editListing.id}`);
      setEditListing(res.data);
    } catch {}
    fetchData();
  }, [editListing?.id, fetchData]);

  const [packages, setPackages] = useState({});
  useEffect(() => {
    api.get('/premium-packages').then(res => setPackages(res.data.packages || {})).catch(() => {});
  }, []);
  const getPackageId = () => `${upgradeType}_${upgradeDays}`;
  const getPackagePrice = () => {
    const pkg = packages[getPackageId()];
    return pkg ? `${pkg.price} $CAD` : '...';
  };
  const handleUpgradePremium = async () => {
    if (!upgradeListing) return;
    try {
      const res = await api.post('/btcpay/create-invoice', {
        package_id: getPackageId(),
        listing_id: upgradeListing.id,
        origin_url: window.location.origin
      });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment initiation failed');
    }
  };

  return (
    <div className="min-h-screen noise-overlay" data-testid="escort-dashboard">
      <Header />
      <main className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-[#F5F5F5]">{t('dashboard_title')}</h1>
            <p className="text-[#525252] text-sm mt-1">{user?.display_name} &middot; {user?.email}</p>
          </div>
          <Button onClick={openCreate} className="bg-[#D4AF37] text-black hover:bg-[#E5C158] rounded-full gap-2" data-testid="create-listing-btn">
            <Plus size={16} /> {t('create_listing')}
          </Button>
        </div>

        {/* Email Verification Banner */}
        {stats && !stats.email_verified && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between" data-testid="email-verification-banner">
            <div className="flex items-center gap-3">
              <BadgeCheck size={20} className="text-amber-400" />
              <div>
                <p className="text-amber-200 text-sm font-medium">{t('email_not_verified')}</p>
                <p className="text-amber-200/60 text-xs">{t('verification_sent')}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20" data-testid="resend-verification-btn"
              onClick={async () => {
                try {
                  await api.post('/auth/resend-verification', {}, { headers: { 'x-frontend-origin': window.location.origin } });
                  toast.success(t('verification_sent'));
                } catch { toast.error('Failed to resend'); }
              }}>
              {t('resend_verification')}
            </Button>
          </div>
        )}

        {/* Stats Row 1 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: t('total_listings'), value: stats.total_listings, icon: Star },
              { label: t('active'), value: stats.active_listings, icon: ToggleRight },
              { label: t('total_views'), value: stats.total_views, icon: Eye },
              { label: t('total_favorites'), value: stats.total_favorites, icon: Heart },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-5">
                <s.icon size={16} className="text-gold mb-2" />
                <p className="text-2xl font-semibold text-[#F5F5F5]">{s.value}</p>
                <p className="text-xs text-[#525252] uppercase tracking-widest">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}
        {/* Stats Row 2 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-5">
              <Phone size={16} className="text-emerald-400 mb-2" />
              <p className="text-2xl font-semibold text-[#F5F5F5]">{stats.total_phone_clicks || 0}</p>
              <p className="text-xs text-[#525252] uppercase tracking-widest">{t('phone_clicks')}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <Eye size={16} className="text-blue-400 mb-2" />
              <p className="text-2xl font-semibold text-[#F5F5F5]">{stats.total_phone_reveals || 0}</p>
              <p className="text-xs text-[#525252] uppercase tracking-widest">{t('phone_reveals')}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <Crown size={16} className="text-gold mb-2" />
              <p className="text-2xl font-semibold text-[#F5F5F5]">{stats.premium_count || 0}</p>
              <p className="text-xs text-[#525252] uppercase tracking-widest">{t('premium')}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <BadgeCheck size={16} className={`mb-2 ${stats.is_verified ? 'text-emerald-400' : 'text-[#525252]'}`} />
              <p className="text-lg font-semibold text-[#F5F5F5]">{stats.is_verified ? t('verified') : 'Not Verified'}</p>
              <p className="text-xs text-[#525252] uppercase tracking-widest">{t('verification_status')}</p>
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="flex flex-col gap-4" data-testid="escort-listings-list">
          {listings.length === 0 && !loading && (
            <div className="text-center py-16 glass rounded-xl">
              <p className="text-[#525252]">{t('no_results')}</p>
              <Button onClick={openCreate} className="mt-4 bg-[#D4AF37] text-black hover:bg-[#E5C158] rounded-full">{t('create_listing')}</Button>
            </div>
          )}
          {listings.map((listing) => (
            <div key={listing.id} className="glass rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4" data-testid={`escort-listing-${listing.id}`}>
              <div className="w-full md:w-24 h-32 md:h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                {listing.media?.[0]?.type === 'video' || listing.media?.[0]?.content_type?.startsWith('video') ? (
                  <video src={getCoverImage(listing.media)} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={getCoverImage(listing.media) || 'https://via.placeholder.com/120'} alt="" className="w-full h-full object-cover" />
                )}
                {listing.media?.length > 0 && (
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Image size={8} /> {listing.media.length}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[#F5F5F5] font-medium">{listing.display_name} <span className="text-[#525252] text-sm">- {listing.city}</span></h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${listing.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-[#525252]'}`}>{listing.status}</span>
                      {listing.premium_type === 'top_featured' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37]/30 to-[#E5C158]/30 text-gold uppercase tracking-wider">{t('top_featured')}</span>}
                      {listing.premium_type === 'featured' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-gold uppercase tracking-wider">{t('featured')}</span>}
                      {listing.is_verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">{t('verified')}</span>}
                    </div>
                    <p className="text-[#525252] text-xs mt-1">
                      ${listing.price_1h}{t('per_hour')} &middot; {listing.views} {t('views')} &middot; {listing.phone_clicks || 0} {t('phone_clicks')} &middot; {listing.phone_reveals || 0} {t('phone_reveals')}
                    </p>
                    {listing.premium_expiration_date && (
                      <p className="text-[10px] text-[#525252] mt-0.5">{t('premium_expires_on')}: {new Date(listing.premium_expiration_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(listing)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors" data-testid={`edit-listing-${listing.id}`}><Edit size={14} /></button>
                    <button onClick={() => { setUpgradeListing(listing); setUpgradeOpen(true); }} className="p-2 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-gold transition-colors" data-testid={`upgrade-listing-${listing.id}`}><Crown size={14} /></button>
                    <button onClick={() => handleToggle(listing.id)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors" data-testid={`toggle-listing-${listing.id}`}>
                      {listing.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => handleDelete(listing.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-[#A3A3A3] hover:text-red-400 transition-colors" data-testid={`delete-listing-${listing.id}`}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-[#0F0F0F] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="listing-form-dialog">
            <DialogHeader>
              <DialogTitle className="text-white font-heading text-xl">{editListing ? t('edit_listing') : t('create_listing')}</DialogTitle>
              <DialogDescription className="text-[#525252]">{editListing ? 'Modify your listing details' : 'Fill in the details for your new listing'}</DialogDescription>
            </DialogHeader>

            {/* MEDIA UPLOADER — AT THE TOP */}
            {editListing ? (
              <div className="mt-4 mb-2 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <MediaUploader
                  listingId={editListing.id}
                  media={editListing.media || []}
                  onMediaChange={refreshEditListing}
                />
              </div>
            ) : (
              <div className="mt-4 mb-2 p-4 bg-gold/5 border border-gold/20 rounded-xl text-center">
                <Image size={24} className="text-gold mx-auto mb-2" />
                <p className="text-sm text-gold/80">Save your listing first, then upload photos & videos</p>
                <p className="text-[10px] text-[#525252] mt-1">Photos are the most important part of your listing</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('display_name')} *</label>
                <Input value={form.display_name} onChange={(e) => updateField('display_name', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-display-name" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('age')} *</label>
                <Input type="number" value={form.age} onChange={(e) => updateField('age', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-age" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('city')} *</label>
                <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-city" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('origin')}</label>
                <Input value={form.origin} onChange={(e) => updateField('origin', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-origin" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('measurements')}</label>
                <Input value={form.measurements} onChange={(e) => updateField('measurements', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-measurements" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('service_area')}</label>
                <Input value={form.service_area} onChange={(e) => updateField('service_area', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-service-area" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('price_1h')} * ($)</label>
                <Input type="number" value={form.price_1h} onChange={(e) => updateField('price_1h', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-price-1h" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('price_30min')} ($)</label>
                <Input type="number" value={form.price_30min || ''} onChange={(e) => updateField('price_30min', e.target.value || null)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-price-30min" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('price_2h')} ($)</label>
                <Input type="number" value={form.price_2h || ''} onChange={(e) => updateField('price_2h', e.target.value || null)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-price-2h" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('price_overnight')} ($)</label>
                <Input type="number" value={form.price_overnight || ''} onChange={(e) => updateField('price_overnight', e.target.value || null)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-price-overnight" />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <label className="flex items-center gap-2 text-sm text-[#A3A3A3]"><Switch checked={form.incall} onCheckedChange={(v) => updateField('incall', v)} data-testid="form-incall" /> {t('incall')}</label>
                <label className="flex items-center gap-2 text-sm text-[#A3A3A3]"><Switch checked={form.outcall} onCheckedChange={(v) => updateField('outcall', v)} data-testid="form-outcall" /> {t('outcall')}</label>
                <label className="flex items-center gap-2 text-sm text-[#A3A3A3]"><Switch checked={form.car_call} onCheckedChange={(v) => updateField('car_call', v)} data-testid="form-car-call" /> {t('car_call')}</label>
                <label className="flex items-center gap-2 text-sm text-[#A3A3A3]"><Switch checked={form.en_ligne} onCheckedChange={(v) => updateField('en_ligne', v)} data-testid="form-en-ligne" /> {t('en_ligne')}</label>
                <label className="flex items-center gap-2 text-sm text-[#A3A3A3]"><Switch checked={form.is_trans} onCheckedChange={(v) => updateField('is_trans', v)} data-testid="form-is-trans" /> {t('trans')}</label>
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('languages_spoken')}</label>
                <Input value={Array.isArray(form.languages_spoken) ? form.languages_spoken.join(', ') : form.languages_spoken} onChange={(e) => updateField('languages_spoken', e.target.value)} placeholder="English, French" className="bg-white/5 border-white/10 text-white h-10" data-testid="form-languages" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('availability')}</label>
                <Input value={form.availability} onChange={(e) => updateField('availability', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-availability" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('contact')}</label>
                <Input value={form.contact_method} onChange={(e) => updateField('contact_method', e.target.value)} placeholder="phone, email, text" className="bg-white/5 border-white/10 text-white h-10" data-testid="form-contact" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('phone_number')}</label>
                <Input value={form.phone_number} onChange={(e) => updateField('phone_number', e.target.value)} placeholder="+1-555-1234" className="bg-white/5 border-white/10 text-white h-10" data-testid="form-phone-number" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('whatsapp')}</label>
                <Input value={form.whatsapp_optional} onChange={(e) => updateField('whatsapp_optional', e.target.value)} placeholder="+1-555-1234" className="bg-white/5 border-white/10 text-white h-10" data-testid="form-whatsapp" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('telegram')}</label>
                <Input value={form.telegram_optional} onChange={(e) => updateField('telegram_optional', e.target.value)} placeholder="@username" className="bg-white/5 border-white/10 text-white h-10" data-testid="form-telegram" />
              </div>
              <div>
                <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('country')}</label>
                <Input value={form.country} onChange={(e) => updateField('country', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-country" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('short_summary')}</label>
              <Input value={form.short_summary} onChange={(e) => updateField('short_summary', e.target.value)} className="bg-white/5 border-white/10 text-white h-10" data-testid="form-summary" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">{t('description')} *</label>
              <Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[100px]" data-testid="form-description" />
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setEditOpen(false)} variant="outline" className="flex-1 border-white/10 text-[#A3A3A3]" data-testid="form-cancel-btn">{t('cancel')}</Button>
              <Button onClick={handleSave} className="flex-1 bg-[#D4AF37] text-black hover:bg-[#E5C158]" data-testid="form-save-btn">
                {editListing ? t('save') : 'Save & Upload Photos'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Premium Upgrade Dialog */}
        <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
          <DialogContent className="bg-[#0F0F0F] border-white/10 max-w-md" data-testid="premium-upgrade-dialog">
            <DialogHeader>
              <DialogTitle className="text-white font-heading text-xl flex items-center gap-2"><Crown size={20} className="text-gold" /> {t('upgrade_premium')}</DialogTitle>
              <DialogDescription className="text-[#525252]">Select a premium tier and duration</DialogDescription>
            </DialogHeader>
            {upgradeListing && (
              <div className="mt-4 flex flex-col gap-5">
                <p className="text-[#A3A3A3] text-sm">{upgradeListing.display_name} - {upgradeListing.city}</p>
                <div>
                  <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-2 block">{t('premium_type')}</label>
                  <div className="flex gap-3">
                    <button onClick={() => setUpgradeType('featured')} data-testid="upgrade-type-featured"
                      className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${upgradeType === 'featured' ? 'bg-[#D4AF37]/20 text-gold border border-[#D4AF37]/40' : 'bg-white/5 text-[#525252] border border-white/10'}`}>
                      {t('featured')}
                    </button>
                    <button onClick={() => setUpgradeType('top_featured')} data-testid="upgrade-type-top-featured"
                      className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${upgradeType === 'top_featured' ? 'bg-[#D4AF37]/20 text-gold border border-[#D4AF37]/40' : 'bg-white/5 text-[#525252] border border-white/10'}`}>
                      {t('top_featured')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-2 block">{t('duration')}</label>
                  <div className="flex gap-3">
                    {[7, 30, 90].map(d => (
                      <button key={d} onClick={() => setUpgradeDays(d)} data-testid={`upgrade-days-${d}`}
                        className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${upgradeDays === d ? 'bg-[#D4AF37]/20 text-gold border border-[#D4AF37]/40' : 'bg-white/5 text-[#525252] border border-white/10'}`}>
                        {t(`days_${d}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleUpgradePremium} className="bg-[#D4AF37] text-black hover:bg-[#E5C158] h-12 rounded-full mt-2" data-testid="upgrade-confirm-btn">
                  <Crown size={16} className="mr-2" /> {t('pay_with_btc')} — {getPackagePrice()}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
