interface AppNotification {
  id: number;
  text: string;
  type: string;
  badge: Badge;
  actingUser: User;
  project: Project;
  createdAt: Date;
  seen: boolean;
  present: boolean;
}
