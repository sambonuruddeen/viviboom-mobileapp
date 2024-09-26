import { EventQuestionDestinationType } from 'rn-viviboom/enums/EventQuestionDestinationType';

interface EventQuestionAnswerOption {
  id: number;
  answer: string;
  eventQuestionId: number;
}

interface EventQuestion {
  id: number;
  eventId: number;
  order: number;
  type: string;
  destination: EventQuestionDestinationType;
  question: string;
  answerOptions: EventQuestionAnswerOption[] | undefined;
}
interface MyEvent {
  id: number;
  branchId: number;
  institutionId: number;
  type: string;
  startAt: Date;
  duration: number;
  maxSlots: number;
  isFirstComeFirstServe: boolean;
  isOnline: boolean | undefined;
  title: string | undefined;
  description: string | undefined;
  crewEmails: string | undefined;
  imageUri: string | undefined;
  emailTemplates: EventEmailTemplate[] | undefined;
  eventQuestions: EventQuestion[] | undefined;
  bookingCount: number;
  isBookingReminderSent: boolean;
  publishedAt: Date | undefined;
  bookingEndAt: Date | undefined;
  updatedAt: Date;
  createdAt: Date;

  branch: Branch;
  bookings: UserEventBooking[] | undefined;
  facilitators: { id: number; userId: number; name: string; skills: string; profileImageUri: string }[];
}
