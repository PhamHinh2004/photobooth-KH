import React, { useEffect, useState, useMemo } from 'react';
import { socialApi } from '../../api/social.api';
import { useSocialSocket } from '../../hooks/useSocialSocket';
import { CommentInput } from './CommentInput';
import { CommentThread } from './CommentThread';
import { buildCommentTree } from './commentTree';
import { useAuthStore } from '../../stores/auth.store';

export function DiscussionSection({ postId }: { postId: string }) {
  const token = useAuthStore((state) => state.token);
  const { comments: liveComments, setComments: setLiveComments, joinPost, leavePost } = useSocialSocket(token || undefined);
  const [initialComments, setInitialComments] = useState<any[]>([]);

  useEffect(() => {
    async function fetchComments() {
      try {
        const data = await socialApi.getComments(postId);
        const comments = Array.isArray(data) ? data : [];
        setInitialComments(comments);
        // Seed live comments state
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
  }, [postId]);

  const tree = useMemo(() => buildCommentTree(liveComments), [liveComments]);

  return (
    <section className="mt-8 border-t border-zinc-100 pt-8">
      <h3 className="font-bold text-xl mb-6 text-zinc-800">Thảo luận & Hỏi đáp ({liveComments.length})</h3>
      <CommentInput postId={postId} />
      
      <div className="space-y-6">
        {tree.map((c) => (
          <CommentThread key={c.id} comment={c} />
        ))}
      </div>
    </section>
  );
}
