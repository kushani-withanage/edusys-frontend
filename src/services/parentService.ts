import { api } from '@/utils/api';

export interface ParentStudentLinkData {
  linkId?: string;
  parentId: string;
  studentId: string;
  relationshipType: string;
  linkedDate?: string;
}

export const parentService = {
  async getLinks() {
    return api.get<ParentStudentLinkData[]>('/api/v1/parent-student-links');
  },

  async createLink(link: ParentStudentLinkData) {
    return api.post<ParentStudentLinkData>('/api/v1/parent-student-links', link);
  },

  async getParentDetails(parentId: string) {
    return api.get<any>(`/api/v1/parents/${parentId}`);
  }
};

export default parentService;
