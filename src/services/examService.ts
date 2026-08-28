import { api } from '@/utils/api';

export interface QuestionData {
  questionId?: string;
  questionType: string; // e.g. MCQ, SHORT_ANSWER
  questionText: string; // prompt
  options?: string[]; // for MCQ
  marks: number;
  correctAnswers: string[]; // correct answers
  createdBy?: string;
}

export interface ExamData {
  examId?: string;
  title: string;
  startTime: string; // ISO DateTime
  durationMinutes: number;
  totalMarks?: number;
  questionIds: string[];
  createdBy?: string;
  // Extra fields stored on frontend to support UI mock
  batchName?: string;
  venue?: string;
}

export const examService = {
  // --- Question Bank APIs ---
  async getQuestions(filters?: { courseId?: string; difficulty?: string; status?: string }) {
    let url = '/api/v1/questions';
    const params = [];
    if (filters?.courseId && filters.courseId !== 'ALL') params.push(`courseId=${filters.courseId}`);
    if (filters?.difficulty && filters.difficulty !== 'ALL') params.push(`difficulty=${filters.difficulty}`);
    if (filters?.status && filters.status !== 'ALL') params.push(`status=${filters.status}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return api.get<any[]>(url);
  },

  async createQuestion(question: any) {
    return api.post<any>('/api/v1/questions', question);
  },

  async updateQuestion(id: string, question: any) {
    return api.put<any>(`/api/v1/questions/${id}`, question);
  },

  async deleteQuestion(id: string) {
    return api.delete<void>(`/api/v1/questions/${id}`);
  },

  async importQuestions(courseId: string, createdBy: string, csvContent: string) {
    return api.post<any[]>(
      `/api/v1/questions/import?courseId=${courseId}&createdBy=${createdBy}`,
      csvContent,
      { 'Content-Type': 'text/plain' }
    );
  },

  // --- Exam APIs ---
  async getExams() {
    return api.get<any[]>('/api/v1/exams');
  },

  async getById(id: string) {
    return api.get<any>(`/api/v1/exams/${id}`);
  },

  async createExam(exam: ExamData) {
    return api.post<any>('/api/v1/exams', exam);
  },

  async updateExam(id: string, exam: ExamData) {
    return api.put<any>(`/api/v1/exams/${id}`, exam);
  },

  async deleteExam(id: string) {
    return api.delete<void>(`/api/v1/exams/${id}`);
  },

  async getExamQuestions(examId: string) {
    return api.get<any[]>(`/api/v1/exams/${examId}/questions`);
  },

  async submitExamAttempt(examId: string, submission: any) {
    return api.post<any>(`/api/v1/exams/${examId}/submit`, submission);
  },

  async getAvailableStudentExams() {
    return api.get<any[]>('/api/v1/student-exams/available');
  }
};

export default examService;
