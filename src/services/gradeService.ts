import { api } from '@/utils/api';

export interface GradeData {
  gradeId?: string;
  studentId: string;
  courseId: string;
  gradeValue: string; // e.g. "assignmentScore,examScore"
  publishedDate: string; // YYYY-MM-DD
}

export const gradeService = {
  async getGrades() {
    return api.get<any[]>('/api/v1/grades');
  },

  async createGrade(grade: GradeData) {
    return api.post<any>('/api/v1/grades', grade);
  },

  async updateGrade(gradeId: string, grade: GradeData) {
    return api.put<any>(`/api/v1/grades/${gradeId}`, grade);
  },

  async deleteGrade(gradeId: string) {
    return api.delete<void>(`/api/v1/grades/${gradeId}`);
  }
};

export default gradeService;
