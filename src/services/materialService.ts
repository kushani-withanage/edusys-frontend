import { api } from '@/utils/api';

export interface MaterialData {
  assignmentId?: string;
  title: string;       // file name e.g. "Git branching structures roadmap.pdf"
  description: string; // batch code e.g. "ICD110"
  dueDate: string;     // uploaded date e.g. "2026-07-10"
  createdBy: string;   // responsible instructor
}

export const materialService = {
  async getMaterials() {
    return api.get<any[]>('/api/v1/assignments');
  },

  async createMaterial(material: MaterialData) {
    return api.post<any>('/api/v1/assignments', material);
  },

  async updateMaterial(assignmentId: string, material: MaterialData) {
    return api.put<any>(`/api/v1/assignments/${assignmentId}`, material);
  },

  async deleteMaterial(assignmentId: string) {
    return api.delete<void>(`/api/v1/assignments/${assignmentId}`);
  }
};

export default materialService;
