import { api } from '@/utils/api';

export interface CareerTaskData {
  id?: string;
  levelId: string;
  levelNumber?: number;
  levelTitle?: string;
  title: string;
  description: string;
  pointsValue: number;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  batchIds?: string[];
}

export const careerTaskService = {
  async getTasks() {
    return api.get<CareerTaskData[]>('/api/v1/career-tasks');
  },

  async getTasksByLevel(levelId: string) {
    return api.get<CareerTaskData[]>(`/api/v1/career-tasks?levelId=${levelId}`);
  },

  async getActiveTasksByLevel(levelId: string) {
    return api.get<CareerTaskData[]>(`/api/v1/career-tasks?levelId=${levelId}&isActive=true`);
  },

  async createTask(task: CareerTaskData) {
    return api.post<CareerTaskData>('/api/v1/career-tasks', task);
  },

  async updateTask(taskId: string, task: CareerTaskData) {
    return api.put<CareerTaskData>(`/api/v1/career-tasks/${taskId}`, task);
  },

  async deleteTask(taskId: string) {
    return api.delete<void>(`/api/v1/career-tasks/${taskId}`);
  }
};

export default careerTaskService;
