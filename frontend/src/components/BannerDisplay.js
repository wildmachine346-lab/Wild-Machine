import { useState, useEffect } from 'react';
import api, { API } from '../lib/api';

export function BannerDisplay({ position, className = '' }) {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await api.get(`/banners/${position}`);
        setBanners(data.banners || []);
      } catch {}
    };
    fetchBanners();
  }, [position]);

  if (banners.length === 0) return null;

  const handleClick = async (banner) => {
    try {
      await api.post(`/banners/${banner.id}/click`);
    } catch {}
  };

  return (
    <div className={`${className}`} data-testid={`banner-${position}`}>
      {banners.map(banner => (
        <div key={banner.id} className="relative rounded-xl overflow-hidden border border-white/5 bg-[#0F0F0F]">
          {banner.banner_link ? (
            <a
              href={banner.banner_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(banner)}
              className="block"
            >
              {banner.banner_image ? (
                <img
                  src={`${API}/files/${banner.banner_image}`}
                  alt="Advertisement"
                  className="w-full h-auto object-cover max-h-32 md:max-h-40"
                  loading="lazy"
                />
              ) : (
                <div className="h-24 md:h-32 flex items-center justify-center bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A]">
                  <span className="text-[#525252] text-xs uppercase tracking-widest">Advertisement</span>
                </div>
              )}
            </a>
          ) : (
            <>
              {banner.banner_image ? (
                <img
                  src={`${API}/files/${banner.banner_image}`}
                  alt="Advertisement"
                  className="w-full h-auto object-cover max-h-32 md:max-h-40"
                  loading="lazy"
                />
              ) : (
                <div className="h-24 md:h-32 flex items-center justify-center bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A]">
                  <span className="text-[#525252] text-xs uppercase tracking-widest">Advertisement</span>
                </div>
              )}
            </>
          )}
          <span className="absolute top-1 right-2 text-[8px] text-white/15 uppercase tracking-widest">Ad</span>
        </div>
      ))}
    </div>
  );
}
