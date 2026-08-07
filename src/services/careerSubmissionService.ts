import { api } from '@/utils/api';

export interface CareerSubmissionData {
  id?: string;
  taskId: string;
  taskTitle?: string;
  taskPointsValue?: number;
  studentId?: string;
  studentName?: string;
  submissionType: string; // LINK, IMAGE, PDF, FILE
  submissionUrl?: string;
  filePath?: string;
  status: string; // PENDING, APPROVED, REJECTED, REVISION_REQUESTED
  pointsAwarded?: number;
  reviewerId?: string;
  reviewerComment?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface StudentCareerProgressData {
  studentId: string;
  studentName: string;
  currentLevelId: string;
  currentLevelNumber: number;
  currentLevelTitle: string;
  totalPointsAtLevel: number;
  levelPointsRequired: number;
}

export const careerSubmissionService = {
  async submitWork(taskId: string, submissionType: string, submissionUrl?: string, file?: File) {
    const formData = new FormData();
    formData.append('submissionType', submissionType);
    if (submissionUrl) {
      formData.append('submissionUrl', submissionUrl);
    }
    if (file) {
      formData.append('file', file);
    }

    // Call raw fetch/custom api with multipart headers
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/career/tasks/${taskId}/submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to submit work.');
    }
    return response.json() as Promise<CareerSubmissionData>;
  },

  async getMySubmissions() {
    return api.get<CareerSubmissionData[]>('/api/v1/career/submissions/mine');
  },

  async getStudentProgress() {
    return api.get<StudentCareerProgressData>('/api/v1/career/progress');
  },

  async getSubmissions(status?: string, levelId?: string) {
    let url = '/api/v1/career/submissions';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (levelId) params.append('levelId', levelId);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get<CareerSubmissionData[]>(url);
  },

  async reviewSubmission(submissionId: string, status: string, points: number, comment?: string) {
    return api.put<CareerSubmissionData>(`/api/v1/career/submissions/${submissionId}/review`, {
      status,
      points,
      comment
    });
  },

  async overrideStudentLevel(studentId: string, levelId: string, reason: string) {
    return api.post<void>(`/api/v1/career/progress/override?studentId=${studentId}&levelId=${levelId}&reason=${encodeURIComponent(reason)}`, {});
  }
};

export default careerSubmissionService;
