const NotificationTypeEnum = {
  MESSAGE: 'MESSAGE',
  CHALLENGE_AWARD: 'CHALLENGE_AWARD',
  CHALLENGE_REMOVAL: 'CHALLENGE_REMOVAL',
  BADGE_AWARD: 'BADGE_AWARD',
  BADGE_REMOVAL: 'BADGE_REMOVAL',
  COMMENT_LIKE: 'COMMENT_LIKE',
  COMMENT_REPLY: 'COMMENT_REPLY',
  PROJECT_LIKE: 'PROJECT_LIKE',
  PROJECT_COMMENT: 'PROJECT_COMMENT',
  PROJECT_BADGE_APPROVAL: 'PROJECT_BADGE_APPROVAL',
  PROJECT_BADGE_REJECTION: 'PROJECT_BADGE_REJECTION',
  STARTER_CRITERIA: 'STARTER_CRITERIA',
  WALLET_ACTIVATION: 'WALLET_ACTIVATION',
  TRANSACTION_RECEIVE: 'TRANSACTION_RECEIVE',
};

export const displayNotificationTypeLabelById = (id) => {
  let label = 'Null';
  switch (id) {
    case NotificationTypeEnum.MESSAGE:
      label = 'Message';
      break;
    case NotificationTypeEnum.CHALLENGE_AWARD:
      label = 'ChallengeAward';
      break;
    case NotificationTypeEnum.CHALLENGE_REMOVAL:
      label = 'ChallengeRemoval';
      break;
    case NotificationTypeEnum.BADGE_AWARD:
      label = 'BadgeAward';
      break;
    case NotificationTypeEnum.BADGE_REMOVAL:
      label = 'BadgeRemoval';
      break;
    case NotificationTypeEnum.COMMENT_LIKE:
      label = 'CommentLike';
      break;
    case NotificationTypeEnum.COMMENT_REPLY:
      label = 'CommentReply';
      break;
    case NotificationTypeEnum.PROJECT_LIKE:
      label = 'ProjectLike';
      break;
    case NotificationTypeEnum.PROJECT_COMMENT:
      label = 'ProjectComment';
      break;
    case NotificationTypeEnum.PROJECT_BADGE_APPROVAL:
      label = 'ProjectBadgeApproval';
      break;
    case NotificationTypeEnum.PROJECT_BADGE_REJECTION:
      label = 'ProjectBadgeRejection';
      break;
    case NotificationTypeEnum.STARTER_CRITERIA:
      label = 'starterCriteriaCompletion';
      break;

    case NotificationTypeEnum.WALLET_ACTIVATION:
      label = 'WalletActivated';
      break;
    case NotificationTypeEnum.TRANSACTION_RECEIVE:
      label = 'TransactionCompleted';
      break;
    default:
      break;
  }
  return label;
};

export default NotificationTypeEnum;
