import { api } from './api';
import type { Note } from '@/types';

export interface CreateNoteInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export const notesApi = {
  getNotes: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<Note[]>(`/notes${params}`);
  },

  getNote: (id: string) =>
    api.get<Note>(`/notes/${id}`),

  createNote: (input: CreateNoteInput) =>
    api.post<Note>('/notes', input),

  updateNote: (id: string, input: UpdateNoteInput) =>
    api.patch<Note>(`/notes/${id}`, input),

  deleteNote: (id: string) =>
    api.delete(`/notes/${id}`),
};
