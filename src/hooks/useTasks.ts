import { useState, useCallback } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { taskService } from '@/services/task.service';

export function useTasks(spaceId: number, onTasksUpdated?: () => void) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
        if (onTasksUpdated) onTasksUpdated();
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

        const updated = await taskService.updateTask(taskId, {
          spaceId: existingTask.spaceId,
          sprintId: data.sprintId !== undefined ? data.sprintId : existingTask.sprintId,
          title: data.title || existingTask.title,
          description: data.description !== undefined ? data.description : existingTask.description,
          status: data.status || existingTask.status,
          priority: data.priority || existingTask.priority,
          ownerId: data.ownerId !== undefined ? data.ownerId : existingTask.ownerId,
          startDate: data.startDate !== undefined ? data.startDate : existingTask.startDate,
          dueDate: data.dueDate !== undefined ? data.dueDate : existingTask.dueDate,
        });

        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updated);
        }

        if (onTasksUpdated) onTasksUpdated();
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

  // Quick Update Status
  const updateTaskStatus = useCallback(
    async (taskId: number, status: TaskStatus) => {
      try {
        const updated = await taskService.updateTaskStatus(taskId, status);
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updated);
        }
        if (onTasksUpdated) onTasksUpdated();
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
        if (onTasksUpdated) onTasksUpdated();
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
