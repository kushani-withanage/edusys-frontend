import { api } from '@/utils/api';

export interface CourseData {
  courseId?: string;
  courseName: string;
  credits: number;
  durationWeeks: number;
  description: string;
}

export const courseService = {
  async getCourses() {
    return api.get<any[]>('/api/v1/courses');
  },

  async createCourse(course: CourseData) {
    return api.post<any>('/api/v1/courses', course);
  },

  async deleteCourse(courseId: string) {
    return api.delete<void>(`/api/v1/courses/${courseId}`);
  }
};

export default courseService;
