import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Slider } from '../components/ui/slider';

const CITIES = ['Montréal', 'Laval', 'Longueuil', 'Terrebonne', 'Brossard', 'Repentigny', 'Blainville', 'Mirabel', 'Dollard-des-Ormeaux', 'Châteauguay', 'Mascouche', 'Saint-Eustache', 'Boucherville', 'Vaudreuil-Dorion'];
const ORIGINS = ['French Canadian', 'Brazilian', 'Russian', 'Japanese', 'Korean', 'Colombian', 'Italian', 'Swedish', 'Thai', 'Chinese'];

export function SearchFilters({ filters, onFiltersChange, sort, onSortChange }) {
  const { t } = useI18n();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearch = (val) => {
    onFiltersChange({ ...filters, search: val });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setSheetOpen(false);
  };

  const clearFilters = () => {
    const cleared = { search: filters.search };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setSheetOpen(false);
  };

  const activeFilterCount = Object.keys(filters).filter(k => k !== 'search' && filters[k] !== undefined && filters[k] !== null && filters[k] !== '').length;

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center" data-testid="search-filters">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
        <Input
          value={filters.search || ''}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          data-testid="search-input"
          className="pl-10 bg-white/5 border-white/10 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 text-white placeholder:text-white/20 h-11 rounded-lg"
        />
      </div>

      {/* Sort Dropdown */}
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-full md:w-52 bg-white/5 border-white/10 text-white h-11" data-testid="sort-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1A] border-white/10">
          <SelectItem value="default" className="text-white hover:bg-white/5">{t('sort_default')}</SelectItem>
          <SelectItem value="newest" className="text-white hover:bg-white/5">{t('sort_newest')}</SelectItem>
          <SelectItem value="price_asc" className="text-white hover:bg-white/5">{t('sort_price_asc')}</SelectItem>
          <SelectItem value="price_desc" className="text-white hover:bg-white/5">{t('sort_price_desc')}</SelectItem>
          <SelectItem value="verified" className="text-white hover:bg-white/5">{t('sort_verified')}</SelectItem>
          <SelectItem value="premium" className="text-white hover:bg-white/5">{t('sort_premium')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Filters Sheet Trigger */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="bg-white/5 border-white/10 hover:border-[#D4AF37]/30 hover:bg-white/10 text-white h-11 gap-2" data-testid="filters-toggle">
            <SlidersHorizontal size={15} />
            {t('filters')}
            {activeFilterCount > 0 && (
              <span className="bg-[#D4AF37] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-[#0F0F0F] border-white/5 w-[340px] overflow-y-auto" data-testid="filters-panel">
          <SheetHeader>
            <SheetTitle className="text-white font-heading text-xl">{t('filters')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 mt-6">
            {/* City */}
            <div>
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-2 block">{t('filter_city')}</label>
              <Select value={localFilters.city || ''} onValueChange={(v) => setLocalFilters({...localFilters, city: v === 'all' ? '' : v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder={t('all')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">
                  <SelectItem value="all" className="text-white">{t('all')}</SelectItem>
                  {CITIES.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-2 block">{t('filter_price_range')}</label>
              <div className="px-1">
                <Slider
                  defaultValue={[localFilters.min_price || 0, localFilters.max_price || 2000]}
                  min={0} max={2000} step={50}
                  onValueChange={([min, max]) => setLocalFilters({...localFilters, min_price: min || undefined, max_price: max >= 2000 ? undefined : max})}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-[#525252] mt-1">
                  <span>${localFilters.min_price || 0}</span>
                  <span>${localFilters.max_price || '2000+'}</span>
                </div>
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-2 block">{t('filter_age')}</label>
              <div className="px-1">
                <Slider
                  defaultValue={[localFilters.min_age || 18, localFilters.max_age || 50]}
                  min={18} max={50} step={1}
                  onValueChange={([min, max]) => setLocalFilters({...localFilters, min_age: min > 18 ? min : undefined, max_age: max < 50 ? max : undefined})}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-[#525252] mt-1">
                  <span>{localFilters.min_age || 18}</span>
                  <span>{localFilters.max_age || '50+'}</span>
                </div>
              </div>
            </div>

            {/* Origin */}
            <div>
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-2 block">{t('filter_origin')}</label>
              <Select value={localFilters.origin || ''} onValueChange={(v) => setLocalFilters({...localFilters, origin: v === 'all' ? '' : v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder={t('all')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 max-h-60">
                  <SelectItem value="all" className="text-white">{t('all')}</SelectItem>
                  {ORIGINS.map(o => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Switches */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#A3A3A3]">{t('filter_verified')}</label>
                <Switch checked={!!localFilters.verified} onCheckedChange={(v) => setLocalFilters({...localFilters, verified: v || undefined})} data-testid="filter-verified-switch" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#A3A3A3]">{t('filter_premium')}</label>
                <Switch checked={!!localFilters.premium} onCheckedChange={(v) => setLocalFilters({...localFilters, premium: v || undefined})} data-testid="filter-premium-switch" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#A3A3A3]">{t('filter_incall')}</label>
                <Switch checked={!!localFilters.incall} onCheckedChange={(v) => setLocalFilters({...localFilters, incall: v || undefined})} data-testid="filter-incall-switch" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#A3A3A3]">{t('filter_outcall')}</label>
                <Switch checked={!!localFilters.outcall} onCheckedChange={(v) => setLocalFilters({...localFilters, outcall: v || undefined})} data-testid="filter-outcall-switch" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#A3A3A3]">{t('filter_car_call')}</label>
                <Switch checked={!!localFilters.car_call} onCheckedChange={(v) => setLocalFilters({...localFilters, car_call: v || undefined})} data-testid="filter-car-call-switch" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#A3A3A3]">{t('filter_en_ligne')}</label>
                <Switch checked={!!localFilters.en_ligne} onCheckedChange={(v) => setLocalFilters({...localFilters, en_ligne: v || undefined})} data-testid="filter-en-ligne-switch" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#A3A3A3]">{t('filter_trans')}</label>
                <Switch checked={!!localFilters.is_trans} onCheckedChange={(v) => setLocalFilters({...localFilters, is_trans: v || undefined})} data-testid="filter-trans-switch" />
              </div>
            </div>

            {/* Distance Search */}
            <div>
              <label className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                <MapPin size={12} /> {t('distance_search')}
              </label>
              <Button variant="outline" size="sm"
                className="w-full bg-white/5 border-white/10 text-[#A3A3A3] hover:text-gold hover:border-gold/30 mb-3 text-xs"
                data-testid="use-my-location-btn"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setLocalFilters({...localFilters, user_lat: pos.coords.latitude, user_lng: pos.coords.longitude}),
                      () => {}
                    );
                  }
                }}>
                <MapPin size={12} className="mr-1" /> {t('use_my_location')}
              </Button>
              {localFilters.user_lat && (
                <p className="text-[10px] text-gold/60 mb-2">
                  {localFilters.user_lat?.toFixed(3)}, {localFilters.user_lng?.toFixed(3)}
                </p>
              )}
              <Select value={String(localFilters.radius || 'all')} onValueChange={(v) => setLocalFilters({...localFilters, radius: v === 'all' ? undefined : Number(v)})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="radius-select">
                  <SelectValue placeholder={t('radius')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">
                  <SelectItem value="all" className="text-white">{t('all')}</SelectItem>
                  <SelectItem value="5" className="text-white">5 km</SelectItem>
                  <SelectItem value="10" className="text-white">10 km</SelectItem>
                  <SelectItem value="25" className="text-white">25 km</SelectItem>
                  <SelectItem value="50" className="text-white">50 km</SelectItem>
                  <SelectItem value="100" className="text-white">100 km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply/Clear */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
              <Button onClick={clearFilters} variant="outline" className="flex-1 border-white/10 text-[#A3A3A3] hover:text-white hover:bg-white/5" data-testid="filter-clear-btn">
                <X size={14} className="mr-1" /> {t('filter_clear')}
              </Button>
              <Button onClick={applyFilters} className="flex-1 bg-[#D4AF37] text-black hover:bg-[#E5C158]" data-testid="filter-apply-btn">
                {t('filter_apply')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
