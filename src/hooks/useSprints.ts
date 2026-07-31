import { useState, useEffect, useCallback } from 'react';
import { Sprint, SprintStatus, Task } from '@/types';
import { sprintService } from '@/services/sprint.service';
import { workspaceService } from '@/services/workspace.service';

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
      const fetchedTasks = await workspaceService.getTasksBySpace(spaceId);

      const now = new Date();
      let updatedSprints = [...fetchedSprints];
      let updatedTasks = [...fetchedTasks];
      let hasChanges = false;

      // Sort sprints by start date / id
      updatedSprints.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

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
            hasChanges = true;
          } catch (err) {
            console.error(`Failed to auto-activate sprint ${sprint.id}`, err);
          }
        }

        // Auto CLOSED rule: ACTIVE/FUTURE -> CLOSED if endDate passed
        if (sprint.status !== 'CLOSED' && endDate && endDate <= now) {
          try {
            await sprintService.updateSprintStatus(sprint.id, 'CLOSED');
            sprint.status = 'CLOSED';
            hasChanges = true;

            // Find next available FUTURE/ACTIVE sprint or null (backlog)
            const nextSprint = updatedSprints.find((s, index) => index > i && s.status !== 'CLOSED');
            const targetSprintId = nextSprint ? nextSprint.id : null;

            // Move unfinished tasks (status !== 'DONE') from closed sprint to next sprint / backlog
            const unfinishedTasks = updatedTasks.filter(
              (t) => t.sprintId === sprint.id && t.status !== 'DONE'
            );

            for (const task of unfinishedTasks) {
              try {
                await workspaceService.createTask({
                  spaceId: task.spaceId,
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  ownerId: task.ownerId,
                  startDate: task.startDate,
                  dueDate: task.dueDate,
                });
                // In practice, we update the existing task's sprintId
                // Since updateTask endpoint is available:
                await workspaceService.createTask({
                  spaceId: task.spaceId,
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  ownerId: task.ownerId,
                  startDate: task.startDate,
                  dueDate: task.dueDate,
                });
              } catch (e) {
                console.error(`Failed moving task ${task.id} to next sprint`, e);
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

  // Delete Sprint
  const deleteSprint = async (sprintId: number) => {
    try {
      await sprintService.deleteSprint(sprintId);
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
    isTaskOverdue,
  };
}
