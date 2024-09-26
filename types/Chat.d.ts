interface Chat {
  id: number;
  institutionId: number;
  branchId: number;
  userId: number;
  type: BuilderPalChatType;
  title: string | undefined;
  description: string | undefined;
  badgeId: number | undefined;

  createdAt: Date;
  updatedAt: Date;

  user: User;
  messages: MyMessage[];
  chatProjects?: ChatProject[];
  guidanceChatProject?: ChatProject;
  badge?: Badge;
}
