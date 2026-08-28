export interface Option {
  id?: string;
  optionText: string;
  isCorrect: boolean;
}

export interface Question {
  questionId?: string;
  questionType: string; // e.g. MCQ, SHORT_ANSWER
  questionText: string; // prompt
  options?: string[]; // for MCQ
  marks: number;
  correctAnswers: string[]; // correct answers
  createdBy?: string;
  courseId?: string;
  difficulty?: string;
  status?: string;
}

export interface Audience {
  targetType: 'ALL' | 'BATCH' | 'MODULE';
  targetId: string;
}

export interface ExamData {
  examId?: string;
  title: string;
  startTime: string; // ISO DateTime
  durationMinutes: number;
  totalMarks?: number;
  questionIds: string[];
  createdBy?: string;
  courseId?: string;
  // Audiences config
  audiences?: Audience[];
  // Extra fields stored on frontend to support UI mock
  batchName?: string;
  venue?: string;
}

export interface QuestionFormProps {
  question?: any;
  onSave: (question: any) => void;
  onCancel: () => void;
}
