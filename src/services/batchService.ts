import { api } from '@/utils/api';

export interface BatchData {
  batchId?: string;
  batchName: string;
  startDate: string;
  endDate: string;
}

export const batchService = {
  async getBatches() {
    return api.get<any[]>('/api/v1/batches');
  },

  async createBatch(batch: BatchData) {
    return api.post<any>('/api/v1/batches', batch);
  },

  async deleteBatch(batchId: string) {
    return api.delete<void>(`/api/v1/batches/${batchId}`);
  }
};

export default batchService;
