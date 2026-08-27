import { api } from '@/utils/api';

export interface AssignmentSubmissionData {
  submissionId?: string;
  assignmentId: string;
  studentId: string;
  submittedFile?: string;
  submittedText?: string;
  submitDate?: string;
  feedback?: string;
  marks?: number;
  gradedBy?: string;
  gradeDate?: string;
}

export const submissionService = {
  async getSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmissionData | null> {
    try {
      const data = await api.get<AssignmentSubmissionData[]>(`/api/v1/assignment-submissions?assignmentId=${assignmentId}&studentId=${studentId}`);
      return data && data.length > 0 ? data[0] : null;
    } catch (e) {
      return null;
    }
  },

  async submitAssignment(submission: AssignmentSubmissionData): Promise<AssignmentSubmissionData> {
    return api.post<AssignmentSubmissionData>('/api/v1/assignment-submissions', submission);
  },

  async uploadFile(file: File): Promise<{ fileName: string; fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ fileName: string; fileUrl: string }>('/api/v1/assignments/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default submissionService;
