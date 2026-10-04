import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

interface GifResult {
  id: string;
  url: string;
  preview: string;
  title: string;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

const FALLBACK_GIFS = [
  { id: 'g1', url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', preview: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', title: 'Laughing Cat' },
  { id: 'g2', url: 'https://media.giphy.com/media/l4FGp3I5v2QuP5s3S/giphy.gif', preview: 'https://media.giphy.com/media/l4FGp3I5v2QuP5s3S/giphy.gif', title: 'Cute Bunny' },
  { id: 'g3', url: 'https://media.giphy.com/media/26BRrSvJUa0crqw8g/giphy.gif', preview: 'https://media.giphy.com/media/26BRrSvJUa0crqw8g/giphy.gif', title: 'Happy Dance' },
  { id: 'g4', url: 'https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif', preview: 'https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif', title: 'Heart Love' },
];

const QUICK_SEARCHES = ['trending', 'aesthetic', 'cute', 'funny', 'love', 'dance', 'party', 'kpop', 'meme', 'wink', 'hug', 'vibes', 'sparkles', 'fire', 'omg'];

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>(FALLBACK_GIFS);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [apiError, setApiError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchGifs = async (q: string) => {
    setLoading(true);
    setSearched(false);
    setApiError(false);

    try {
      if (!GIPHY_API_KEY) throw new Error('Missing GIPHY API key');

      const endpoint = new URL(`https://api.giphy.com/v1/gifs/${q ? 'search' : 'trending'}`);
      endpoint.searchParams.set('api_key', GIPHY_API_KEY);
      endpoint.searchParams.set('limit', '16');
      endpoint.searchParams.set('rating', 'g');
      if (q) {
        endpoint.searchParams.set('q', q);
        endpoint.searchParams.set('lang', 'vi');
      }

      const res = await fetch(endpoint.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`GIF API failed with status ${res.status}`);
      }

      const json = await res.json();
      const results: GifResult[] = Array.isArray(json.data)
        ? json.data
            .map((r: { id: string; title?: string; images?: Record<string, { url?: string }> }) => ({
              id: String(r.id),
              url: r.images?.original?.url || r.images?.downsized_medium?.url || r.images?.fixed_height?.url || '',
              preview: r.images?.fixed_height_small?.url || r.images?.downsized_medium?.url || r.images?.fixed_height?.url || '',
              title: r.title || 'GIF',
            }))
            .filter((g: GifResult) => !!g.url)
        : [];

      setGifs(results);
    } catch {
      setGifs(FALLBACK_GIFS);
      setApiError(true);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    void fetchGifs('');
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) fetchGifs(query.trim());
  };

  return (
    <div className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-zinc-200 w-80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-zinc-100">
        <span className="text-[13px] font-bold text-zinc-700 flex items-center gap-1.5">
          <span className="text-lg">🎬</span> GIF
          <span className="text-[10px] text-zinc-400 font-normal">Powered by Giphy</span>
        </span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100">
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm GIF..."
            className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-300"
          />
        </div>
      </form>

      {/* Quick search chips */}
      <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto">
        {QUICK_SEARCHES.map((q) => (
          <button
            key={q}
            onClick={() => { const searchTerm = q === 'trending' ? '' : q; setQuery(searchTerm); fetchGifs(searchTerm); }}
            className="flex-shrink-0 text-[11px] font-semibold bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full hover:bg-pink-100 transition-colors capitalize"
          >
            {q}
          </button>
        ))}
      </div>

      {/* GIF Grid */}
      <div className="px-2 pb-3 max-h-52 overflow-y-auto">
        {apiError && (
          <p className="px-1 pb-2 text-[11px] text-amber-700">
            {!GIPHY_API_KEY
              ? 'Cần cấu hình VITE_GIPHY_API_KEY để tìm GIF; đang hiển thị GIF dự phòng.'
              : 'Không thể kết nối GIPHY; đang hiển thị GIF dự phòng.'}
          </p>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 size={24} className="animate-spin text-pink-400" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => { onSelect(gif.url); onClose(); }}
                className="relative rounded-xl overflow-hidden aspect-square bg-zinc-100 hover:ring-2 hover:ring-pink-400 hover:scale-105 transform transition-all duration-150"
                title={gif.title}
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        {!loading && gifs.length === 0 && searched && (
          <p className="text-center text-[12px] text-zinc-400 py-6">Không tìm thấy GIF nào</p>
        )}
      </div>
    </div>
  );
}
