interface Badge {
  id: number;
  isChallenge: boolean;
  name: string;
  content: string | undefined;
  materialContent: string | undefined;
  tipContent: string | undefined;
  questionContent: string | undefined;
  description: string | undefined;
  imageUri: string | undefined;
  coverImageUri: string | undefined;
  createdByUserId: number | undefined;

  createdAt: Date;
  updatedAt: Date;

  createdByUser: User | undefined;
  categories: BadgeCategory[] | undefined;
  projects: Project[] | undefined;
  awardedUsers: User[] | undefined;
  challenges: Badge[] | undefined;
  challengeBadges: Badge[] | undefined;

  difficulty: string | undefined;
  timeToComplete: number | undefined;
}
