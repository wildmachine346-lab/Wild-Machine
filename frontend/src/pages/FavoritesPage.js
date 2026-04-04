import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import { ListingCard } from '../components/ListingCard';
import api from '../lib/api';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FavoritesPage() {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data } = await api.get('/favorites');
        setFavorites(data.favorites);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  return (
    <div className="min-h-screen noise-overlay" data-testid="favorites-page">
      <Header />
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl text-[#F5F5F5] flex items-center gap-3">
            <Heart size={28} className="text-[#C58F9D]" />
            {t('nav_favorites')}
          </h1>
          <p className="text-[#525252] text-sm mt-2">{t('favorites_subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-gold" />
          </div>
        ) : favorites.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 glass rounded-xl" data-testid="no-favorites">
            <Heart size={48} className="text-[#525252] mx-auto mb-4" />
            <p className="text-[#525252] text-lg">{t('no_favorites')}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" data-testid="favorites-grid">
            {favorites.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
