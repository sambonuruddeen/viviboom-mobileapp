interface UserEventBooking {
  id: number;
  userId: number;
  eventId: number;
  status: string;
  isLateCancellation: boolean;

  createdAt: Date;
  updatedAt: Date;

  user?: User;
  event?: MyEvent;
}
