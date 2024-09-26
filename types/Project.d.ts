interface Like {
  projectId: number;
  userId: number;
}

interface Project {
  id: number;
  authorUserId: number;
  parentProjectId: number | undefined;
  branchId: number;
  name: string | undefined;
  description: string | undefined;
  thumbnailUri: string | undefined;
  content: string | undefined;
  badgeStatus: 'UNSUBMITTED' | 'SUBMITTED' | 'AWARDED' | 'REJECTED' | 'RESUBMITTED';
  adminNotes: string | undefined;
  adminReviewerUserId: number | undefined;
  isCompleted: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;

  authorUser: User;
  authorUsers: User[];
  branch: Branch | undefined;
  categories: ProjectCategory[] | undefined;
  badges: Badge[] | undefined;
  images: ProjectImage[] | undefined;
  videos: ProjectVideo[] | undefined;
  files: ProjectFile[] | undefined;
  sections: ProjectSection[] | undefined;
  comments: Comment[] | undefined;
  likers: User[] | undefined;
  likes: Like[] | undefined;
}
