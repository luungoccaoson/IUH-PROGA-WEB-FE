import { useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { taskService } from '@/services/task.service';
import { taskWebSocketService } from '@/services/websocket.service';

const formatIsoDateTime = (dateStr?: string, isEndOfDay = false): string | undefined => {
  if (!dateStr) return undefined;
  if (dateStr.includes('T')) return dateStr;
  return isEndOfDay ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`;
};

export function useTasks(spaceId: number, onTasksUpdated?: (isSilent?: boolean) => void) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!spaceId) return;
    const unsubscribe = taskWebSocketService.connect(spaceId, () => {
      if (onTasksUpdated) onTasksUpdated(true);
    });
    return () => unsubscribe();
  }, [spaceId, onTasksUpdated]);

  // Inline Quick Create Task
  const createTask = useCallback(
    async (data: { title: string; sprintId?: number | null }) => {
      try {
        setLoading(true);
        const newTask = await taskService.createTask({
          spaceId,
          sprintId: data.sprintId || null,
          title: data.title.trim(),
          status: 'TODO',
          priority: 'MEDIUM',
        });
        if (onTasksUpdated) onTasksUpdated(true);
        return newTask;
      } catch (err) {
        console.error('Failed to create task:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [spaceId, onTasksUpdated]
  );

  // Update Task fields (Status, Priority, Assignee, Dates, Description)
  const updateTask = useCallback(
    async (
      taskId: number,
      data: {
        title?: string;
        sprintId?: number | null;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        ownerId?: number;
        startDate?: string;
        dueDate?: string;
      }
    ) => {
      try {
        setLoading(true);
        // First fetch target task or use selectedTask
        const existingTask = selectedTask && selectedTask.id === taskId
          ? selectedTask
          : await taskService.getTaskById(taskId);

        const formattedStartDate = formatIsoDateTime(
          data.startDate !== undefined ? data.startDate : existingTask.startDate,
          false
        );

        const formattedDueDate = formatIsoDateTime(
          data.dueDate !== undefined ? data.dueDate : existingTask.dueDate,
          true
        );

        const updated = await taskService.updateTask(taskId, {
          spaceId: existingTask.spaceId,
          sprintId: data.sprintId !== undefined ? data.sprintId : existingTask.sprintId,
          title: data.title || existingTask.title,
          description: data.description !== undefined ? data.description : existingTask.description,
          status: data.status || existingTask.status,
          priority: data.priority || existingTask.priority,
          ownerId: data.ownerId !== undefined ? data.ownerId : existingTask.ownerId,
          startDate: formattedStartDate,
          dueDate: formattedDueDate,
        });

        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updated);
        }

        if (onTasksUpdated) onTasksUpdated(true);
        return updated;
      } catch (err) {
        console.error('Failed to update task:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [spaceId, selectedTask, onTasksUpdated]
  );

  // Quick Update Status (Silent update without screen reload)
  const updateTaskStatus = useCallback(
    async (taskId: number, status: TaskStatus) => {
      try {
        const updated = await taskService.updateTaskStatus(taskId, status);
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updated);
        }
        if (onTasksUpdated) onTasksUpdated(true);
        return updated;
      } catch (err) {
        console.error('Failed to update task status:', err);
        throw err;
      }
    },
    [selectedTask, onTasksUpdated]
  );

  // Delete Task
  const deleteTask = useCallback(
    async (taskId: number) => {
      try {
        setLoading(true);
        await taskService.deleteTask(taskId);
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(null);
        }
        if (onTasksUpdated) onTasksUpdated(true);
      } catch (err) {
        console.error('Failed to delete task:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [selectedTask, onTasksUpdated]
  );

  return {
    selectedTask,
    setSelectedTask,
    loading,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}
