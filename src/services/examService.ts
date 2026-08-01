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
  async getQuestions() {
    return api.get<any[]>('/api/v1/question-bank');
  },

  async createQuestion(question: QuestionData) {
    return api.post<any>('/api/v1/question-bank', question);
  },

  async updateQuestion(id: string, question: QuestionData) {
    return api.put<any>(`/api/v1/question-bank/${id}`, question);
  },

  async deleteQuestion(id: string) {
    return api.delete<void>(`/api/v1/question-bank/${id}`);
  },

  // --- Exam APIs ---
  async getExams() {
    return api.get<any[]>('/api/v1/exams');
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
  }
};

export default examService;
