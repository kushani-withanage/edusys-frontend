import type { CareerLevelData } from '@/services/pointsLevelService';
import type { CareerTaskData } from '@/services/careerTaskService';

export interface ReviewRecord {
  submissionId: string;
  studentId: string;
  studentName: string;
  taskTitle: string;
  levelName: string;
  submittedAt: string;
  status: string;
  mark?: number;
  feedback?: string;
  fileUrl?: string;
}

export type { CareerLevelData, CareerTaskData };
