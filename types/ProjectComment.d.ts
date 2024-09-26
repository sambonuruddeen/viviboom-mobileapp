interface CommentLike {
  commentId: number;
  userId: number;
}

interface ProjectComment {
  id: number;
  userId: number;
  parentCommentId: number | undefined;
  projectId: number;
  text: string;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;

  parentComment: ProjectComment;
  childComments: ProjectComment[];
  likeCount: number;
  likes: CommentLike[] | undefined;
  user: User | undefined;
  project: Project | undefined;
}
