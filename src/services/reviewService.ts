import { api } from '@/utils/api';

export interface CareerSubmissionData {
  submissionId?: string;
  taskId: string;
  studentId: string;
  status: string; // PENDING, APPROVED, REJECTED
  submittedFile?: string; // Github URL or description
  submitDate?: string;
}

export const reviewService = {
  async getSubmissions() {
    return api.get<any[]>('/api/v1/career-submissions');
  },

  async createSubmission(submission: CareerSubmissionData) {
    return api.post<any>('/api/v1/career-submissions', submission);
  },

  async updateSubmissionStatus(submissionId: string, submission: CareerSubmissionData) {
    return api.put<any>(`/api/v1/career-submissions/${submissionId}`, submission);
  },

  async deleteSubmission(submissionId: string) {
    return api.delete<void>(`/api/v1/career-submissions/${submissionId}`);
  }
};

export default reviewService;
