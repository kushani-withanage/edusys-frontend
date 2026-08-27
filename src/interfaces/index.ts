export interface Student {
  studentId: string;
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  address?: string;
  regNo?: string;
  enrollmentDate?: string;
  dob?: string;
  gender?: string;
  nic?: string;
  currentBatchId?: string;
}

export interface Teacher {
  teacherId: string;
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  specialization?: string;
  joinDate?: string;
}

export interface Batch {
  batchId: string;
  batchName: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  courses?: Course[];
  studentCount?: number;
}

export interface Course {
  courseId: string;
  courseName: string;
  credits?: number;
  durationWeeks?: number;
  description?: string;
  batchCode?: string;
  instructor?: string;
  status?: string;
}

export interface Enrollment {
  enrollmentId: string;
  studentId: string;
  batchId: string;
  courseId: string;
  enrollDate?: string;
}

export interface FeeRecord {
  feeId: string;
  studentId: string;
  amount: number;
  dueDate: string;
  feeType: string;
  status: string;
}

export interface Receipt {
  receiptId: string;
  receiptNo: string;
  feeId: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
}

export interface Inquiry {
  inquiryId: string;
  applicantName: string;
  contactInfo: string;
  status: string;
  inquiryDate: string;
  batchId?: string;
}

export interface CalendarEvent {
  calendarId: string;
  eventName: string;
  eventDate: string;
  description: string;
  status: string;
}

export interface CareerTask {
  taskId: string;
  title: string;
  pointValue: number;
  rubricCriteria: string;
  description?: string;
  dueDate?: string;
}

export interface PortfolioSubmission {
  submissionId: string;
  taskId: string;
  studentId: string;
  status: string;
  submittedFile?: string;
  submitDate?: string;
  studentName?: string;
  studentEmail?: string;
  taskTitle?: string;
  targetLevel?: string;
  pointValue?: number;
  feedback?: string;
}
