import { api } from '@/utils/api';

export interface BatchData {
  batchId?: string;
  batchName: string;
  startDate: string;
  endDate: string;
  status?: string;
  courses?: any[];
}

export const batchService = {
  async getBatches() {
    return api.get<any[]>('/api/v1/batches');
  },

  async createBatch(batch: BatchData) {
    return api.post<any>('/api/v1/batches', batch);
  },

  async updateBatch(batchId: string, batch: BatchData) {
    return api.put<any>(`/api/v1/batches/${batchId}`, batch);
  },

  async deleteBatch(batchId: string) {
    return api.delete<void>(`/api/v1/batches/${batchId}`);
  },

  async checkBatchCode(code: string, excludeId?: string) {
    const params = new URLSearchParams();
    params.append('code', code);
    if (excludeId) {
      params.append('excludeId', excludeId);
    }
    return api.get<boolean>(`/api/v1/batches/check-code?${params.toString()}`);
  },

  async getBatchCourses(batchId: string) {
    return api.get<any[]>(`/api/v1/batches/${batchId}/courses`);
  }
};

export default batchService;
