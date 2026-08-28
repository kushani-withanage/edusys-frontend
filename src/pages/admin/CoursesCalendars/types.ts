export interface Course {
  courseId: string;
  courseName: string;
  credits?: number;
  durationWeeks?: number;
  description?: string;
  batchCode?: string;
  instructor?: string;
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

export interface Student {
  studentId: string;
  fullName: string;
  email: string;
  regNo?: string;
  currentBatchId?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  batchId: string;
  enrollmentDate?: string;
}

export interface AccessGrant {
  id: string;
  courseId: string;
  courseName: string;
  batchCode: string; // holds batchId/batchName or 'TEACHER'/'REVIEWER'
  userIdentifier: string; // email
  grantedAt: string;
}

export interface CalendarEvent {
  calendarId: string;
  eventName: string;
  description?: string;
  eventDate: string;
  status: string;
}

export interface Inquiry {
  inquiryId: string;
  studentId: string;
  fullName: string;
  email: string;
  batchId?: string;
  batchName?: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface PermissionRow {
  courseId: string;
  courseName: string;
  batchId: string;
  batchName: string;
  accessType: 'Standard' | 'Custom';
  studentCount: number;
  grantedAt: string;
}

export interface BatchModulePermissionsTableProps {
  permissions: PermissionRow[];
  courses: Course[];
  onRevoke: (row: PermissionRow) => void;
}
