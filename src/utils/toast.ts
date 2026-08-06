import { alertManager } from '@/components/common/GlobalAlertContainer';

export const toast = {
  success(message: string, title: string = 'Success') {
    alertManager.showAlert(message, 'success', title);
  },
  error(message: string, title: string = 'Error') {
    alertManager.showAlert(message, 'destructive', title);
  },
  warning(message: string, title: string = 'Warning') {
    alertManager.showAlert(message, 'warning', title);
  },
  info(message: string, title: string = 'Info') {
    alertManager.showAlert(message, 'info', title);
  }
};
