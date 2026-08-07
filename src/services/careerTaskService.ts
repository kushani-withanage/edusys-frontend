import { api } from '@/utils/api';

export interface CareerTaskData {
  id?: string;
  levelId: string;
  levelNumber?: number;
  levelTitle?: string;
  title: string;
  description: string;
  pointsValue: number;
  submissionType: string; // LINK, IMAGE, PDF, FILE
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface CareerLevelBatchAccessData {
  id: string;
  level: {
    id: string;
    levelNumber: number;
    title: string;
  };
  batch: {
    batchId: string;
    batchName: string;
  };
  isOpen: boolean;
  openedAt: string;
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
  },

  async getBatchAccess() {
    return api.get<CareerLevelBatchAccessData[]>('/api/v1/career-tasks/batch-access');
  },

  async toggleBatchAccess(levelId: string, batchId: string, openedBy?: string) {
    let url = `/api/v1/career-tasks/batch-access/toggle?levelId=${levelId}&batchId=${batchId}`;
    if (openedBy) url += `&openedBy=${openedBy}`;
    return api.post<CareerLevelBatchAccessData>(url, {});
  }
};

export default careerTaskService;
