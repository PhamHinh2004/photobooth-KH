import { useEffect, useMemo } from 'react';
import { socialApi } from '../../api/social.api';
import { useSocialSocket } from '../../hooks/useSocialSocket';
import { CommentInput } from './CommentInput';
import { CommentThread } from './CommentThread';
import { buildCommentTree } from './commentTree';
import { useAuthStore } from '../../stores/auth.store';

export function DiscussionSection({ postId, onCommentDeleted }: { postId: string; onCommentDeleted?: () => void }) {
  const token = useAuthStore((state) => state.token);
  const { comments: liveComments, setComments: setLiveComments, joinPost, leavePost } = useSocialSocket(token || undefined);

  useEffect(() => {
    async function fetchComments() {
      try {
        const data = await socialApi.getComments(postId);
        const comments = Array.isArray(data) ? data : [];
        setLiveComments(comments);
      } catch (err) {
        console.error(err);
      }
    }
    fetchComments();

    joinPost(postId);

    return () => {
      leavePost(postId);
    };
  }, [joinPost, leavePost, postId, setLiveComments]);

  const tree = useMemo(() => buildCommentTree(liveComments), [liveComments]);
  const handleCommentDeleted = (commentId: string) => {
    setLiveComments((current) => current.filter((comment) => comment.id !== commentId));
    onCommentDeleted?.();
  };

  return (
    <section className="mt-8 border-t border-zinc-100 pt-8">
      <h3 className="font-bold text-xl mb-6 text-zinc-800">Thảo luận & Hỏi đáp ({liveComments.length})</h3>
      <CommentInput postId={postId} />
      
      <div className="space-y-6">
        {tree.map((c) => (
          <CommentThread key={c.id} comment={c} onDelete={handleCommentDeleted} />
        ))}
      </div>
    </section>
  );
}
