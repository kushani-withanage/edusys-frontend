import { api } from '@/utils/api';

export interface AssignmentSubmissionData {
  submissionId?: string;
  assignmentId: string;
  studentId: string;
  submitDate?: string;
  submittedFile: string;
  marks?: number;
  gradedBy?: string;
  feedback?: string;
}

export const submissionService = {
  async getSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmissionData | null> {
    // Returns 204 No Content (null) if no submission found, or 200 with the submission DTO
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/assignment-submissions/assignment/${assignmentId}/student/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('edusys_token')}`
        }
      });
      if (response.status === 204) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching submission:', err);
      return null;
    }
  },

  async uploadFile(file: File): Promise<{ fileName: string; fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/assignment-submissions/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('edusys_token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Upload failed with status ${response.status}`);
    }

    return await response.json();
  },

  async submitAssignment(submission: AssignmentSubmissionData): Promise<AssignmentSubmissionData> {
    return api.post<AssignmentSubmissionData>('/api/v1/assignment-submissions', submission);
  }
};

export default submissionService;
