import { api } from '@/utils/api';

export interface CareerLevelData {
  levelId?: string;
  levelName: string;
  description: string;
  minPoints: number;
  maxPoints: number;
}

export const pointsLevelService = {
  async getLevels() {
    return api.get<any[]>('/api/v1/career-levels');
  },

  async createLevel(level: CareerLevelData) {
    return api.post<any>('/api/v1/career-levels', level);
  },

  async updateLevel(levelId: string, level: CareerLevelData) {
    return api.put<any>(`/api/v1/career-levels/${levelId}`, level);
  },

  async deleteLevel(levelId: string) {
    return api.delete<void>(`/api/v1/career-levels/${levelId}`);
  }
};

export default pointsLevelService;
