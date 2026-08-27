import { api } from '@/utils/api';

export interface CareerStudentTaskStatusData {
  id?: string;
  taskId: string;
  taskTitle?: string;
  taskDescription?: string;
  pointsValue?: number;
  studentId: string;
  studentName?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  pointsAwarded?: number | null;
  markedBy?: string;
  markedByName?: string;
  markedAt?: string;
  comment?: string;
}

export interface StudentCareerProgressData {
  studentId: string;
  studentName: string;
  currentLevelId: string;
  currentLevelNumber: number;
  currentLevelTitle: string;
  totalPointsAtLevel: number;
  levelPointsRequired: number;
}

export interface LevelStat {
  levelId: string;
  levelNumber: number;
  title: string;
  studentCount: number;
}

export interface CareerStatsData {
  levelStats: LevelStat[];
  industryReadyCount: number;
}

export const careerMarkingService = {
  // Staff markings
  async getStudentsForTask(taskId: string) {
    return api.get<CareerStudentTaskStatusData[]>(`/api/v1/career/tasks/${taskId}/students`);
  },

  async markStudentTask(taskId: string, studentId: string, data: Partial<CareerStudentTaskStatusData>) {
    return api.put<CareerStudentTaskStatusData>(`/api/v1/career/tasks/${taskId}/students/${studentId}`, data);
  },

  async getStats() {
    return api.get<CareerStatsData>('/api/v1/career/stats');
  },

  // Student progress
  async getMyProgress() {
    return api.get<StudentCareerProgressData>('/api/v1/career/my-progress');
  },

  async getMyTasks() {
    return api.get<CareerStudentTaskStatusData[]>('/api/v1/career/my-tasks');
  }
};

export default careerMarkingService;
