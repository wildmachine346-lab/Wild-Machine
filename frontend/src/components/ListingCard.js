import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { getCoverImage } from '../lib/api';
import { Heart, MapPin, BadgeCheck, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export function ListingCard({ listing, index = 0 }) {
  const { user, toggleFavorite, isFavorited } = useAuth();
  const { t } = useI18n();
  const coverUrl = getCoverImage(listing.media);
  const favorited = isFavorited(listing.id);

  const handleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await toggleFavorite(listing.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        to={listing.slug ? `/escort/${listing.city?.toLowerCase()}/${listing.slug}` : `/listing/${listing.id}`}
        data-testid={`listing-card-${listing.id}`}
        className={`group relative overflow-hidden rounded-xl block transition-all duration-500 ${
          listing.premium_type === 'top_featured' ? 'premium-border animate-pulse-gold' : listing.premium_type === 'featured' ? 'premium-border' : 'bg-[#0F0F0F] border border-white/5 hover:border-white/15'
        }`}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={coverUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'}
            alt={listing.display_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="card-gradient absolute inset-0" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.premium_type === 'top_featured' && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase animate-pulse-gold" data-testid={`badge-top-featured-${listing.id}`}>
                <Crown size={10} />
                {t('top_featured')}
              </span>
            )}
            {listing.premium_type === 'featured' && (
              <span className="flex items-center gap-1 bg-[#D4AF37]/90 text-black text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase" data-testid={`badge-featured-${listing.id}`}>
                <Crown size={10} />
                {t('featured')}
              </span>
            )}
            {listing.is_verified && (
              <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase" data-testid={`badge-verified-${listing.id}`}>
                <BadgeCheck size={10} />
                {t('verified')}
              </span>
            )}
          </div>

          {/* Favorite */}
          {user && (
            <button
              onClick={handleFav}
              data-testid={`favorite-btn-${listing.id}`}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300"
            >
              <Heart
                size={16}
                className={`transition-all duration-300 ${
                  favorited ? 'fill-[#C58F9D] text-[#C58F9D] scale-110' : 'text-white/60 hover:text-white'
                }`}
              />
            </button>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-white font-heading text-lg leading-tight">
                  {listing.display_name}
                  {listing.age && <span className="text-white/60 text-sm ml-1.5">{listing.age}</span>}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={11} className="text-[#A3A3A3]" />
                  <span className="text-[#A3A3A3] text-xs">{listing.city}</span>
                  {listing.distance_km != null && (
                    <span className="text-gold/70 text-[10px] ml-1" data-testid="listing-distance">
                      ({listing.distance_km} {t('km_away')})
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-gold font-semibold text-lg">${listing.price_1h}</span>
                <span className="text-[#A3A3A3] text-[10px] block">{t('per_hour')}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {listing.incall && (
                <span className="text-[9px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t('incall')}
                </span>
              )}
              {listing.outcall && (
                <span className="text-[9px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t('outcall')}
                </span>
              )}
              {listing.car_call && (
                <span className="text-[9px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t('car_call')}
                </span>
              )}
              {listing.en_ligne && (
                <span className="text-[9px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t('en_ligne')}
                </span>
              )}
              {listing.is_trans && (
                <span className="text-[9px] text-[#E5C158] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  {t('trans')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom strip for short summary */}
        {listing.short_summary && (
          <div className="px-4 py-3 bg-[#0F0F0F]">
            <p className="text-[#525252] text-xs line-clamp-1">{listing.short_summary}</p>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
