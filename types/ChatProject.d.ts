interface ChatProjectCategory {
  id: number;
  chatProjectId: number;
  name: string;
}

interface ChatProjectResource {
  id: number;
  chatProjectId: number;
  name: string;
}

interface ChatProjectInstruction {
  id: number;
  chatProjectId: number;
  title: string;
  content: string;
}

interface ChatProject {
  id: number;
  chatId: number;
  guidanceChatId?: number;

  title: string;
  description: string;
  difficulty: BadgeDifficultyType;
  timeToComplete: number;
  isSaved: boolean;

  createdAt: Date;
  updatedAt: Date;

  categories?: ChatProjectCategory[];
  resources?: ChatProjectResource[];
  instructions?: ChatProjectInstruction[];
  chat?: Chat;
  guidanceChat?: Chat;
}
