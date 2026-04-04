import { useState, useRef, useCallback } from 'react';
import { useI18n } from '../context/I18nContext';
import api, { getMediaUrl } from '../lib/api';
import { toast } from 'sonner';
import { Upload, X, Star, GripVertical, Image, Film, Loader2, AlertCircle } from 'lucide-react';

const MAX_IMAGES = 20;
const MAX_VIDEOS = 2;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEOS = ['video/mp4', 'video/webm'];
const MAX_IMAGE_DIM = 1920;

function resizeImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width <= MAX_IMAGE_DIM && height <= MAX_IMAGE_DIM) { resolve(file); return; }
      const scale = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: outType }));
      }, outType, 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function MediaUploader({ listingId, media = [], onMediaChange }) {
  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const images = media.filter(m => m.type === 'image' || (!m.type && !m.content_type?.startsWith('video')));
  const videos = media.filter(m => m.type === 'video' || m.content_type?.startsWith('video'));

  const uploadFile = useCallback(async (file) => {
    const uploadId = `${Date.now()}-${Math.random()}`;
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    const isVideo = file.type.startsWith('video/');

    setUploads(prev => [...prev, { id: uploadId, name: file.name, progress: 0, preview, isVideo, error: null }]);

    try {
      const processed = await resizeImage(file);
      const fd = new FormData();
      fd.append('file', processed);
      await api.post(`/upload/${listingId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress: pct } : u));
        }
      });
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      if (preview) URL.revokeObjectURL(preview);
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed';
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, error: msg, progress: 0 } : u));
      return false;
    }
  }, [listingId]);

  const handleFiles = useCallback(async (files) => {
    if (!listingId) { toast.error('Save listing first to upload media'); return; }
    const fileList = Array.from(files);
    const errors = [];
    const valid = [];
    const currentImages = media.filter(m => m.type === 'image' || (!m.type && !m.content_type?.startsWith('video')));
    const currentVideos = media.filter(m => m.type === 'video' || m.content_type?.startsWith('video'));
    for (const f of fileList) {
      const isImg = ACCEPTED_IMAGES.includes(f.type);
      const isVid = ACCEPTED_VIDEOS.includes(f.type);
      if (!isImg && !isVid) { errors.push(`${f.name}: unsupported format`); continue; }
      if (isImg && f.size > MAX_IMAGE_SIZE) { errors.push(`${f.name}: image too large (max 5MB)`); continue; }
      if (isVid && f.size > MAX_VIDEO_SIZE) { errors.push(`${f.name}: video too large (max 50MB)`); continue; }
      if (isImg && currentImages.length >= MAX_IMAGES) { errors.push(`Max ${MAX_IMAGES} images reached`); continue; }
      if (isVid && currentVideos.length >= MAX_VIDEOS) { errors.push(`Max ${MAX_VIDEOS} videos reached`); continue; }
      valid.push(f);
    }
    if (errors.length) toast.error(errors.join('\n'));
    let uploaded = 0;
    for (const f of valid) {
      const ok = await uploadFile(f);
      if (ok) uploaded++;
    }
    if (uploaded > 0) onMediaChange?.();
  }, [listingId, uploadFile, onMediaChange, media]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDeleteMedia = async (mediaId) => {
    try {
      await api.delete(`/media/${listingId}/${mediaId}`);
      onMediaChange?.();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSetCover = async (mediaId) => {
    try {
      await api.put(`/media/${listingId}/cover/${mediaId}`);
      onMediaChange?.();
    } catch { toast.error('Failed to set cover'); }
  };

  const handleDragStart = (idx) => setDraggingIdx(idx);
  const handleDragEnd = () => setDraggingIdx(null);
  const handleDragOverItem = (e, idx) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const newMedia = [...media];
    const [moved] = newMedia.splice(draggingIdx, 1);
    newMedia.splice(idx, 0, moved);
    setDraggingIdx(idx);
    // Save reorder
    const ids = newMedia.map(m => m.id);
    api.put(`/media/${listingId}/reorder`, { media_ids: ids }).then(() => onMediaChange?.()).catch(() => {});
  };

  const allMedia = [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-3" data-testid="media-uploader">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#F5F5F5] flex items-center gap-2">
          <Image size={14} className="text-gold" /> Photos & Videos
        </h3>
        <div className="flex gap-3 text-[10px] text-[#525252] uppercase tracking-wider">
          <span className={images.length >= MAX_IMAGES ? 'text-red-400' : ''}>{images.length}/{MAX_IMAGES} photos</span>
          <span className={videos.length >= MAX_VIDEOS ? 'text-red-400' : ''}>{videos.length}/{MAX_VIDEOS} videos</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all text-center ${
          dragOver
            ? 'border-gold bg-gold/5'
            : 'border-white/10 hover:border-gold/30 hover:bg-white/[0.02]'
        }`}
        data-testid="media-drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          data-testid="media-file-input"
        />
        <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-gold' : 'text-[#525252]'}`} />
        <p className="text-sm text-[#A3A3A3]">
          {dragOver ? 'Drop files here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-[10px] text-[#525252] mt-1">
          JPG, PNG, WebP (max 5MB) &middot; MP4, WebM (max 50MB)
        </p>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2" data-testid="upload-progress-list">
          {uploads.map(u => (
            <div key={u.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
              {u.preview ? (
                <img src={u.preview} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              ) : u.isVideo ? (
                <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0"><Film size={16} className="text-[#525252]" /></div>
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#A3A3A3] truncate">{u.name}</p>
                {u.error ? (
                  <p className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {u.error}</p>
                ) : (
                  <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full transition-all duration-300" style={{ width: `${u.progress}%` }} />
                  </div>
                )}
              </div>
              {!u.error && u.progress < 100 && <Loader2 size={14} className="text-gold animate-spin flex-shrink-0" />}
              {u.error && (
                <button onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))} className="text-[#525252] hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media grid */}
      {allMedia.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2" data-testid="media-grid">
          {allMedia.map((m, idx) => {
            const isVideo = m.type === 'video' || m.content_type?.startsWith('video');
            const isCover = m.is_cover;
            const url = getMediaUrl(m);
            return (
              <div
                key={m.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOverItem(e, idx)}
                className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                  isCover ? 'border-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'border-transparent hover:border-white/20'
                } ${draggingIdx === idx ? 'opacity-50 scale-95' : ''}`}
                data-testid={`media-item-${m.id}`}
              >
                {isVideo ? (
                  <div className="w-full h-full bg-black flex items-center justify-center relative">
                    <video src={url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film size={20} className="text-white/80" />
                    </div>
                  </div>
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <GripVertical size={14} className="text-white/50 absolute top-1.5 left-1.5" />
                  {!isVideo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetCover(m.id); }}
                      className={`p-1.5 rounded-full transition ${isCover ? 'bg-gold text-black' : 'bg-white/10 text-white hover:bg-gold/50'}`}
                      title="Set as cover"
                      data-testid={`set-cover-${m.id}`}
                    >
                      <Star size={12} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteMedia(m.id); }}
                    className="p-1.5 rounded-full bg-white/10 text-white hover:bg-red-500/50 transition"
                    title="Delete"
                    data-testid={`delete-media-${m.id}`}
                  >
                    <X size={12} />
                  </button>
                </div>
                {/* Cover badge */}
                {isCover && (
                  <div className="absolute top-1 left-1 bg-gold text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Cover
                  </div>
                )}
                {/* Video badge */}
                {isVideo && (
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                    <Film size={8} /> Video
                  </div>
                )}
                {/* Order number */}
                <div className="absolute bottom-1 right-1 bg-black/50 text-white/60 text-[8px] w-4 h-4 flex items-center justify-center rounded">
                  {idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {allMedia.length === 0 && uploads.length === 0 && (
        <p className="text-center text-[#525252] text-xs py-2">No media uploaded yet. Photos are the most important part of your listing!</p>
      )}
    </div>
  );
}
