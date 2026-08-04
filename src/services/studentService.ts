import { api } from '@/utils/api';
import { inquiryService } from './inquiryService';

export const studentService = {
  async enrollAndActivateStudent(inquiryId: string, fullName: string, email: string, gender?: string) {
    // 1. Create user credential account
    const userPayload = {
      fullName: fullName,
      email: email,
      password: 'password123', // temporary default password
      phone: '+94770000000',
      role: 'STUDENT'
    };
    const authRes = await api.post<any>('/api/v1/auth/register', userPayload);
    const registeredUserId = authRes.userId;

    // 2. Create student profile linked to registered userId
    const studentPayload = {
      studentId: registeredUserId,
      fullName: fullName,
      email: email,
      phone: '+94770000000',
      status: 'ACTIVE',
      address: 'Colombo, Sri Lanka',
      regNo: 'pr26' + Math.floor(100 + Math.random() * 900) + Math.floor(1000 + Math.random() * 9000),
      enrollmentDate: new Date().toISOString().split('T')[0],
      dob: '2005-01-01',
      gender: gender || 'MALE'
    };
    await api.post<any>('/api/v1/students', studentPayload);

    // 3. Delete inquiry registry
    await inquiryService.deleteInquiry(inquiryId).catch(() => {});

    return studentPayload.regNo;
  },

  async getStudents() {
    return api.get<any[]>('/api/v1/students');
  },

  async deleteStudent(studentId: string) {
    return api.delete<void>(`/api/v1/students/${studentId}`);
  }
};

export default studentService;
