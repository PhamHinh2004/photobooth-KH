export interface CommentNode {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  account?: {
    username?: string;
    full_name?: string;
    avatarUrl?: string | null;
    avatar_url?: string | null;
    role?: string;
    customer?: { fullName?: string | null; full_name?: string | null; image?: string | null } | null;
  } | null;
  replies: CommentNode[];
}

export function buildCommentTree(flatComments: unknown): CommentNode[] {
  if (!Array.isArray(flatComments)) return [];

  const comments = flatComments as Omit<CommentNode, 'replies'>[];
  const nodes = new Map<string, CommentNode>(
    comments.map((comment) => [comment.id, { ...comment, replies: [] }]),
  );
  const roots: CommentNode[] = [];

  for (const comment of nodes.values()) {
    const parent = comment.parent_comment_id ? nodes.get(comment.parent_comment_id) : undefined;
    if (parent) parent.replies.push(comment);
    else roots.push(comment);
  }

  return roots;
}