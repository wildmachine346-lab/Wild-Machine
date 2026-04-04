import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import api from '../lib/api';
import { toast } from 'sonner';
import { Users, FileText, AlertTriangle, Crown, BadgeCheck, ShieldCheck, Ban, Eye, Trash2, ChevronLeft, ChevronRight, Plus, Image, ExternalLink, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen noise-overlay" data-testid="admin-dashboard">
      <Header />
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <h1 className="font-heading text-3xl md:text-4xl text-[#F5F5F5] mb-8">{t('admin_dashboard')}</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5 border border-white/10 rounded-lg p-1 mb-8 flex-wrap">
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-md text-sm" data-testid="admin-tab-stats">{t('statistics')}</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-md text-sm" data-testid="admin-tab-users">{t('users')}</TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-md text-sm" data-testid="admin-tab-listings">{t('listings')}</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-md text-sm" data-testid="admin-tab-reports">{t('reports')}</TabsTrigger>
            <TabsTrigger value="banners" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-md text-sm" data-testid="admin-tab-banners">{t('banner_management')}</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-md text-sm" data-testid="admin-tab-payments">{t('payments')}</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {stats && <StatsPanel stats={stats} t={t} />}
          </TabsContent>
          <TabsContent value="users"><UsersPanel t={t} /></TabsContent>
          <TabsContent value="listings"><ListingsPanel t={t} /></TabsContent>
          <TabsContent value="reports"><ReportsPanel t={t} /></TabsContent>
          <TabsContent value="banners"><BannersPanel t={t} /></TabsContent>
          <TabsContent value="payments"><PaymentsPanel t={t} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatsPanel({ stats, t }) {
  const items = [
    { label: t('total_users'), value: stats.total_users, icon: Users },
    { label: t('escorts'), value: stats.total_escorts, icon: Users },
    { label: t('clients'), value: stats.total_clients, icon: Users },
    { label: t('active_listings'), value: stats.active_listings, icon: FileText },
    { label: t('premium_listings'), value: stats.premium_listings, icon: Crown },
    { label: t('verified_escorts'), value: stats.verified_escorts, icon: BadgeCheck },
    { label: t('pending_reports'), value: stats.pending_reports, icon: AlertTriangle },
    { label: t('new_today'), value: stats.new_listings_today || 0, icon: FileText },
    { label: t('total_phone'), value: stats.total_phone_clicks || 0, icon: Users },
    { label: t('total_listings'), value: stats.total_listings, icon: FileText },
    { label: t('total_revenue'), value: `$${stats.total_revenue || 0}`, icon: DollarSign },
    { label: t('payments'), value: stats.total_payments || 0, icon: DollarSign },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="admin-stats-grid">
      {items.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="glass rounded-xl p-5">
          <s.icon size={16} className="text-gold mb-2" />
          <p className="text-2xl font-semibold text-[#F5F5F5]">{s.value}</p>
          <p className="text-xs text-[#525252] uppercase tracking-widest">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

function UsersPanel({ t }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetch = useCallback(async () => {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    const { data } = await api.get('/admin/users', { params });
    setUsers(data.users); setTotal(data.total); setPages(data.pages);
  }, [search, roleFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const act = async (userId, action) => {
    try {
      await api.put(`/admin/users/${userId}?action=${action}`);
      toast.success(`User ${action}`);
      fetch();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="bg-white/5 border-white/10 text-white flex-1" data-testid="admin-users-search" />
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white" data-testid="admin-users-role-filter"><SelectValue placeholder={t('all')} /></SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-white/10">
            <SelectItem value="all" className="text-white">{t('all')}</SelectItem>
            <SelectItem value="escort" className="text-white">{t('escorts')}</SelectItem>
            <SelectItem value="client" className="text-white">{t('clients')}</SelectItem>
            <SelectItem value="admin" className="text-white">{t('admins')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2" data-testid="admin-users-list">
        {users.map(u => (
          <div key={u.id} className="glass rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[#F5F5F5] text-sm font-medium truncate">{u.display_name} <span className="text-[#525252]">({u.email})</span></p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#A3A3A3] uppercase">{u.role}</span>
                {u.is_verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase">{t('verified')}</span>}
                {u.is_banned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 uppercase">Banned</span>}
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {u.role === 'escort' && !u.is_verified && (
                <Button size="sm" onClick={() => act(u.id, 'verify')} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 h-8 text-xs" data-testid={`verify-user-${u.id}`}>
                  <ShieldCheck size={12} className="mr-1" /> {t('verify_action')}
                </Button>
              )}
              {u.role === 'escort' && u.is_verified && (
                <Button size="sm" onClick={() => act(u.id, 'unverify')} variant="outline" className="border-white/10 text-[#A3A3A3] h-8 text-xs" data-testid={`unverify-user-${u.id}`}>
                  {t('unverify')}
                </Button>
              )}
              {!u.is_banned ? (
                <Button size="sm" onClick={() => act(u.id, 'ban')} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 h-8 text-xs" data-testid={`ban-user-${u.id}`}>
                  <Ban size={12} className="mr-1" /> {t('ban')}
                </Button>
              ) : (
                <Button size="sm" onClick={() => act(u.id, 'unban')} className="bg-white/5 text-[#A3A3A3] hover:bg-white/10 h-8 text-xs" data-testid={`unban-user-${u.id}`}>
                  {t('unban')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Pager page={page} pages={pages} setPage={setPage} />
    </div>
  );
}

function ListingsPanel({ t }) {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetch = useCallback(async () => {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    const { data } = await api.get('/admin/listings', { params });
    setListings(data.listings); setPages(data.pages);
  }, [search, statusFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const act = async (id, action) => {
    try {
      await api.put(`/admin/listings/${id}?action=${action}`);
      toast.success(`Listing ${action}`);
      fetch();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search listings..." className="bg-white/5 border-white/10 text-white flex-1" data-testid="admin-listings-search" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white" data-testid="admin-listings-status-filter"><SelectValue placeholder={t('all')} /></SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-white/10">
            <SelectItem value="all" className="text-white">{t('all')}</SelectItem>
            <SelectItem value="active" className="text-white">{t('active')}</SelectItem>
            <SelectItem value="pending" className="text-white">{t('pending')}</SelectItem>
            <SelectItem value="rejected" className="text-white">{t('rejected')}</SelectItem>
            <SelectItem value="suspended" className="text-white">{t('suspended')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2" data-testid="admin-listings-list">
        {listings.map(l => (
          <div key={l.id} className="glass rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[#F5F5F5] text-sm font-medium truncate">{l.display_name} <span className="text-[#525252]">- {l.city}</span></p>
              <div className="flex gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${l.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : l.status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-[#525252]'}`}>{l.status}</span>
                {l.premium_type === 'top_featured' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37]/30 to-[#E5C158]/30 text-gold uppercase">{t('top_featured')}</span>}
                {l.premium_type === 'featured' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-gold uppercase">{t('featured')}</span>}
                {l.is_verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase">{t('verified')}</span>}
                <span className="text-[10px] text-[#525252]">${l.price_1h}/hr &middot; {l.phone_clicks || 0} clicks</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
              {l.status !== 'active' && <Button size="sm" onClick={() => act(l.id, 'approve')} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 h-7 text-xs" data-testid={`approve-listing-${l.id}`}>{t('approve')}</Button>}
              {l.status === 'active' && <Button size="sm" onClick={() => act(l.id, 'suspend')} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 h-7 text-xs" data-testid={`suspend-listing-${l.id}`}>{t('suspend')}</Button>}
              {l.premium_type !== 'featured' && <Button size="sm" onClick={() => act(l.id, 'featured')} className="bg-[#D4AF37]/20 text-gold hover:bg-[#D4AF37]/30 h-7 text-xs" data-testid={`featured-listing-${l.id}`}><Crown size={10} className="mr-1" /> {t('featured')}</Button>}
              {l.premium_type !== 'top_featured' && <Button size="sm" onClick={() => act(l.id, 'top_featured')} className="bg-[#D4AF37]/30 text-gold hover:bg-[#D4AF37]/40 h-7 text-xs" data-testid={`top-featured-listing-${l.id}`}><Crown size={10} className="mr-1" /> {t('top_featured')}</Button>}
              {l.is_premium && <Button size="sm" onClick={() => act(l.id, 'unpremium')} variant="outline" className="border-white/10 text-[#525252] h-7 text-xs" data-testid={`unpremium-listing-${l.id}`}>{t('remove_premium')}</Button>}
              <Button size="sm" onClick={() => act(l.id, 'delete')} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 h-7 text-xs" data-testid={`delete-listing-${l.id}`}><Trash2 size={10} /></Button>
            </div>
          </div>
        ))}
      </div>
      <Pager page={page} pages={pages} setPage={setPage} />
    </div>
  );
}

function ReportsPanel({ t }) {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetch = useCallback(async () => {
    const { data } = await api.get('/admin/reports', { params: { page, limit: 15 } });
    setReports(data.reports); setPages(data.pages);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const act = async (id, action) => {
    try {
      await api.put(`/admin/reports/${id}?action=${action}`);
      toast.success(`Report ${action}`);
      fetch();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div>
      <div className="flex flex-col gap-2" data-testid="admin-reports-list">
        {reports.length === 0 && <p className="text-[#525252] text-center py-8">No reports</p>}
        {reports.map(r => (
          <div key={r.id} className="glass rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[#F5F5F5] text-sm"><span className="text-[#A3A3A3] font-medium capitalize">{r.reason}</span></p>
              {r.details && <p className="text-[#525252] text-xs mt-1 truncate">{r.details}</p>}
              <p className="text-[10px] text-[#525252] mt-1">Listing: {r.listing_id?.slice(0, 8)}... &middot; Status: {r.status}</p>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-1.5 flex-shrink-0">
                <Button size="sm" onClick={() => act(r.id, 'reviewed')} className="bg-emerald-500/20 text-emerald-400 h-7 text-xs" data-testid={`review-report-${r.id}`}>{t('review')}</Button>
                <Button size="sm" onClick={() => act(r.id, 'dismissed')} className="bg-white/5 text-[#525252] h-7 text-xs" data-testid={`dismiss-report-${r.id}`}>{t('dismiss')}</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} pages={pages} setPage={setPage} />
    </div>
  );
}

function BannersPanel({ t }) {
  const [banners, setBanners] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ banner_position: 'homepage_top_banner', banner_link: '', enabled: true });

  const fetch = useCallback(async () => {
    const { data } = await api.get('/admin/banners');
    setBanners(data.banners);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async () => {
    try {
      await api.post('/admin/banners', form);
      toast.success('Banner created');
      setCreating(false);
      fetch();
    } catch { toast.error('Failed to create banner'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/banners/${id}`);
      toast.success('Banner deleted');
      fetch();
    } catch { toast.error('Failed to delete'); }
  };

  const handleUpload = async (bannerId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/admin/banners/${bannerId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Banner image uploaded');
      fetch();
    } catch { toast.error('Upload failed'); }
  };

  const POSITIONS = ['homepage_top_banner', 'homepage_mid_banner', 'sidebar_banner', 'listing_bottom_banner'];

  return (
    <div data-testid="admin-banners-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#F5F5F5] font-heading text-xl">{t('banner_management')}</h2>
        <Button onClick={() => setCreating(!creating)} className="bg-[#D4AF37] text-black hover:bg-[#E5C158] gap-2 rounded-full" data-testid="create-banner-btn">
          <Plus size={14} /> Create Banner
        </Button>
      </div>

      {creating && (
        <div className="glass rounded-xl p-6 mb-6 flex flex-col gap-4" data-testid="banner-create-form">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">Position</label>
              <Select value={form.banner_position} onValueChange={(v) => setForm({...form, banner_position: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">
                  {POSITIONS.map(p => <SelectItem key={p} value={p} className="text-white">{p.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1 block">Link URL</label>
              <Input value={form.banner_link} onChange={(e) => setForm({...form, banner_link: e.target.value})} placeholder="https://..." className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setCreating(false)} variant="outline" className="border-white/10 text-[#A3A3A3]">{t('cancel')}</Button>
            <Button onClick={handleCreate} className="bg-[#D4AF37] text-black hover:bg-[#E5C158]" data-testid="banner-save-btn">Create</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {banners.length === 0 && <p className="text-[#525252] text-center py-8">No banners</p>}
        {banners.map(b => (
          <div key={b.id} className="glass rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {b.banner_image ? (
                <div className="w-20 h-12 rounded bg-white/5 overflow-hidden flex-shrink-0">
                  <img src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${b.banner_image}`} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-12 rounded bg-white/5 flex items-center justify-center flex-shrink-0"><Image size={16} className="text-[#525252]" /></div>
              )}
              <div className="min-w-0">
                <p className="text-[#F5F5F5] text-sm font-medium capitalize">{b.banner_position.replace(/_/g, ' ')}</p>
                <div className="flex gap-3 mt-1 text-[10px] text-[#525252]">
                  <span>{b.banner_views || 0} views</span>
                  <span>{b.banner_clicks || 0} clicks</span>
                  <span className={b.enabled ? 'text-emerald-400' : 'text-red-400'}>{b.enabled ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <label className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white cursor-pointer" data-testid={`upload-banner-${b.id}`}>
                <Image size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && handleUpload(b.id, e.target.files[0])} />
              </label>
              {b.banner_link && (
                <a href={b.banner_link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white"><ExternalLink size={14} /></a>
              )}
              <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-[#A3A3A3] hover:text-red-400" data-testid={`delete-banner-${b.id}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function Pager({ page, pages, setPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="text-[#525252] hover:text-white disabled:opacity-30"><ChevronLeft size={18} /></button>
      <span className="text-[#525252] text-sm">{page}/{pages}</span>
      <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages} className="text-[#525252] hover:text-white disabled:opacity-30"><ChevronRight size={18} /></button>
    </div>
  );
}

function PaymentsPanel({ t }) {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/payments', { params: { page, limit: 15 } });
      setPayments(data.payments || []);
      setPages(data.pages || 1);
    } catch { setPayments([]); }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div data-testid="admin-payments-panel">
      <h2 className="text-white font-heading text-lg mb-4">{t('payment_history')}</h2>
      {payments.length === 0 ? (
        <p className="text-[#525252] text-sm">No payment transactions yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map(txn => (
            <div key={txn.id} className="glass rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[#F5F5F5] text-sm font-medium truncate">
                  {txn.user_email} <span className="text-[#525252]">- {txn.package_id}</span>
                </p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${txn.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : txn.payment_status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                    {txn.payment_status}
                  </span>
                  <span className="text-[10px] text-[#525252]">{new Date(txn.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-gold font-semibold">${txn.amount}</span>
                <span className="text-[#525252] text-xs block">{txn.currency?.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pager page={page} pages={pages} setPage={setPage} />
    </div>
  );
}
