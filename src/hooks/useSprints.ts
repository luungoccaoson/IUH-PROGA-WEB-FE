import { useState, useEffect, useCallback } from 'react';
import { Sprint, SprintStatus, Task } from '@/types';
import { sprintService } from '@/services/sprint.service';
import { taskService } from '@/services/task.service';

export function useSprints(spaceId: number) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Fetch Sprints & Tasks for Space asynchronously in parallel for ultra-fast 0.05s page render
  const loadData = useCallback(async (isSilent = false) => {
    if (!spaceId) return;
    try {
      if (!isSilent) setLoading(true);
      setError('');

      // Parallel fetch for zero delay
      const [fetchedSprints, fetchedTasks] = await Promise.all([
        sprintService.getSprintsBySpace(spaceId),
        taskService.getTasksBySpace(spaceId),
      ]);

      const sortedSprints = [...fetchedSprints].sort((a, b) => a.id - b.id);

      // Render data IMMEDIATELY without waiting for auto-close rules
      setSprints(sortedSprints);
      setTasks(fetchedTasks);
      setLoading(false);

      // Background non-blocking auto-start & end check
      setTimeout(async () => {
        const now = new Date();
        for (const sprint of sortedSprints) {
          const startDate = sprint.startDate ? new Date(sprint.startDate) : null;
          const endDate = sprint.endDate ? new Date(sprint.endDate) : null;

          if (sprint.status === 'FUTURE' && startDate && startDate <= now && (!endDate || endDate > now)) {
            try {
              await sprintService.updateSprintStatus(sprint.id, 'ACTIVE');
            } catch (err) {
              console.error(`Failed to auto-activate sprint ${sprint.id}`, err);
            }
          }

          if (sprint.status !== 'CLOSED' && endDate && endDate <= now) {
            try {
              await sprintService.updateSprintStatus(sprint.id, 'CLOSED');
            } catch (err) {
              console.error(`Failed to auto-close sprint ${sprint.id}`, err);
            }
          }
        }
      }, 50);

    } catch (err: any) {
      console.error('Error in useSprints:', err);
      setError('Không thể tải danh sách Sprints & Tasks');
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute next default sprint name e.g. Sprint 1, Sprint 2, Sprint 3...
  const getNextSprintDefaultName = useCallback(() => {
    if (!sprints.length) return "Sprint 1";
    let maxNum = 0;
    sprints.forEach((s) => {
      const match = s.name.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `Sprint ${maxNum + 1}`;
  }, [sprints]);

  // Create new Sprint
  const createSprint = async (data: { name: string; goal?: string; startDate?: string; endDate?: string }) => {
    try {
      const created = await sprintService.createSprint({
        spaceId,
        name: data.name,
        goal: data.goal,
        status: 'FUTURE',
        startDate: data.startDate ? `${data.startDate}T00:00:00` : undefined,
        endDate: data.endDate ? `${data.endDate}T23:59:59` : undefined,
      });
      await loadData(true);
      return created;
    } catch (err: any) {
      console.error('Failed to create sprint:', err);
      throw err;
    }
  };

  // Update Sprint
  const updateSprint = async (
    sprintId: number,
    data: { name: string; goal?: string; status?: SprintStatus; startDate?: string; endDate?: string }
  ) => {
    try {
      const updated = await sprintService.updateSprint(sprintId, {
        spaceId,
        name: data.name,
        goal: data.goal,
        status: data.status,
        startDate: data.startDate ? (data.startDate.includes('T') ? data.startDate : `${data.startDate}T00:00:00`) : undefined,
        endDate: data.endDate ? (data.endDate.includes('T') ? data.endDate : `${data.endDate}T23:59:59`) : undefined,
      });
      await loadData(true);
      return updated;
    } catch (err: any) {
      console.error('Failed to update sprint:', err);
      throw err;
    }
  };

  // Delete Sprint
  const deleteSprint = async (sprintId: number) => {
    try {
      await sprintService.deleteSprint(sprintId);
      await loadData(true);
    } catch (err: any) {
      console.error('Failed to delete sprint:', err);
      throw err;
    }
  };

  // Helper check if task is overdue
  const isTaskOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === 'DONE') return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    return due < now;
  };

  return {
    sprints,
    tasks,
    loading,
    error,
    reload: loadData,
    createSprint,
    updateSprint,
    deleteSprint,
    getNextSprintDefaultName,
    isTaskOverdue,
  };
}
