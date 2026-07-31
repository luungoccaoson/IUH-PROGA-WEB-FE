export type SprintStatus = 'FUTURE' | 'ACTIVE' | 'CLOSED';

export interface Sprint {
  id: number;
  spaceId: number;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}
