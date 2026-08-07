import { api } from '@/utils/api';

export interface CareerLevelData {
  id?: string;
  levelNumber: number;
  title: string;
  description: string;
  pointsRequired: number;
  isActive?: boolean;
}

export const pointsLevelService = {
  async getLevels() {
    return api.get<CareerLevelData[]>('/api/v1/career-levels');
  },

  async createLevel(level: CareerLevelData) {
    return api.post<CareerLevelData>('/api/v1/career-levels', level);
  },

  async updateLevel(levelId: string, level: CareerLevelData) {
    return api.put<CareerLevelData>(`/api/v1/career-levels/${levelId}`, level);
  },

  async deleteLevel(levelId: string) {
    return api.delete<void>(`/api/v1/career-levels/${levelId}`);
  }
};

export default pointsLevelService;
