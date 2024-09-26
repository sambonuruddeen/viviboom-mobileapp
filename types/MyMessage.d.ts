interface MyMessage {
  id: number | string;
  chatId?: number;
  role: string;
  content: string;
  emote?: string | undefined;
  uri?: string | undefined;
  duration?: number;
  streamReader?: ReadableStreamDefaultReader<Uint8Array>;

  createdAt?: Date;
  updatedAt?: Date;
  chat?: Chat;
}
