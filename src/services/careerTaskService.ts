import { api } from '@/utils/api';

export interface CareerTaskData {
  taskId?: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  rubricCriteria: string; // e.g. "100% Code Weight"
  pointValue: number; // e.g. 50
  // Extra fields saved locally to match screenshot filters/badges
  batchName?: string; 
  targetLevel?: string;
}

export const careerTaskService = {
  async getTasks() {
    return api.get<any[]>('/api/v1/career-tasks');
  },

  async createTask(task: CareerTaskData) {
    return api.post<any>('/api/v1/career-tasks', task);
  },

  async updateTask(taskId: string, task: CareerTaskData) {
    return api.put<any>(`/api/v1/career-tasks/${taskId}`, task);
  },

  async deleteTask(taskId: string) {
    return api.delete<void>(`/api/v1/career-tasks/${taskId}`);
  }
};

export default careerTaskService;
