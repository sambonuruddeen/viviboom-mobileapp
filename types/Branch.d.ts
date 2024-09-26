interface Branch {
  id: number;
  name: string;
  countryISO: string;
  tzIANA: string;
  starterBadgeRequirementCount: number;
  starterChallengeRequirementCount: number;
  starterAttendanceRequirementCount: number;
  allowVivicoinRewards: boolean;

  institution?: Institution;
}
