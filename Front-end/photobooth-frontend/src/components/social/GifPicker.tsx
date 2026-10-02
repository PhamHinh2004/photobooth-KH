import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

// Tenor GIF search – we use the public demo key (replace with your own for production)
const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPzMkxC0qRoJGbFQ'; // demo key
const CLIENT_KEY = 'kh-photobooth';

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

// Curated fallback GIFs (Tenor public URLs) for when API fails
const FALLBACK_GIFS = [
  { id: '1', url: 'https://media.tenor.com/3NEq4y_XBGYAAAC/laugh-cat.gif', preview: 'https://media.tenor.com/3NEq4y_XBGYAAAC/laugh-cat.gif', title: 'Laugh Cat' },
  { id: '2', url: 'https://media.tenor.com/YBBVBLkMFuoAAAAC/cute-bunny.gif', preview: 'https://media.tenor.com/YBBVBLkMFuoAAAAC/cute-bunny.gif', title: 'Cute Bunny' },
  { id: '3', url: 'https://media.tenor.com/BqqedKaFPPQAAAAC/happy-dance.gif', preview: 'https://media.tenor.com/BqqedKaFPPQAAAAC/happy-dance.gif', title: 'Happy Dance' },
  { id: '4', url: 'https://media.tenor.com/mfaOXGgKEDsAAAAC/heart-love.gif', preview: 'https://media.tenor.com/mfaOXGgKEDsAAAAC/heart-love.gif', title: 'Heart Love' },
];

const QUICK_SEARCHES = ['trending', 'aesthetic', 'cute', 'funny', 'love', 'dance', 'party', 'kpop', 'meme', 'wink', 'hug', 'vibes', 'sparkles', 'fire', 'omg'];

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchGifs = async (q: string) => {
    setLoading(true);
    try {
      const endpoint = q
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${TENOR_API_KEY}&client_key=${CLIENT_KEY}&limit=16&media_filter=gif,tinygif`
        : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=${CLIENT_KEY}&limit=16&media_filter=gif,tinygif`;

      const res = await fetch(endpoint);
      const json = await res.json();

      if (json.results) {
        const results: GifResult[] = json.results.map((r: any) => ({
          id: r.id,
          url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
          preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
          title: r.title || '',
        })).filter((g: GifResult) => g.url);
        setGifs(results);
      }
    } catch {
      // Fallback
      setGifs(FALLBACK_GIFS);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    fetchGifs('cute');
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
          <span className="text-[10px] text-zinc-400 font-normal">Powered by Tenor</span>
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
            onClick={() => { setQuery(q); fetchGifs(q); }}
            className="flex-shrink-0 text-[11px] font-semibold bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full hover:bg-pink-100 transition-colors capitalize"
          >
            {q}
          </button>
        ))}
      </div>

      {/* GIF Grid */}
      <div className="px-2 pb-3 max-h-52 overflow-y-auto">
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
