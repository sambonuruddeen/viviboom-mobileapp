interface ProjectSection {
  id: number;
  projectId: number;
  content: string;
  isCompleted: boolean;
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;

  project?: Project;
  images?: ProjectSectionImage[];
  videos?: ProjectSectionVideo[];
  files?: ProjectSectionFile[];
}
