import { api } from '@/utils/api';

export interface InquiryData {
  inquiryId?: string;
  applicantName: string;
  contactInfo: string;
  status: string; // New, Contacted, Provisionally Enrolled
  inquiryDate: string;
}

export const inquiryService = {
  async getInquiries() {
    return api.get<any[]>('/api/v1/inquiries');
  },

  async createInquiry(inquiry: InquiryData) {
    return api.post<any>('/api/v1/inquiries', inquiry);
  },

  async deleteInquiry(inquiryId: string) {
    return api.delete<void>(`/api/v1/inquiries/${inquiryId}`);
  },

  async updateInquiry(inquiryId: string, inquiry: InquiryData) {
    return api.put<any>(`/api/v1/inquiries/${inquiryId}`, inquiry);
  }
};

export default inquiryService;
