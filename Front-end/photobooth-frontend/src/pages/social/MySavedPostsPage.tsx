import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socialApi } from '../../api/social.api';
import { Loader2, Bookmark, Grid3X3, Heart, MessageCircle, Eye, Plus, Trash2, X } from 'lucide-react';
import { useSocialStore } from '../../stores/social.store';
import { message, Modal } from 'antd';

interface SavedPost {
  id: string;
  cover_image_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  saves_count?: number;
  views_count?: number;
  collection_id?: string | null;
  created_at: string;
  account: {
    id?: string;
    username?: string;
    full_name?: string;
    avatarUrl?: string | null;
    avatar_url?: string | null;
    customer?: {
      fullName?: string | null;
      full_name?: string | null;
      image?: string | null;
    } | null;
  };
  session?: {
    session_type?: string;
    photo?: {
      frame?: {
        id: string;
        name: string;
      };
    };
  };
}

interface SavedCollection {
  id: string;
  name: string;
}

export default function MySavedPostsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchCollectionData() {
      try {
        setLoading(true);
        setLoadError('');
        const [collectionData, savedData] = await Promise.all([
          socialApi.getMySavedCollections(),
          socialApi.getMySavedPosts(1, 100, selectedCollectionId || undefined),
        ]);
        if (!cancelled) {
          setCollections(collectionData || []);
          setPosts(savedData.data || []);
          setError('');
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(err.response?.data?.message || 'Không thể tải bộ sưu tập.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchCollectionData();
    return () => { cancelled = true; };
  }, [selectedCollectionId]);

  async function handleCreateCollection(event: React.FormEvent) {
    event.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;

    try {
      const collection = await socialApi.createSavedCollection(name);
      setCollections((current) => [...current, collection]);
      setNewCollectionName('');
      setShowCreateForm(false);
      setSelectedCollectionId(collection.id);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo bộ sưu tập.');
    }
  }

  async function handleDeleteCollection() {
    if (!selectedCollectionId) return;
    const collection = collections.find((item) => item.id === selectedCollectionId);
    if (!collection) return;

    const collectionId = selectedCollectionId;
    Modal.confirm({
      title: `Xóa bộ sưu tập "${collection.name}"?`,
      content: 'Bộ sưu tập sẽ bị xóa, nhưng các bài viết vẫn được giữ trong mục Tất cả.',
      okText: 'Xóa bộ sưu tập',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await socialApi.deleteSavedCollection(collectionId);
          setCollections((current) => current.filter((item) => item.id !== collectionId));
          setSelectedCollectionId(null);
          setError('');
          message.success('Đã xóa bộ sưu tập.');
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Không thể xóa bộ sưu tập.';
          setError(errorMessage);
          message.error(errorMessage);
          throw err;
        }
      },
    });
  }

  async function handleAssignCollection(post: SavedPost, collectionId: string) {
    const nextCollectionId = collectionId || null;
    const previousCollectionId = post.collection_id || null;
    if (nextCollectionId === previousCollectionId) return;

    setUpdatingPostId(post.id);
    setPosts((current) => current.map((item) => item.id === post.id
      ? { ...item, collection_id: nextCollectionId }
      : item));
    try {
      await socialApi.setSavedPostCollection(post.id, nextCollectionId);
      if (selectedCollectionId && nextCollectionId !== selectedCollectionId) {
        setPosts((current) => current.filter((item) => item.id !== post.id));
      }
    } catch (err: any) {
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, collection_id: previousCollectionId }
        : item));
      setError(err.response?.data?.message || 'Không thể chuyển bài viết.');
    } finally {
      setUpdatingPostId(null);
    }
  }

  async function handleUnsave(post: SavedPost) {
    setSavingPostId(post.id);
    const previousPosts = posts;
    setPosts((current) => current.filter((item) => item.id !== post.id));
    try {
      await socialApi.toggleSave(post.id);
      const store = useSocialStore.getState();
      useSocialStore.setState({ savedPostIds: store.savedPostIds.filter((id) => id !== post.id) });
      setError('');
      message.success('Đã bỏ lưu bài viết.');
    } catch (err: any) {
      setPosts(previousPosts);
      setError(err.response?.data?.message || 'Không thể bỏ lưu bài viết.');
      message.error('Không thể bỏ lưu bài viết.');
    } finally {
      setSavingPostId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-zinc-400 text-sm font-medium">Đang tải bộ sưu tập...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto p-4 pt-24">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
          <p className="font-medium">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bookmark size={20} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-800">Bộ Sưu Tập</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Các bài viết bạn đã lưu lại</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCollectionId && (
              <button
                onClick={handleDeleteCollection}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} /> Xóa bộ sưu tập
              </button>
            )}
            <button
              onClick={() => setShowCreateForm((current) => !current)}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              {showCreateForm ? <X size={16} /> : <Plus size={16} />}
              {showCreateForm ? 'Đóng' : 'Tạo bộ sưu tập'}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
              <Grid3X3 size={16} className="text-blue-500" />
              <span className="text-sm font-bold text-blue-600">{posts.length}</span>
              <span className="text-sm text-blue-500">bài viết</span>
            </div>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateCollection} className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3">
          <input
            autoFocus
            maxLength={80}
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
            placeholder="Ví dụ: Tết, Noel, Kỷ niệm..."
            aria-label="Tên bộ sưu tập mới"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button type="submit" disabled={!newCollectionName.trim()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Tạo
          </button>
        </form>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-zinc-200 pb-2" role="tablist" aria-label="Bộ sưu tập đã lưu">
        <button
          role="tab"
          aria-selected={!selectedCollectionId}
          onClick={() => setSelectedCollectionId(null)}
          className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${!selectedCollectionId ? 'bg-blue-50 text-blue-700' : 'text-zinc-500 hover:bg-zinc-100'}`}
        >
          Tất cả
        </button>
        {collections.map((collection) => (
          <button
            key={collection.id}
            role="tab"
            aria-selected={selectedCollectionId === collection.id}
            onClick={() => setSelectedCollectionId(collection.id)}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${selectedCollectionId === collection.id ? 'bg-blue-50 text-blue-700' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            {collection.name}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <Bookmark size={36} className="text-zinc-300" />
          </div>
          <h3 className="text-lg font-bold text-zinc-600 mb-2">Bộ sưu tập trống</h3>
          <p className="text-sm text-zinc-400 mb-6 text-center max-w-sm">
            Bạn chưa lưu bài viết nào. Hãy khám phá cộng đồng và lưu lại những bài viết yêu thích!
          </p>
          <button
            onClick={() => navigate('/reviews')}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"
          >
            Khám phá ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {posts.map((post) => {
            const fullName = post.account?.customer?.fullName || post.account?.customer?.full_name || post.account?.full_name || post.account?.username || 'Ẩn danh';
            const avatarUrl = post.account?.customer?.image || post.account?.avatarUrl || post.account?.avatar_url;
            
            return (
              <div
                key={post.id}
                onClick={() => navigate(`/reviews/${post.id}`)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer bg-zinc-100 border border-zinc-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <img
                  src={post.cover_image_url || 'https://via.placeholder.com/400x500'}
                  alt={post.caption || 'Bài viết đã lưu'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Saved badge */}
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blue-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Bookmark size={14} className="text-white" fill="white" />
                </div>

                <div className="absolute left-2 right-2 top-2 z-10 flex items-center justify-between gap-2">
                  <select
                    value={post.collection_id || ''}
                    disabled={updatingPostId === post.id}
                    aria-label="Chọn bộ sưu tập cho bài viết"
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => handleAssignCollection(post, event.target.value)}
                    className="max-w-[75%] rounded-md border border-white/70 bg-white/95 px-2 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-sm outline-none"
                  >
                    <option value="">Chưa phân loại</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>{collection.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Bỏ lưu bài viết"
                    title="Bỏ lưu bài viết"
                    disabled={savingPostId === post.id}
                    onClick={(event) => { event.stopPropagation(); handleUnsave(post); }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/95 text-zinc-700 shadow-sm hover:text-red-600 disabled:opacity-50"
                  >
                    {savingPostId === post.id ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} fill="currentColor" />}
                  </button>
                </div>

                {/* Content overlay on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {post.session?.photo?.frame?.name && (
                    <div className="mb-2">
                      <span className="inline-block max-w-full truncate rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-zinc-700 shadow-sm">
                        {post.session.photo.frame.name}
                      </span>
                    </div>
                  )}

                  {/* User info */}
                  <div className="flex items-center gap-2 mb-2">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={fullName} className="w-6 h-6 rounded-full object-cover border border-white/30" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-[10px]">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-white text-[11px] font-medium truncate">{fullName}</span>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-white/90 text-[11px] line-clamp-2 mb-2 leading-relaxed">{post.caption}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-white/80 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Heart size={10} /> {post.likes_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={10} /> {post.comments_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={10} /> {post.views_count ?? 0}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
