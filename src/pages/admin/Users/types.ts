export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  status: string;
  createdAt: string;
  firstLogin?: string;
  lastLogin?: string;
}
