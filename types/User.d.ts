interface User {
  authToken: string;

  id: number;
  creatorUserId: number | undefined;
  institutionId: number;
  branchId: number;
  isBanned: boolean | undefined;
  username: string;
  guardianEmail: string | undefined;
  isEmailVerified: boolean | undefined;
  passHash: string | undefined;
  passSalt: string | undefined;
  passIterations: number | undefined;
  authAttempts: number | undefined;
  authAttemptAt: Date | undefined;
  name: string | undefined;
  givenName: string | undefined;
  familyName: string | undefined;
  gender: string | undefined;
  guardianPhone: string | undefined;
  dob: Date | undefined;
  description: string | undefined;
  adminNotes: string | undefined;
  lastActiveAt: Date | undefined;
  isCompletedTutorial: boolean | undefined;
  profileImageUri: string | undefined;
  coverImageUri: string | undefined;
  createdAt: Date | undefined;
  status: string;
  challengeCount: number;
  badgeCount: number;
  projectCount: number;
  wallet?: Wallet;

  role?: string;

  institution?: Institution;
  branch?: Branch;
  badges?: Badge[];
  projects?: Project[];
  staffRoles?: never[];
}
