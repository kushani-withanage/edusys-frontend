import { api } from '@/utils/api';

export const studentService = {
  async getStudents() {
    return api.get<any[]>('/api/v1/students');
  },

  async deleteStudent(studentId: string) {
    return api.delete<void>(`/api/v1/students/${studentId}`);
  }
};

export default studentService;
