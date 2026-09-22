import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Student } from '../types/student';

async function fetchStudents() {
  const { data } = await apiClient.get('/students');
  return data as Student[];
}

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });
}

export async function fetchStudentById(id: string) {
  const { data } = await apiClient.get(`/students/${id}`);
  return data as Student;
}
