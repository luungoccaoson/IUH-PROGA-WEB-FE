"use client";

import React from "react";
import { Space, Task, Sprint, User } from "@/types";
import { SpaceProgressMindmap, SpaceMember } from "./SpaceProgressMindmap";

interface SpaceMindmapAndSummaryContainerProps {
  space?: Space | null;
  tasks: Task[];
  sprints?: Sprint[];
  members?: SpaceMember[];
  currentUser?: User | null;
  onSelectTask?: (task: Task) => void;
}

export function SpaceMindmapAndSummaryContainer({
  space,
  tasks,
  sprints = [],
  members = [],
  currentUser,
  onSelectTask,
}: SpaceMindmapAndSummaryContainerProps) {
  // Single wrapper delegation - eliminate nested double frames
  return (
    <SpaceProgressMindmap
      space={space}
      tasks={tasks}
      sprints={sprints}
      members={members}
      currentUser={currentUser}
      onSelectTask={onSelectTask}
    />
  );
}
