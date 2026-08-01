import { api } from '@/utils/api';

export interface FeeRecordData {
  feeId?: string;
  studentId: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  feeType: string; // e.g. Admission, Tuition, Exam
  status: string; // e.g. UNPAID, PAID, OVERDUE
}

export interface ReceiptData {
  receiptId?: string;
  receiptNo?: string;
  feeId: string;
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  paymentMethod: string; // e.g. Cash, Card, Bank Transfer
}

export const feeService = {
  async getFeeRecords() {
    return api.get<any[]>('/api/v1/fee-records');
  },

  async createFeeRecord(record: FeeRecordData) {
    return api.post<any>('/api/v1/fee-records', record);
  },

  async updateFeeRecord(feeId: string, record: FeeRecordData) {
    return api.put<any>(`/api/v1/fee-records/${feeId}`, record);
  },

  async deleteFeeRecord(feeId: string) {
    return api.delete<void>(`/api/v1/fee-records/${feeId}`);
  },

  async getReceipts() {
    return api.get<any[]>('/api/v1/receipts');
  },

  async createReceipt(receipt: ReceiptData) {
    return api.post<any>('/api/v1/receipts', receipt);
  },

  async deleteReceipt(receiptId: string) {
    return api.delete<void>(`/api/v1/receipts/${receiptId}`);
  }
};

export default feeService;
