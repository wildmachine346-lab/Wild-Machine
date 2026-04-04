import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ListingCard } from '../components/ListingCard';
import { SearchFilters } from '../components/SearchFilters';
import { BannerDisplay } from '../components/BannerDisplay';
import api from '../lib/api';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function HomePage() {
  const { t } = useI18n();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort, page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.min_age) params.min_age = filters.min_age;
      if (filters.max_age) params.max_age = filters.max_age;
      if (filters.origin) params.origin = filters.origin;
      if (filters.verified) params.verified = true;
      if (filters.premium) params.premium = true;
      if (filters.incall) params.incall = true;
      if (filters.outcall) params.outcall = true;
      if (filters.car_call) params.car_call = true;
      if (filters.en_ligne) params.en_ligne = true;
      if (filters.is_trans) params.is_trans = true;
      if (filters.user_lat) params.user_lat = filters.user_lat;
      if (filters.user_lng) params.user_lng = filters.user_lng;
      if (filters.radius) params.radius = filters.radius;
      const { data } = await api.get('/listings', { params });
      setListings(data?.listings || []);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="min-h-screen noise-overlay" data-testid="home-page">
      <Helmet>
        <title>Wild Machine - Premium Escort Directory</title>
        <meta name="description" content="Wild Machine is a premium escort directory featuring verified companions in Montréal and surrounding areas." />
        <meta property="og:title" content="Wild Machine - Premium Escort Directory" />
        <meta property="og:description" content="Browse verified escort listings. Discreet, elegant, and trusted." />
      </Helmet>
      <Header />
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Top Banner */}
        <BannerDisplay position="homepage_top_banner" className="mb-8" />

        {/* Hero Section */}
        <div className="mb-10">
          <img src="/logo.png" alt="Wild Machine" className="h-16 sm:h-20 lg:h-24 w-auto" />
          <p className="text-[#A3A3A3] text-base md:text-lg mt-3 max-w-xl leading-relaxed">
            {t('register_subtitle')}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8">
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sort={sort}
            onSortChange={(s) => { setSort(s); setPage(1); }}
          />
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32" data-testid="loading-indicator">
            <Loader2 size={32} className="animate-spin text-gold" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-32" data-testid="no-results">
            <p className="text-[#525252] text-lg">{t('no_results')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" data-testid="listings-grid">
              {listings.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12" data-testid="pagination">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  className="border-white/10 text-[#A3A3A3] hover:text-white hover:bg-white/5 disabled:opacity-30"
                  data-testid="page-prev"
                >
                  {t('back')}
                </Button>
                <span className="text-[#525252] text-sm">{page} / {totalPages}</span>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  variant="outline"
                  className="border-white/10 text-[#A3A3A3] hover:text-white hover:bg-white/5 disabled:opacity-30"
                  data-testid="page-next"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Mid Banner */}
        <BannerDisplay position="homepage_mid_banner" className="mt-12" />
      </main>
      <Footer />
    </div>
  );
}
