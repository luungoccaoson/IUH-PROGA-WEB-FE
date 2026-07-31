import { useState, useEffect, useCallback } from 'react';
import { Sprint, SprintStatus, Task } from '@/types';
import { sprintService } from '@/services/sprint.service';
import { taskService } from '@/services/task.service';

export function useSprints(spaceId: number) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Fetch Sprints & Tasks for Space
  const loadData = useCallback(async () => {
    if (!spaceId) return;
    try {
      setLoading(true);
      setError('');

      const fetchedSprints = await sprintService.getSprintsBySpace(spaceId);
      const fetchedTasks = await taskService.getTasksBySpace(spaceId);

      const now = new Date();
      let updatedSprints = [...fetchedSprints];
      let updatedTasks = [...fetchedTasks];

      // Sort sprints ascending by id / creation so Sprint 0, 1, 2... display top to bottom
      updatedSprints.sort((a, b) => a.id - b.id);

      // Check auto start & end rules
      for (let i = 0; i < updatedSprints.length; i++) {
        const sprint = updatedSprints[i];
        const startDate = sprint.startDate ? new Date(sprint.startDate) : null;
        const endDate = sprint.endDate ? new Date(sprint.endDate) : null;

        // Auto ACTIVE rule: FUTURE -> ACTIVE if startDate reached & endDate not passed
        if (sprint.status === 'FUTURE' && startDate && startDate <= now && (!endDate || endDate > now)) {
          try {
            await sprintService.updateSprintStatus(sprint.id, 'ACTIVE');
            sprint.status = 'ACTIVE';
          } catch (err) {
            console.error(`Failed to auto-activate sprint ${sprint.id}`, err);
          }
        }

        // Auto CLOSED rule: ACTIVE/FUTURE -> CLOSED if endDate passed
        if (sprint.status !== 'CLOSED' && endDate && endDate <= now) {
          try {
            await sprintService.updateSprintStatus(sprint.id, 'CLOSED');
            sprint.status = 'CLOSED';

            // Find active sprint or first future sprint in space
            const activeSprint = updatedSprints.find((s) => s.id !== sprint.id && s.status === 'ACTIVE') 
              || updatedSprints.find((s) => s.id !== sprint.id && s.status === 'FUTURE');

            if (activeSprint) {
              // Move unfinished overdue tasks to active sprint
              const overdueTasks = updatedTasks.filter(
                (t) => t.sprintId === sprint.id && t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
              );

              for (const task of overdueTasks) {
                try {
                  await taskService.updateTask(task.id, {
                    spaceId: task.spaceId,
                    sprintId: activeSprint.id,
                    title: task.title,
                  });
                  task.sprintId = activeSprint.id;
                } catch (e) {
                  console.error(`Failed to move overdue task ${task.id} to active sprint`, e);
                }
              }
            }
          } catch (err) {
            console.error(`Failed to auto-close sprint ${sprint.id}`, err);
          }
        }
      }

      setSprints(updatedSprints);
      setTasks(updatedTasks);
    } catch (err: any) {
      console.error('Error in useSprints:', err);
      setError('Không thể tải danh sách Sprints & Tasks');
    } finally {
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
      await loadData();
      return created;
    } catch (err: any) {
      console.error('Failed to create sprint:', err);
      throw err;
    }
  };

  // Update Sprint Dates / Goal / Name
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
      await loadData();
      return updated;
    } catch (err: any) {
      console.error('Failed to update sprint:', err);
      throw err;
    }
  };

  // Delete Sprint & shift remaining FUTURE sprint numbers if needed
  const deleteSprint = async (sprintId: number) => {
    try {
      const sprintToDelete = sprints.find((s) => s.id === sprintId);
      await sprintService.deleteSprint(sprintId);

      // Renumber subsequent FUTURE sprints if sprintToDelete had a number
      if (sprintToDelete) {
        const match = sprintToDelete.name.match(/\d+/);
        if (match) {
          const deletedNum = parseInt(match[0], 10);
          const remainingFuture = sprints.filter(
            (s) => s.id !== sprintId && s.status === 'FUTURE'
          );

          for (const futureSprint of remainingFuture) {
            const sMatch = futureSprint.name.match(/\d+/);
            if (sMatch) {
              const currentNum = parseInt(sMatch[0], 10);
              if (currentNum > deletedNum) {
                const newNum = currentNum - 1;
                const newName = futureSprint.name.replace(/\d+/, newNum.toString());
                try {
                  await sprintService.updateSprint(futureSprint.id, {
                    spaceId: futureSprint.spaceId,
                    name: newName,
                    goal: futureSprint.goal,
                    status: futureSprint.status,
                    startDate: futureSprint.startDate,
                    endDate: futureSprint.endDate,
                  });
                } catch (e) {
                  console.error(`Failed to renumber sprint ${futureSprint.id}`, e);
                }
              }
            }
          }
        }
      }

      await loadData();
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
