import { apiClient } from "@/lib/axios";
import { ApiResponse } from "@/types";
import { TaskNote, WorkspaceLog } from "@/types/discussion";

export const discussionService = {
  getNotesByTaskId: async (taskId: number): Promise<TaskNote[]> => {
    try {
      const response = await apiClient.get<ApiResponse<TaskNote[]>>(`/tasks/${taskId}/notes`);
      const notes = response.data?.data || [];
      if (typeof window !== "undefined" && notes.length > 0) {
        localStorage.setItem(`task_notes_${taskId}`, JSON.stringify(notes));
      }
      return notes;
    } catch (err) {
      console.warn("Failed to fetch task notes from API, falling back to local:", err);
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(`task_notes_${taskId}`);
        if (local) {
          try {
            return JSON.parse(local);
          } catch {}
        }
      }
      return [];
    }
  },

  createNote: async (
    taskId: number,
    data: { authorId: number; noteContent: string; taskTitle?: string }
  ): Promise<TaskNote> => {
    try {
      const response = await apiClient.post<ApiResponse<TaskNote>>(`/tasks/${taskId}/notes`, {
        authorId: data.authorId,
        noteContent: data.noteContent,
      });
      const note = response.data?.data;
      if (note && typeof window !== "undefined") {
        const local = localStorage.getItem(`task_notes_${taskId}`);
        const list: TaskNote[] = local ? JSON.parse(local) : [];
        if (!list.some((item) => item.id === note.id)) {
          list.push(note);
          localStorage.setItem(`task_notes_${taskId}`, JSON.stringify(list));
        }
      }
      return note;
    } catch (err) {
      console.warn("API createNote failed, falling back to local storage:", err);
      const fallbackNote: TaskNote = {
        id: Date.now(),
        taskId,
        taskTitle: data.taskTitle,
        authorId: data.authorId,
        noteContent: data.noteContent,
        createdAt: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(`task_notes_${taskId}`);
        const list: TaskNote[] = local ? JSON.parse(local) : [];
        list.push(fallbackNote);
        localStorage.setItem(`task_notes_${taskId}`, JSON.stringify(list));
      }
      return fallbackNote;
    }
  },

  deleteNote: async (noteId: number, taskId?: number, userId?: number): Promise<void> => {
    try {
      await apiClient.delete(`/tasks/notes/${noteId}?userId=${userId || 1}`);
    } catch (err) {
      console.warn("API deleteNote failed or offline, removing locally:", err);
    }
    if (typeof window !== "undefined" && taskId) {
      const local = localStorage.getItem(`task_notes_${taskId}`);
      if (local) {
        try {
          const list: TaskNote[] = JSON.parse(local);
          const filtered = list.filter((n) => n.id !== noteId);
          localStorage.setItem(`task_notes_${taskId}`, JSON.stringify(filtered));
        } catch {}
      }
    }
  },

  getNotesBySpaceId: async (spaceId: number): Promise<TaskNote[]> => {
    try {
      const response = await apiClient.get<ApiResponse<TaskNote[]>>(`/spaces/${spaceId}/notes`);
      return response.data?.data || [];
    } catch (err) {
      console.warn("Failed to fetch space notes from API:", err);
      return [];
    }
  },

  getLogsByTaskId: async (taskId: number): Promise<WorkspaceLog[]> => {
    try {
      const response = await apiClient.get<ApiResponse<WorkspaceLog[]>>(`/tasks/${taskId}/logs`);
      const logs = (response.data?.data || []).filter(
        (l) => l.actionType !== "COMMENT" &&
          !l.logMessage?.toLowerCase().includes("thảo luận") &&
          !l.logMessage?.toLowerCase().includes("ghi chú")
      );
      if (typeof window !== "undefined" && logs.length > 0) {
        localStorage.setItem(`task_logs_${taskId}`, JSON.stringify(logs));
      }
      return logs;
    } catch (err) {
      console.warn("Failed to fetch task logs, falling back to local:", err);
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(`task_logs_${taskId}`);
        if (local) {
          try {
            const parsed: WorkspaceLog[] = JSON.parse(local);
            return parsed.filter(
              (l) => l.actionType !== "COMMENT" &&
                !l.logMessage?.toLowerCase().includes("thảo luận") &&
                !l.logMessage?.toLowerCase().includes("ghi chú")
            );
          } catch {}
        }
      }
      return [];
    }
  },

  getLogsBySpaceId: async (spaceId: number): Promise<WorkspaceLog[]> => {
    try {
      const response = await apiClient.get<ApiResponse<WorkspaceLog[]>>(`/spaces/${spaceId}/logs`);
      const logs = (response.data?.data || []).filter(
        (l) => l.actionType !== "COMMENT" &&
          !l.logMessage?.toLowerCase().includes("thảo luận") &&
          !l.logMessage?.toLowerCase().includes("ghi chú")
      );
      return logs;
    } catch (err) {
      console.warn("Failed to fetch space logs:", err);
      return [];
    }
  },
};
