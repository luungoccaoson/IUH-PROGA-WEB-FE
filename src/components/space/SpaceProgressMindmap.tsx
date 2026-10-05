"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  GitBranch,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Navigation,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  HelpCircle,
  Scan,
  FolderKanban,
} from "lucide-react";
import { Space, Task, Sprint, User } from "@/types";

export interface SpaceMember {
  id?: number | { userId?: number };
  userId?: number;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  user?: {
    id?: number;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  };
  role?: string;
  [key: string]: unknown;
}

interface SpaceProgressMindmapProps {
  space?: Space | null;
  tasks: Task[];
  sprints?: Sprint[];
  members?: SpaceMember[];
  currentUser?: User | null;
  onSelectTask?: (task: Task) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

type LayoutMode = "timeline" | "tree";
type FilterMode = "all" | "my_tasks" | "in_progress" | "risks";

// Helper to extract concise sprint title (e.g. "Sprint 1" from "Sprint 1: theo dõi thị trường...")
export const getShortSprintName = (name?: string): string => {
  if (!name) return "";
  const trimmed = name.trim();

  // 1. If matches "Sprint X" at start (e.g. "Sprint 1: abc", "Sprint 2 - xyz")
  const sprintMatch = trimmed.match(/^(Sprint\s*\d+)/i);
  if (sprintMatch) {
    return sprintMatch[1];
  }

  // 2. If contains delimiter like ":" or "-" or "–" (e.g. "Đợt 1: Khảo sát", "Phase 1 - Planning")
  const delimiterIndex = trimmed.search(/[:\-\–\—|]/);
  if (delimiterIndex > 0) {
    const prefix = trimmed.substring(0, delimiterIndex).trim();
    if (prefix.length > 0 && prefix.length <= 15) {
      return prefix;
    }
  }

  return trimmed;
};

export function SpaceProgressMindmap({
  space,
  tasks,
  sprints = [],
  members = [],
  currentUser,
  onSelectTask,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen: externalOnToggleFullscreen,
}: SpaceProgressMindmapProps) {
  // Fullscreen state (internal fallback or external)
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalFullscreen;
  const toggleFullscreen = externalOnToggleFullscreen || (() => setInternalFullscreen((prev) => !prev));

  // Canvas Pan & Zoom State (Google Maps behavior)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 70 });
  const [scale, setScale] = useState<number>(0.9);
  const panRef = useRef(pan);
  panRef.current = pan;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [hasMoved, setHasMoved] = useState(false);

  // Layout & Filter states
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("timeline");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showLegend, setShowLegend] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);

  // Node Hover Tooltip States
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [hoveredSprintId, setHoveredSprintId] = useState<number | null>(null);
  const [hoveredSpace, setHoveredSpace] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
  const [highlightedSprintId, setHighlightedSprintId] = useState<number | null>(null);

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Robust Assignee Finder
  const getAssigneeInfo = useCallback(
    (task: Task) => {
      const targetId = task.ownerId || task.assignee?.id;
      const targetName =
        task.ownerName || task.assignee?.fullName || task.suggestedMemberName;

      if (targetId && members && members.length > 0) {
        const found = members.find((m: SpaceMember) => {
          const mId =
            typeof m.id === "object" && m.id !== null
              ? m.id.userId
              : m.userId || m.id;
          return String(mId) === String(targetId);
        });
        if (found) {
          return {
            name:
              found.fullName ||
              found.user?.fullName ||
              found.email ||
              `Thành viên #${targetId}`,
            email: found.email || found.user?.email || "",
            avatarUrl: found.avatarUrl || found.user?.avatarUrl,
          };
        }
      }
      return {
        name: targetName || "Chưa phân công",
        email: task.assignee?.email || "",
        avatarUrl: undefined,
      };
    },
    [members]
  );

  // User Task Identifier
  const isMyTask = useCallback(
    (t: Task) => {
      if (!currentUser) return false;
      const myId = String(currentUser.id || "");
      const myEmail = (currentUser.email || "").toLowerCase().trim();
      const myName = (
        currentUser.fullName ||
        currentUser.displayName ||
        currentUser.username ||
        ""
      )
        .toLowerCase()
        .trim();

      if (t.ownerId && myId && String(t.ownerId) === myId) return true;
      if (t.assignee?.id && myId && String(t.assignee.id) === myId) return true;
      if (
        t.assignee?.email &&
        myEmail &&
        t.assignee.email.toLowerCase().trim() === myEmail
      )
        return true;
      if (t.ownerName && myName && t.ownerName.toLowerCase().trim() === myName)
        return true;
      if (
        t.assignee?.fullName &&
        myName &&
        t.assignee.fullName.toLowerCase().trim() === myName
      )
        return true;
      if (
        t.suggestedMemberName &&
        myName &&
        t.suggestedMemberName.toLowerCase().trim() === myName
      )
        return true;

      // Space members check
      if (members && members.length > 0 && myId) {
        const myMember = members.find((m: SpaceMember) => {
          const mId = String(
            typeof m.id === "object" && m.id !== null
              ? m.id.userId
              : m.userId || m.id || ""
          );
          return mId === myId;
        });
        if (myMember) {
          const memberUserId = String(
            typeof myMember.id === "object" && myMember.id !== null
              ? myMember.id.userId
              : myMember.userId || myMember.id || ""
          );
          const memberEmail = (myMember.email || myMember.user?.email || "")
            .toLowerCase()
            .trim();
          if (t.ownerId && String(t.ownerId) === memberUserId) return true;
          if (
            t.assignee?.email &&
            memberEmail &&
            t.assignee.email.toLowerCase().trim() === memberEmail
          )
            return true;
        }
      }
      return false;
    },
    [currentUser, members]
  );

  // Active Sprint detection (object and id)
  const activeSprint = useMemo(() => {
    if (!sprints || sprints.length === 0) return null;

    // 1. By status ACTIVE (excluding sprint 0 if possible)
    const activeNonZero = sprints.find(
      (s) =>
        s.status?.toUpperCase() === "ACTIVE" &&
        !s.name?.toLowerCase().includes("sprint 0")
    );
    if (activeNonZero) return activeNonZero;

    const active = sprints.find((s) => s.status?.toUpperCase() === "ACTIVE");
    if (active) return active;

    // 2. By date: today is between startDate and endDate
    const todayStr = new Date().toISOString().split("T")[0];
    const currentByDate = sprints.find((s) => {
      if (!s.startDate) return false;
      const start = s.startDate.split("T")[0];
      const end = s.endDate ? s.endDate.split("T")[0] : "9999-12-31";
      return todayStr >= start && todayStr <= end;
    });
    if (currentByDate) return currentByDate;

    // 3. Fallback: first non-closed sprint
    const firstNonClosed = sprints.find(
      (s) => (s.status || "").toUpperCase() !== "CLOSED"
    );
    if (firstNonClosed) return firstNonClosed;

    // 4. Fallback: first sprint
    return sprints[0];
  }, [sprints]);

  const activeSprintId = activeSprint ? activeSprint.id : -1;

  // Expanded sprints state
  const [expandedSprints, setExpandedSprints] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    if (activeSprintId !== -1) {
      initial[`sprint-${activeSprintId}`] = true;
    }
    if (sprints.length > 0 && activeSprintId === -1) {
      initial[`sprint-${sprints[0].id}`] = true;
    }
    return initial;
  });

  // Ensure active sprint is auto-expanded when activeSprintId resolves
  useEffect(() => {
    if (activeSprintId !== -1) {
      setExpandedSprints((prev) => ({
        ...prev,
        [`sprint-${activeSprintId}`]: true,
      }));
    }
  }, [activeSprintId]);

  const toggleSprint = (sprintKey: string) => {
    setExpandedSprints((prev) => ({
      ...prev,
      [sprintKey]: !prev[sprintKey],
    }));
  };

  const expandAllSprints = () => {
    const all: Record<string, boolean> = { "sprint-backlog": true };
    sprints.forEach((s) => {
      all[`sprint-${s.id}`] = true;
    });
    setExpandedSprints(all);
  };

  const collapseAllSprints = () => {
    setExpandedSprints({});
  };

  // Group tasks by Sprint
  const sprintGroups = useMemo(() => {
    const list: {
      key: string;
      sprint: Sprint | null;
      title: string;
      shortTitle: string;
      isActive: boolean;
      isClosed: boolean;
      isDone: boolean;
      isClosedIncomplete: boolean;
      isFuture: boolean;
      percent: number;
      tasks: Task[];
    }[] = [];

    const validSprints = sprints.filter(
      (s) =>
        !s.name?.toLowerCase().includes("sprint 0") ||
        tasks.some((t) => t.sprintId === s.id)
    );

    const sortedSprints = [...validSprints].sort((a, b) => {
      const numA = parseInt(a.name?.match(/\d+/)?.[0] || "", 10);
      const numB = parseInt(b.name?.match(/\d+/)?.[0] || "", 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      if (a.startDate && b.startDate) {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      }
      return (a.id || 0) - (b.id || 0);
    });

    sortedSprints.forEach((sp) => {
      const spTasks = tasks.filter((t) => t.sprintId === sp.id);
      const doneCount = spTasks.filter((t) => t.status === "DONE").length;
      const pct =
        spTasks.length > 0 ? Math.round((doneCount / spTasks.length) * 100) : 0;

      const spStatus = (sp.status || "").toUpperCase();
      const isClosed = spStatus === "CLOSED";
      const isActive = !isClosed && sp.id === activeSprintId;
      const is100Done = pct === 100 && spTasks.length > 0;
      const isClosedIncomplete = isClosed && !is100Done;
      const isFuture = !isClosed && !isActive;

      const shortTitle = getShortSprintName(sp.name);

      list.push({
        key: `sprint-${sp.id}`,
        sprint: sp,
        title: sp.name,
        shortTitle: shortTitle || sp.name,
        isActive,
        isClosed,
        isDone: is100Done,
        isClosedIncomplete,
        isFuture,
        percent: pct,
        tasks: spTasks,
      });
    });

    // Backlog tasks
    const backlogTasks = tasks.filter(
      (t) => !t.sprintId || !sprints.some((sp) => sp.id === t.sprintId)
    );
    if (backlogTasks.length > 0) {
      const doneCount = backlogTasks.filter((t) => t.status === "DONE").length;
      const pct = Math.round((doneCount / backlogTasks.length) * 100);

      list.push({
        key: "sprint-backlog",
        sprint: null,
        title: "Product Backlog",
        shortTitle: "Backlog",
        isActive: false,
        isClosed: false,
        isDone: pct === 100,
        isClosedIncomplete: false,
        isFuture: true,
        percent: pct,
        tasks: backlogTasks,
      });
    }

    return list;
  }, [sprints, tasks, activeSprintId]);

  // Overall Space Progress
  const totalTasksCount = tasks.length || 1;
  const doneTasksCount = tasks.filter((t) => t.status === "DONE").length;
  const overallPercent = Math.round((doneTasksCount / totalTasksCount) * 100);

  // Status visual attributes
  const getTaskVisualProps = useCallback(
    (task: Task, isSprintActive: boolean) => {
      const isOverdue =
        task.status !== "DONE" && task.dueDate && task.dueDate < today;
      const isBlocked = !!task.riskWarning;
      const isMine = isMyTask(task);

      let badge = (
        <div
          className="w-3.5 h-3.5 rounded-full bg-[#94A3B8] border border-white shrink-0"
          title="Cần làm"
        />
      );
      let statusLabel = "Cần làm";
      let statusBadgeColor = "bg-gray-100 text-gray-700 border-gray-300";

      if (isOverdue || isBlocked) {
        badge = (
          <div
            className="w-4 h-4 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[9px] font-bold shadow-xs shrink-0"
            title="Trễ hạn/Nghẽn"
          >
            !
          </div>
        );
        statusLabel = isOverdue ? "Trễ hạn" : "Bị nghẽn";
        statusBadgeColor = "bg-red-100 text-red-700 border-red-300";
      } else if (task.status === "DONE") {
        badge = (
          <div
            className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px] font-bold shadow-xs shrink-0"
            title="Đã xong"
          >
            ✓
          </div>
        );
        statusLabel = "Đã xong";
        statusBadgeColor = "bg-emerald-100 text-emerald-700 border-emerald-300";
      } else if (task.status === "IN_PROGRESS") {
        badge = (
          <div
            className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0"
            title="Đang làm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        );
        statusLabel = "Đang làm";
        statusBadgeColor = "bg-blue-100 text-blue-700 border-blue-300";
      }

      let borderClass = "border border-gray-200 hover:border-gray-400";
      let bgClass = "bg-white hover:bg-slate-50";

      if (isMine) {
        if (isSprintActive || task.status === "IN_PROGRESS") {
          borderClass =
            "border-2 border-[#2563EB] ring-2 ring-[#93C5FD] shadow-md animate-pulse";
          bgClass = "bg-[#EFF6FF]";
        } else {
          borderClass = "border-2 border-[#3B82F6] ring-1 ring-[#BFDBFE]";
          bgClass = "bg-[#F8FAFC]";
        }
      }

      // Filter opacity
      let isDimmed = false;
      if (filterMode === "my_tasks" && !isMine) isDimmed = true;
      if (filterMode === "in_progress" && task.status !== "IN_PROGRESS")
        isDimmed = true;
      if (filterMode === "risks" && !isOverdue && !isBlocked) isDimmed = true;

      return {
        badge,
        borderClass,
        bgClass,
        statusLabel,
        statusBadgeColor,
        isMine,
        isDimmed,
      };
    },
    [isMyTask, today, filterMode]
  );

  // =========================================================================
  // GOOGLE MAPS PAN & ZOOM MECHANICS
  // =========================================================================

  // Wheel zoom centered towards mouse cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      setScale((prevScale) => {
        const nextScale = Math.min(Math.max(prevScale * zoomFactor, 0.25), 2.2);

        setPan((prevPan) => {
          const nextPanX =
            mouseX - (mouseX - prevPan.x) * (nextScale / prevScale);
          const nextPanY =
            mouseY - (mouseY - prevPan.y) * (nextScale / prevScale);
          return { x: nextPanX, y: nextPanY };
        });

        return nextScale;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Mouse Drag Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setHasMoved(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    if (!hasMoved) {
      const distance = Math.hypot(
        e.clientX - (dragStart.x + pan.x),
        e.clientY - (dragStart.y + pan.y)
      );
      if (distance > 5) setHasMoved(true);
    }

    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support
  const touchStartRef = useRef<{
    x: number;
    y: number;
    dist?: number;
  }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      setHasMoved(false);
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - pan.x,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - pan.y,
        dist,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const newX = e.touches[0].clientX - touchStartRef.current.x;
      const newY = e.touches[0].clientY - touchStartRef.current.y;
      setHasMoved(true);
      setPan({ x: newX, y: newY });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartRef.current.dist;
      touchStartRef.current.dist = currentDist;

      setScale((prev) => Math.min(Math.max(prev * factor, 0.25), 2.2));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const zoomIn = () => {
    const container = containerRef.current;
    if (!container) return;
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    setScale((prev) => {
      const next = Math.min(prev * 1.25, 2.2);
      setPan((p) => ({
        x: centerX - (centerX - p.x) * (next / prev),
        y: centerY - (centerY - p.y) * (next / prev),
      }));
      return next;
    });
  };

  const zoomOut = () => {
    const container = containerRef.current;
    if (!container) return;
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    setScale((prev) => {
      const next = Math.max(prev / 1.25, 0.25);
      setPan((p) => ({
        x: centerX - (centerX - p.x) * (next / prev),
        y: centerY - (centerY - p.y) * (next / prev),
      }));
      return next;
    });
  };

  const resetZoom = () => {
    setScale(1);
    setPan({ x: 80, y: 70 });
  };

  // Fit to screen
  const fitView = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const contentWidth = content.scrollWidth;
    const contentHeight = content.scrollHeight;

    const scaleX = (containerWidth - 120) / contentWidth;
    const scaleY = (containerHeight - 120) / contentHeight;
    const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.1);

    const targetPanX = Math.max(
      40,
      (containerWidth - contentWidth * targetScale) / 2
    );
    const targetPanY = Math.max(
      40,
      (containerHeight - contentHeight * targetScale) / 2
    );

    setScale(targetScale);
    setPan({ x: targetPanX, y: targetPanY });
  }, []);

  // Center on My Task (GPS)
  const centerOnMyTask = () => {
    const myActive =
      tasks.find((t) => isMyTask(t) && t.status === "IN_PROGRESS") ||
      tasks.find((t) => isMyTask(t) && t.status === "TODO") ||
      tasks.find((t) => isMyTask(t));

    if (!myActive) {
      alert("Bạn chưa có công việc nào được phân công trong Space này.");
      return;
    }

    if (myActive.sprintId) {
      setExpandedSprints((prev) => ({
        ...prev,
        [`sprint-${myActive.sprintId}`]: true,
      }));
    } else {
      setExpandedSprints((prev) => ({
        ...prev,
        "sprint-backlog": true,
      }));
    }

    setHighlightedTaskId(myActive.id);
    setTimeout(() => {
      const taskEl = document.getElementById(`mindmap-task-${myActive.id}`);
      const container = containerRef.current;
      if (taskEl && container) {
        const tRect = taskEl.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();

        const taskCurrentCenterX = tRect.left + tRect.width / 2;
        const taskCurrentCenterY = tRect.top + tRect.height / 2;

        const desiredCenterX = cRect.left + cRect.width / 2;
        const desiredCenterY = cRect.top + cRect.height / 2;

        const deltaX = desiredCenterX - taskCurrentCenterX;
        const deltaY = desiredCenterY - taskCurrentCenterY;

        setPan((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
      }
    }, 150);

    setTimeout(() => {
      setHighlightedTaskId(null);
    }, 4000);
  };

  // Center on Sprint (Radar / Header Badge / Quick Jump)
  const centerOnSprint = useCallback(
    (
      targetSprintId?: number | string,
      targetScale?: number,
      forceExpand: boolean = true,
      targetMode?: LayoutMode
    ) => {
      const isBacklog = targetSprintId === "backlog";
      const actualSprintId = isBacklog
        ? undefined
        : (targetSprintId ?? activeSprint?.id);
      const targetDomId = actualSprintId
        ? `mindmap-sprint-${actualSprintId}`
        : "mindmap-sprint-backlog";
      const sprintKey = actualSprintId
        ? `sprint-${actualSprintId}`
        : "sprint-backlog";

      if (forceExpand) {
        setExpandedSprints((prev) => ({
          ...prev,
          [sprintKey]: true,
        }));
      }

      if (actualSprintId && typeof actualSprintId === "number") {
        setHighlightedSprintId(actualSprintId);
      }

      const modeToUse = targetMode || layoutMode;
      const nextScale = targetScale !== undefined ? targetScale : (scaleRef.current || 1);

      if (targetScale !== undefined) {
        setScale(targetScale);
        scaleRef.current = targetScale;
      }

      const performCentering = () => {
        const sprintEl = document.getElementById(targetDomId);
        const container = containerRef.current;
        const content = contentRef.current;
        if (!sprintEl || !container || !content) return false;

        let unscaledLeft = 0;
        let unscaledTop = 0;
        let cur: HTMLElement | null = sprintEl;
        let foundContent = false;
        while (cur && cur !== content && cur !== document.body) {
          unscaledLeft += cur.offsetLeft;
          unscaledTop += cur.offsetTop;
          cur = cur.offsetParent as HTMLElement | null;
          if (cur === content) {
            foundContent = true;
            break;
          }
        }

        if (!foundContent) {
          const elRect = sprintEl.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          const visualScale =
            content.offsetWidth > 0 ? contentRect.width / content.offsetWidth : 1;
          unscaledLeft = (elRect.left - contentRect.left) / visualScale;
          unscaledTop = (elRect.top - contentRect.top) / visualScale;
        }

        const sprintCenterX = unscaledLeft + sprintEl.offsetWidth / 2;
        const sprintCenterY = unscaledTop + sprintEl.offsetHeight / 2;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        let desiredX = containerWidth / 2;
        let desiredY = containerHeight / 2;

        if (modeToUse === "timeline") {
          // Horizontal center in container, header placed comfortably with task cards hanging below
          desiredX = Math.round(containerWidth / 2);
          desiredY = Math.round(Math.min(220, Math.max(140, containerHeight * 0.28)));
        } else {
          // Left-center in container, leaving ample room on the right for task cards
          desiredX = Math.round(Math.min(420, Math.max(280, containerWidth * 0.35)));
          desiredY = Math.round(containerHeight / 2);
        }

        const targetPanX = Math.round(desiredX - sprintCenterX * nextScale);
        const targetPanY = Math.round(desiredY - sprintCenterY * nextScale);

        setPan({
          x: targetPanX,
          y: targetPanY,
        });
        panRef.current = { x: targetPanX, y: targetPanY };
        return true;
      };

      if (!performCentering()) {
        setTimeout(performCentering, 80);
      }
      setTimeout(performCentering, 160);

      if (actualSprintId && typeof actualSprintId === "number") {
        setTimeout(() => {
          setHighlightedSprintId(null);
        }, 3500);
      }
    },
    [activeSprint, layoutMode]
  );

  const centerOnActiveSprint = useCallback(
    (targetScale: number = 1, targetMode?: LayoutMode) => {
      centerOnSprint(activeSprint?.id, targetScale, true, targetMode);
    },
    [centerOnSprint, activeSprint]
  );

  // Auto-center on active sprint when first loading or space changes
  const hasInitialCenteredRef = useRef(false);
  const lastSpaceIdRef = useRef<number | string | undefined>(space?.id);

  useEffect(() => {
    if (space?.id !== lastSpaceIdRef.current) {
      lastSpaceIdRef.current = space?.id;
      hasInitialCenteredRef.current = false;
    }
  }, [space?.id]);

  useEffect(() => {
    if (hasInitialCenteredRef.current) return;
    if (sprints && sprints.length > 0) {
      const timer = setTimeout(() => {
        centerOnActiveSprint(0.88);
        hasInitialCenteredRef.current = true;
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [sprints, centerOnActiveSprint]);

  const handleLayoutModeChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    setTimeout(() => {
      centerOnActiveSprint(1, mode);
    }, 120);
  };

  const handleTaskNodeClick = (task: Task) => {
    if (hasMoved) return;
    if (onSelectTask) onSelectTask(task);
  };

  const handleSprintNodeClick = (
    key: string,
    isSprintActive?: boolean,
    sprintId?: number | string
  ) => {
    if (hasMoved) return;
    toggleSprint(key);
    if (isSprintActive) {
      centerOnSprint(sprintId ?? activeSprint?.id, 1, false);
    }
  };

  const containerClasses = isFullscreen
    ? "fixed inset-2 z-50 bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl p-4 flex flex-col h-[calc(100vh-16px)] overflow-hidden space-y-3"
    : "bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs flex flex-col overflow-hidden select-none";

  return (
    <div className={containerClasses}>
      {/* ========================================================================= */}
      {/* 1. SINGLE UNIFIED HEADER BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 px-5 py-3 border-b border-[#F1F5F9] bg-white shrink-0 z-20">
        {/* Left: Icon, Title, Progress & Active Sprint Badges */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#EEF2FF] text-[#1A73E8] flex items-center justify-center border border-[#BFDBFE] shrink-0 shadow-2xs">
            <GitBranch className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-base font-bold text-[#111827] whitespace-nowrap">
                Sơ đồ Mindmap Tiến độ Dự án
              </h3>
              <span className="text-[11px] font-mono font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                {overallPercent}% hoàn thành
              </span>
              {activeSprint && (
                <button
                  onClick={() => centerOnActiveSprint(1)}
                  title={`Bấm để chỉ thẳng vào ${activeSprint.name} (Thu phóng 100%)${activeSprint.goal ? ` • Mục tiêu: ${activeSprint.goal}` : ""}`}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 transition-all cursor-pointer group shadow-2xs shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                  <span className="text-blue-500 font-medium">Sprint:</span>
                  <span className="font-extrabold group-hover:underline truncate max-w-[170px]">
                    {getShortSprintName(activeSprint.name)}
                  </span>
                  {activeSprint.goal && (
                    <span
                      className="font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full text-[10px] truncate max-w-[200px]"
                      title={`Mục tiêu: ${activeSprint.goal}`}
                    >
                      🎯 {activeSprint.goal}
                    </span>
                  )}
                  <Navigation className="w-3 h-3 text-blue-600 shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Controls & Filters */}
        <div className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none shrink-0">
          {/* Layout Mode Toggle */}
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-0.5 flex items-center shadow-2xs shrink-0">
            <button
              onClick={() => handleLayoutModeChange("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${layoutMode === "timeline"
                  ? "bg-[#1A73E8] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              Lộ trình ngang
            </button>
            <button
              onClick={() => handleLayoutModeChange("tree")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${layoutMode === "tree"
                  ? "bg-[#1A73E8] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              Cây phân nhánh
            </button>
          </div>

          {/* Quick Filter */}
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              className="text-xs bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Tất cả hạng mục</option>
              <option value="my_tasks">Chỉ việc của tôi</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="risks">Cảnh báo rủi ro / Trễ hạn</option>
            </select>
          </div>

          {/* Expand / Collapse All Segmented Button */}
          <div className="hidden sm:flex items-center bg-[#F8FAFC] border border-gray-200 rounded-xl p-0.5 shadow-2xs shrink-0">
            <button
              onClick={expandAllSprints}
              title="Mở rộng tất cả các Sprint"
              className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-black hover:bg-white rounded-lg transition-all"
            >
              Mở tất cả
            </button>
            <span className="w-px h-3.5 bg-gray-200 mx-0.5" />
            <button
              onClick={collapseAllSprints}
              title="Thu gọn tất cả Sprint"
              className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-black hover:bg-white rounded-lg transition-all"
            >
              Thu gọn
            </button>
          </div>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs shrink-0 ${showLegend
                ? "bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-200"
                : "bg-[#F8FAFC] text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-black"
              }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
            <span>Chú thích</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
            className="p-1.5 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] transition-colors shadow-2xs shrink-0"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN MAP CANVAS (PAN & ZOOM CONTAINER) */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full overflow-hidden ${isFullscreen
          ? "flex-1 h-full min-h-[500px]"
          : "h-[620px] sm:h-[680px]"
          } bg-[#F8FAFC] cursor-grab active:cursor-grabbing`}
        style={{
          backgroundImage:
            "radial-gradient(circle, #CBD5E1 1.25px, transparent 1.25px)",
          backgroundSize: `${30 * scale}px ${30 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* SCALED & TRANSLATED MINDMAP CONTENT LAYER WITH HEADROOM FOR TOP POPOVERS */}
        <div
          ref={contentRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="absolute top-0 left-0 min-w-max pt-28 pb-20 px-16 pointer-events-auto"
        >
          {/* ===================================================================== */}
          {/* LAYOUT OPTION A: HORIZONTAL TIMELINE ROADMAP PIPELINE */}
          {/* ===================================================================== */}
          {layoutMode === "timeline" && (
            <div className="flex items-start gap-12 relative">
              {/* ROOT SPACE NODE (LEFTMOST COLUMN) */}
              <div className="flex flex-col items-center shrink-0 relative z-30">
                <div
                  onMouseEnter={() => setHoveredSpace(true)}
                  onMouseLeave={() => setHoveredSpace(false)}
                  className="w-72 p-4 rounded-2xl bg-gradient-to-br from-[#FEF08A] to-[#FDE047] border-2 border-black text-[#111827] shadow-xl transition-transform hover:scale-105 cursor-pointer relative"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-black/15 pb-2 mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-900 tracking-wider">
                      Không gian Dự án (Space)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-mono font-bold">
                      {overallPercent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#B45309] shrink-0" />
                    <h3 className="font-extrabold text-sm text-[#111827] leading-snug line-clamp-2">
                      {space?.name || "Đề tài Space"}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-[#451A03] font-medium">
                    <span>
                      {doneTasksCount}/{totalTasksCount} công việc
                    </span>
                    <span>{sprints.length} sprints</span>
                  </div>

                  {/* ROOT POPUP HOVER DETAILS: POSITIONED ABOVE NODE */}
                  {hoveredSpace && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-80 p-3.5 bg-white border-2 border-black rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.25)] text-xs space-y-2.5 pointer-events-none animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between border-b pb-1.5 font-bold">
                        <span>Chi tiết Tiến độ Tổng quan</span>
                        <span className="text-[#10B981] font-mono">
                          {overallPercent}% xong
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          {doneTasksCount} Đã xong
                        </div>
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
                          {
                            tasks.filter((t) => t.status === "IN_PROGRESS")
                              .length
                          }{" "}
                          Đang làm
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {tasks.filter((t) => t.status === "TODO").length} Cần
                          làm
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 pt-1 border-t space-y-0.5">
                        <p>Thời gian: {space?.startDate || "Chưa đặt"} ➔ {space?.endDate || "Hiện tại"}</p>
                        <p>Thành viên tham gia: {members.length || 1} người</p>
                      </div>

                      {/* Pointer arrow pointing down to Space node */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                    </div>
                  )}
                </div>

                {/* HORIZONTAL CONNECTOR TO SPRINT 1 */}
                <div className="absolute top-10 -right-12 w-12 h-1 bg-gradient-to-r from-amber-400 to-[#3B82F6]" />
              </div>

              {/* HORIZONTAL SPRINTS SEQUENCE (LEFT TO RIGHT PIPELINE) */}
              <div className="flex items-start gap-12 relative">
                {sprintGroups.map((group, index) => {
                  const isExpanded = !!expandedSprints[group.key];
                  const hasTasks = group.tasks.length > 0;
                  const isLast = index === sprintGroups.length - 1;

                  return (
                    <div
                      key={group.key}
                      className="flex flex-col items-center shrink-0 relative min-w-[320px] max-w-[360px]"
                    >
                      {/* SPRINT HEADER NODE */}
                      <div
                        id={group.sprint?.id ? `mindmap-sprint-${group.sprint.id}` : "mindmap-sprint-backlog"}
                        onClick={() =>
                          handleSprintNodeClick(
                            group.key,
                            group.isActive || group.sprint?.id === activeSprint?.id,
                            group.sprint?.id
                          )
                        }
                        onMouseEnter={() =>
                          setHoveredSprintId(group.sprint?.id || 9999)
                        }
                        onMouseLeave={() => setHoveredSprintId(null)}
                        className={`w-full p-3.5 rounded-2xl border-2 shadow-sm cursor-pointer transition-all hover:scale-102 flex items-center justify-between gap-3 relative ${group.isDone
                          ? "bg-[#DCFCE7] border-emerald-600 text-emerald-900"
                          : group.isClosedIncomplete
                            ? "bg-[#FEF3C7] border-amber-500 text-amber-900"
                            : group.isActive
                              ? "bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] ring-2 ring-blue-400 ring-offset-2 shadow-md"
                              : "bg-white border-slate-300 text-slate-700"
                          } ${highlightedSprintId === group.sprint?.id ? "ring-4 ring-blue-600 ring-offset-2 scale-105 shadow-2xl transition-all duration-300" : ""}`}
                      >
                        {highlightedSprintId === group.sprint?.id && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-30 animate-bounce whitespace-nowrap">
                            <Navigation className="w-2.5 h-2.5 fill-white" />
                            <span>Sprint đang diễn ra</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                          {group.isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : group.isClosedIncomplete ? (
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          ) : group.isActive ? (
                            <div className="w-3 h-3 rounded-full bg-blue-600 animate-ping shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="font-extrabold text-sm truncate" title={group.title}>
                                {group.shortTitle}
                              </h4>
                              {group.sprint?.goal && (
                                <span
                                  className="text-[10px] font-medium text-blue-700 bg-blue-100/70 border border-blue-200/80 px-1.5 py-0.5 rounded-md truncate max-w-[160px] shrink-0"
                                  title={`Mục tiêu: ${group.sprint.goal}`}
                                >
                                  🎯 {group.sprint.goal}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] opacity-75">
                              {group.isDone || group.percent === 100
                                ? `${group.tasks.length} hạng mục hoàn thành`
                                : `${group.tasks.length} hạng mục • ${group.percent}% xong`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!group.isDone && group.percent < 100 && (
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${group.isActive
                                ? "bg-blue-600 text-white"
                                : "bg-black/10 text-current"
                                }`}
                            >
                              {group.percent}%
                            </span>
                          )}
                          {hasTasks && (
                            <div className="p-1 rounded-md hover:bg-black/10 transition-colors">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-current" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-current" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* SPRINT HOVER POPUP: POSITIONED ABOVE COMPONENT SPRINT */}
                        {hoveredSprintId === (group.sprint?.id || 9999) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-72 sm:w-80 p-3.5 bg-white border-2 border-black rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.2)] text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95">
                            <div className="flex items-start justify-between font-bold border-b pb-1 gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                                  {group.shortTitle}
                                </span>
                                <h4 className="font-extrabold text-sm text-gray-900 leading-snug break-words">
                                  {group.title}
                                </h4>
                              </div>
                              <span className="font-mono text-blue-600 shrink-0 font-bold">
                                {group.percent}%
                              </span>
                            </div>
                            {group.sprint?.goal && (
                              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-[11px] leading-snug">
                                <span className="font-bold text-blue-700">🎯 Mục tiêu: </span>
                                <span>{group.sprint.goal}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-gray-600 space-y-1">
                              <p>
                                Tiến độ:{" "}
                                <strong className="text-black">
                                  {
                                    group.tasks.filter((t) => t.status === "DONE")
                                      .length
                                  }
                                  /{group.tasks.length}
                                </strong>{" "}
                                đã xong
                              </p>
                              {group.sprint?.startDate && (
                                <p className="text-[10px] font-mono text-gray-500">
                                  {group.sprint.startDate.substring(0, 10)} ➔{" "}
                                  {group.sprint.endDate?.substring(0, 10) ||
                                    "Hiện tại"}
                                </p>
                              )}
                            </div>
                            <p className="text-[10px] text-blue-600 italic text-center pt-0.5 font-medium">
                              💡 Bấm để {isExpanded ? "thu gọn" : "mở rộng"} danh
                              sách công việc
                            </p>

                            {/* Pointer arrow pointing down to sprint node */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                          </div>
                        )}
                      </div>

                      {/* HORIZONTAL CONNECTOR TO NEXT SPRINT */}
                      {!isLast && (
                        <div className="absolute top-7 -right-12 w-12 h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]" />
                      )}

                      {/* VERTICAL BRANCH CONNECTOR & TASKS COLUMN */}
                      {isExpanded && hasTasks && (
                        <div className="w-full flex flex-col items-center mt-3 relative">
                          {/* Vertical connector line from Sprint Header */}
                          <div className="w-0.5 h-6 bg-[#3B82F6]" />

                          {/* Task Cards Column */}
                          <div className="w-full space-y-3 relative pl-4 border-l-2 border-dashed border-[#93C5FD]">
                            {group.tasks.map((task) => {
                              const visual = getTaskVisualProps(
                                task,
                                group.isActive
                              );
                              const assignee = getAssigneeInfo(task);
                              const isHovered = hoveredTaskId === task.id;
                              const isHighlighted =
                                highlightedTaskId === task.id;

                              return (
                                <div
                                  id={`mindmap-task-${task.id}`}
                                  key={task.id}
                                  onClick={() => handleTaskNodeClick(task)}
                                  onMouseEnter={() =>
                                    setHoveredTaskId(task.id)
                                  }
                                  onMouseLeave={() => setHoveredTaskId(null)}
                                  className={`relative w-full p-3.5 rounded-2xl transition-all duration-200 cursor-pointer text-xs shadow-xs ${visual.bgClass
                                    } ${visual.borderClass} ${visual.isDimmed
                                      ? "opacity-30 grayscale"
                                      : "hover:scale-102 hover:shadow-md"
                                    } ${isHighlighted
                                      ? "ring-4 ring-blue-500 scale-105 shadow-xl"
                                      : ""
                                    }`}
                                >
                                  {/* Horizontal connector stub to spine */}
                                  <div className="absolute top-1/2 -left-4 w-4 h-0.5 bg-[#93C5FD]" />

                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                                        <span className="font-mono font-bold text-gray-500">
                                          #{task.id}
                                        </span>
                                        {visual.isMine && (
                                          <span className="bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded text-[9px]">
                                            CỦA BẠN
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="font-bold text-[#111827] text-xs line-clamp-2 leading-tight">
                                        {task.title}
                                      </h5>
                                    </div>
                                    <div className="shrink-0">
                                      {visual.badge}
                                    </div>
                                  </div>

                                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {assignee.name
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </div>
                                      <span className="truncate max-w-[130px] font-medium text-gray-700">
                                        {assignee.name}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${visual.statusBadgeColor}`}
                                    >
                                      {visual.statusLabel}
                                    </span>
                                  </div>

                                  {/* TASK HOVER POPUP: POSITIONED ABOVE TASK CARD */}
                                  {isHovered && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-80 p-3.5 bg-white border-2 border-black rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.2)] text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95">
                                      <div className="flex items-center justify-between border-b pb-1 font-bold">
                                        <span className="font-mono text-[10px] bg-yellow-200 px-2 py-0.5 rounded border border-black/20">
                                          Mã #{task.id}
                                        </span>
                                        <span
                                          className={`text-[9px] px-2 py-0.5 rounded-full border ${visual.statusBadgeColor}`}
                                        >
                                          {visual.statusLabel}
                                        </span>
                                      </div>
                                      <p className="font-extrabold text-sm text-gray-900 leading-snug">
                                        {task.title}
                                      </p>
                                      <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 space-y-1 text-[11px]">
                                        <p>
                                          <span className="text-gray-500">
                                            Phụ trách:
                                          </span>{" "}
                                          <strong className="text-gray-900">
                                            {assignee.name}
                                          </strong>
                                        </p>
                                        <p>
                                          <span className="text-gray-500">
                                            Độ ưu tiên:
                                          </span>{" "}
                                          <strong className="text-gray-900">
                                            {task.priority || "NORMAL"}
                                          </strong>
                                        </p>
                                        <p>
                                          <span className="text-gray-500">
                                            Hạn chót:
                                          </span>{" "}
                                          <strong className="text-gray-900 font-mono">
                                            {task.dueDate || "Chưa đặt"}
                                          </strong>
                                        </p>
                                      </div>
                                      {task.riskWarning && (
                                        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[10px] flex items-center gap-1.5 font-bold">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                          {task.riskWarning}
                                        </div>
                                      )}
                                      <p className="text-[10px] text-blue-600 font-semibold text-center italic">
                                        Nhấp chuột để mở chi tiết công việc
                                      </p>

                                      {/* Pointer arrow pointing down to task card */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* LAYOUT OPTION B: CLASSIC HORIZONTAL TREE MINDMAP (XMIND/MIRO STYLE) */}
          {/* ===================================================================== */}
          {layoutMode === "tree" && (
            <div className="flex items-start gap-20 relative">
              {/* ROOT SPACE NODE (LEFTMOST COLUMN) */}
              <div className="flex flex-col items-center justify-center shrink-0 self-center">
                <div
                  onMouseEnter={() => setHoveredSpace(true)}
                  onMouseLeave={() => setHoveredSpace(false)}
                  className="w-72 p-5 rounded-2xl bg-gradient-to-br from-[#FEF08A] to-[#FDE047] border-2 border-black text-[#111827] shadow-xl hover:scale-105 transition-transform cursor-pointer relative"
                >
                  <div className="flex items-center justify-between border-b border-black/15 pb-2 mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-900 tracking-wider">
                      Đề tài Space
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[11px] font-mono font-bold">
                      {overallPercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-800 shrink-0" />
                    <h3 className="font-extrabold text-sm text-[#111827]">
                      {space?.name || "Đề tài Space"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-amber-950 mt-2 font-medium">
                    {doneTasksCount}/{totalTasksCount} công việc hoàn thành
                  </p>

                  {/* ROOT POPUP HOVER DETAILS: POSITIONED ABOVE NODE */}
                  {hoveredSpace && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-80 p-3.5 bg-white border-2 border-black rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.25)] text-xs space-y-2.5 pointer-events-none animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between border-b pb-1.5 font-bold">
                        <span>Chi tiết Tiến độ Tổng quan</span>
                        <span className="text-[#10B981] font-mono">
                          {overallPercent}% xong
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          {doneTasksCount} Đã xong
                        </div>
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
                          {
                            tasks.filter((t) => t.status === "IN_PROGRESS")
                              .length
                          }{" "}
                          Đang làm
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {tasks.filter((t) => t.status === "TODO").length} Cần
                          làm
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 pt-1 border-t space-y-0.5">
                        <p>Thời gian: {space?.startDate || "Chưa đặt"} ➔ {space?.endDate || "Hiện tại"}</p>
                        <p>Thành viên tham gia: {members.length || 1} người</p>
                      </div>

                      {/* Pointer arrow pointing down to Space node */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                    </div>
                  )}
                </div>

                {/* HORIZONTAL CONNECTOR TRUNK FROM SPACE TO SPRINTS ENCLOSURE */}
                <div className="absolute top-1/2 -right-16 w-16 h-1.5 bg-gradient-to-r from-amber-400 via-blue-400 to-[#2563EB] rounded-full shadow-xs" />
              </div>

              {/* SPACE SPRINTS CONTAINER FRAME ("THÀNH" CHỨA CÁC SPRINT) */}
              <div className="relative border-2 border-blue-200/90 bg-gradient-to-br from-blue-50/25 via-slate-50/20 to-white/50 rounded-3xl p-6 pt-12 shadow-xs">
                {/* "THÀNH" HEADER BADGE: THỂ HIỆN SPACE CHỨA CÁC SPRINT */}
                {/* <div className="absolute -top-4 left-6 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2 z-20 border border-blue-400">
                  <FolderKanban className="w-4 h-4 text-blue-200" />
                  <span>Không gian: {space?.name || "Đề tài Space"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <span className="font-mono text-[11px] text-blue-100 font-semibold">
                    Chứa {sprintGroups.length} Sprints ({doneTasksCount}/{totalTasksCount} việc hoàn thành)
                  </span>
                </div> */}

                {/* VERTICAL TREE SPINE RAIL / TRUNK */}
                <div className="absolute left-3 top-14 bottom-14 w-1 bg-gradient-to-b from-blue-500 via-blue-300 to-slate-300 rounded-full pointer-events-none opacity-80" />

                {/* LEVEL 1: SPRINTS VERTICAL STACK WITH SVG BEZIER BRANCHES TO LEVEL 2 TASKS */}
                <div className="flex flex-col space-y-10 relative pl-4">
                  {sprintGroups.map((group) => {
                    const isExpanded = !!expandedSprints[group.key];
                    const hasTasks = group.tasks.length > 0;

                    return (
                      <div
                        key={group.key}
                        className="flex items-start gap-12 relative"
                      >
                        {/* Sprint Node */}
                        <div
                          id={group.sprint?.id ? `mindmap-sprint-${group.sprint.id}` : "mindmap-sprint-backlog"}
                          onClick={() =>
                            handleSprintNodeClick(
                              group.key,
                              group.isActive || group.sprint?.id === activeSprint?.id,
                              group.sprint?.id
                            )
                          }
                          onMouseEnter={() =>
                            setHoveredSprintId(group.sprint?.id || 9999)
                          }
                          onMouseLeave={() => setHoveredSprintId(null)}
                          className={`w-72 sm:w-80 p-3.5 rounded-2xl border-2 shadow-xs cursor-pointer transition-all hover:scale-102 flex items-center justify-between gap-3 shrink-0 relative ${group.isDone
                            ? "bg-[#DCFCE7] border-emerald-600 text-emerald-900"
                            : group.isClosedIncomplete
                              ? "bg-[#FEF3C7] border-amber-500 text-amber-900"
                              : group.isActive
                                ? "bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8] ring-2 ring-blue-400 ring-offset-2 shadow-md"
                                : "bg-white border-slate-300 text-slate-700"
                            } ${highlightedSprintId === group.sprint?.id ? "ring-4 ring-blue-600 ring-offset-2 scale-105 shadow-2xl transition-all duration-300" : ""}`}
                        >
                          {highlightedSprintId === group.sprint?.id && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-30 animate-bounce whitespace-nowrap">
                              <Navigation className="w-2.5 h-2.5 fill-white" />
                              <span>Sprint đang diễn ra</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 min-w-0">
                            {group.isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : group.isClosedIncomplete ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : group.isActive ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="min-w-0 flex items-center gap-1.5">
                              <span className="font-extrabold text-xs truncate" title={group.title}>
                                {group.shortTitle}
                              </span>
                              {group.sprint?.goal && (
                                <span
                                  className="text-[9px] font-medium text-blue-700 bg-blue-100/70 border border-blue-200/80 px-1.5 py-0.5 rounded-md truncate max-w-[130px] shrink-0"
                                  title={`Mục tiêu: ${group.sprint.goal}`}
                                >
                                  🎯 {group.sprint.goal}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!group.isDone && group.percent < 100 && (
                              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-black/10">
                                {group.percent}%
                              </span>
                            )}
                            {hasTasks && (
                              <ChevronRight
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""
                                  }`}
                              />
                            )}
                          </div>

                          {/* SPRINT HOVER POPUP IN TREE MODE: POSITIONED ABOVE NODE */}
                          {hoveredSprintId === (group.sprint?.id || 9999) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-72 sm:w-80 p-3.5 bg-white border-2 border-black rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.2)] text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95">
                              <div className="flex items-start justify-between font-bold border-b pb-1 gap-2">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                                    {group.shortTitle}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-gray-900 leading-snug break-words">
                                    {group.title}
                                  </h4>
                                </div>
                                <span className="font-mono text-blue-600 shrink-0 font-bold">
                                  {group.percent}%
                                </span>
                              </div>
                              {group.sprint?.goal && (
                                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-[11px] leading-snug">
                                  <span className="font-bold text-blue-700">🎯 Mục tiêu: </span>
                                  <span>{group.sprint.goal}</span>
                                </div>
                              )}
                              <div className="text-[11px] text-gray-600 space-y-1">
                                <p>
                                  Tiến độ:{" "}
                                  <strong className="text-black">
                                    {
                                      group.tasks.filter((t) => t.status === "DONE")
                                        .length
                                    }
                                    /{group.tasks.length}
                                  </strong>{" "}
                                  đã xong
                                </p>
                                {group.sprint?.startDate && (
                                  <p className="text-[10px] font-mono text-gray-500">
                                    {group.sprint.startDate.substring(0, 10)} ➔{" "}
                                    {group.sprint.endDate?.substring(0, 10) ||
                                      "Hiện tại"}
                                  </p>
                                )}
                              </div>
                              <p className="text-[10px] text-blue-600 italic text-center pt-0.5 font-medium">
                                💡 Bấm để {isExpanded ? "thu gọn" : "mở rộng"} danh
                                sách công việc
                              </p>

                              {/* Pointer arrow pointing down to sprint node */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                            </div>
                          )}
                        </div>

                        {/* LEVEL 2: TASKS BRANCHING TO THE RIGHT */}
                        {isExpanded && hasTasks && (
                          <div className="flex flex-col space-y-3 relative pl-6 border-l-2 border-dashed border-[#93C5FD]">
                            {group.tasks.map((task) => {
                              const visual = getTaskVisualProps(
                                task,
                                group.isActive
                              );
                              const assignee = getAssigneeInfo(task);
                              const isHovered = hoveredTaskId === task.id;
                              const isHighlighted =
                                highlightedTaskId === task.id;

                              return (
                                <div
                                  id={`mindmap-task-${task.id}`}
                                  key={task.id}
                                  onClick={() => handleTaskNodeClick(task)}
                                  onMouseEnter={() => setHoveredTaskId(task.id)}
                                  onMouseLeave={() => setHoveredTaskId(null)}
                                  className={`w-80 sm:w-96 p-3 rounded-xl border-2 text-xs font-medium cursor-pointer transition-all ${visual.bgClass
                                    } ${visual.borderClass} ${visual.isDimmed
                                      ? "opacity-30 grayscale"
                                      : "hover:scale-102 hover:shadow-md"
                                    } ${isHighlighted
                                      ? "ring-4 ring-blue-500 scale-105 shadow-xl"
                                      : ""
                                    } flex items-center justify-between gap-3 relative`}
                                >
                                  {/* Horizontal connector to parent branch */}
                                  <div className="absolute top-1/2 -left-6 w-6 h-0.5 bg-[#93C5FD]" />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-0.5 text-[10px]">
                                      <span className="font-mono font-bold text-gray-500">
                                        #{task.id}
                                      </span>
                                      {visual.isMine && (
                                        <span className="bg-blue-600 text-white font-extrabold px-1 py-0.2 rounded text-[8px]">
                                          VIỆC CỦA BẠN
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-bold text-[#111827] text-xs truncate">
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                                      <span className="truncate max-w-[120px] font-semibold text-gray-700">
                                        {assignee.name}
                                      </span>
                                      <span>•</span>
                                      <span className="font-mono">
                                        {task.dueDate || "Chưa hạn"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="shrink-0">{visual.badge}</div>

                                  {/* TASK HOVER POPUP IN TREE MODE: POSITIONED ABOVE TASK CARD */}
                                  {isHovered && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-80 p-3.5 bg-white border-2 border-black rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.2)] text-xs space-y-1.5 pointer-events-none animate-in fade-in zoom-in-95">
                                      <div className="flex items-center justify-between font-bold border-b pb-1">
                                        <span>#{task.id}</span>
                                        <span
                                          className={`text-[9px] px-2 py-0.5 rounded-full ${visual.statusBadgeColor}`}
                                        >
                                          {visual.statusLabel}
                                        </span>
                                      </div>
                                      <p className="font-extrabold text-sm text-gray-900 leading-snug">
                                        {task.title}
                                      </p>
                                      <div className="text-[11px] text-gray-600 space-y-0.5">
                                        <p>
                                          Phụ trách: <strong>{assignee.name}</strong>
                                        </p>
                                        <p>
                                          Độ ưu tiên:{" "}
                                          <strong>{task.priority}</strong>
                                        </p>
                                        <p>
                                          Hạn chót:{" "}
                                          <strong className="font-mono">{task.dueDate || "Chưa đặt"}</strong>
                                        </p>
                                      </div>

                                      {/* Pointer arrow pointing down to task card */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. GOOGLE MAPS FLOATING CONTROLS PANEL (BOTTOM-RIGHT) */}
        {/* ========================================================================= */}
        <div className="absolute bottom-5 right-5 z-40 flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md border border-gray-300 rounded-2xl p-1.5 shadow-xl">
          {/* Zoom In (+) */}
          <button
            onClick={zoomIn}
            title="Phóng to bản đồ (+)"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Current Zoom Percentage readout */}
          <button
            onClick={resetZoom}
            title="Nhấp để đặt lại tỉ lệ 100%"
            className="w-9 h-7 text-[10px] font-mono font-extrabold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center transition-colors"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom Out (-) */}
          <button
            onClick={zoomOut}
            title="Thu nhỏ bản đồ (-)"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-gray-200 my-0.5" />

          {/* Fit to View (Định vị toàn cảnh) */}
          <button
            onClick={fitView}
            title="Định vị toàn cảnh (Hiển thị vừa khung nhìn)"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Scan className="w-4 h-4" />
          </button>

          {/* Center on My Task (GPS / Vị trí của tôi) */}
          <button
            onClick={centerOnMyTask}
            title="Định vị công việc của tôi (Vị trí hiện tại)"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-100/70 transition-colors relative"
          >
            <Navigation className="w-4 h-4 fill-blue-600" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </button>

          {/* Center on Active Sprint */}
          {activeSprint && (
            <button
              onClick={() => centerOnActiveSprint(1)}
              title={`Định vị Sprint đang chạy (Thu phóng 100%): ${activeSprint.name}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors relative"
            >
              <GitBranch className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. MINIMAP OVERVIEW RADAR (BOTTOM-LEFT) */}
        {/* ========================================================================= */}
        <div className="absolute bottom-5 left-5 z-40">
          {showMinimap ? (
            <div className="w-60 sm:w-64 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xl space-y-2 animate-in fade-in select-none">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 border-b border-gray-100 pb-1.5">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-800">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> Radar Bản đồ
                </span>
                <button
                  onClick={() => setShowMinimap(false)}
                  className="text-gray-400 hover:text-black p-0.5 rounded-md hover:bg-gray-100 transition-colors"
                  title="Thu nhỏ radar"
                >
                  ✕
                </button>
              </div>

              {/* Active Sprint Quick Target Bar */}
              {activeSprint && (
                <button
                  onClick={() => centerOnActiveSprint(1)}
                  className="w-full text-left p-2 rounded-xl bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                  title={`Bấm để chuyển nhanh tới ${activeSprint.name} (Thu phóng 100%)${activeSprint.goal ? ` • Mục tiêu: ${activeSprint.goal}` : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-blue-700 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                      <span>Sprint đang diễn ra</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-extrabold text-xs text-blue-950 truncate group-hover:text-blue-700 transition-colors">
                        {getShortSprintName(activeSprint.name)}
                      </p>
                      {activeSprint.goal && (
                        <span className="text-[10px] text-blue-600 truncate font-medium shrink-0 max-w-[105px]" title={activeSprint.goal}>
                          • 🎯 {activeSprint.goal}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    100% ➔
                  </span>
                </button>
              )}

              {/* Minimap preview screen */}
              <div
                onClick={() => centerOnActiveSprint(1)}
                className="w-full h-24 bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl border border-gray-200 relative overflow-hidden cursor-pointer group flex items-center justify-center p-2 hover:border-blue-400 hover:shadow-inner transition-all"
                title={
                  activeSprint
                    ? `Bấm vào để chỉ thẳng vào ${activeSprint.name} (Thu phóng 100%)`
                    : "Bấm vào để định vị bản đồ"
                }
              >
                {/* Visual footprints of Space & Sprints */}
                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity max-w-full overflow-hidden px-1">
                  <div
                    className="w-6 h-5 bg-amber-300 rounded-xs border border-amber-500 shrink-0 flex items-center justify-center text-[7px] font-bold text-amber-900"
                    title="Không gian đề tài (Space)"
                  >
                    SP
                  </div>
                  <div className="w-2 h-0.5 bg-blue-300 shrink-0" />
                  {sprintGroups.map((g) => {
                    const isAct =
                      g.isActive || g.sprint?.id === activeSprint?.id;
                    return (
                      <button
                        key={g.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (g.sprint?.id) {
                            centerOnSprint(g.sprint.id, isAct ? 1 : undefined);
                          } else {
                            centerOnSprint("backlog");
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded-xs border text-[8px] font-bold shrink-0 truncate max-w-[55px] transition-all cursor-pointer ${isAct
                            ? "bg-blue-600 border-blue-700 text-white ring-2 ring-blue-300 ring-offset-1 animate-pulse"
                            : g.isDone
                              ? "bg-emerald-400 border-emerald-600 text-emerald-950 hover:bg-emerald-500"
                              : "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300"
                          }`}
                        title={`Bấm để chuyển tới ${g.title}${isAct ? " (Thu phóng 100%)" : ""}`}
                      >
                        {g.title.replace(/sprint\s*/i, "S")}
                      </button>
                    );
                  })}
                </div>

                {/* Viewport frame indicator */}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/10 rounded pointer-events-none transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(30, 100 / scale))}%`,
                    height: `${Math.min(100, Math.max(30, 100 / scale))}%`,
                  }}
                />
              </div>

              <p className="text-[10px] text-gray-500 text-center font-medium">
                Bấm vào radar để chỉ thẳng và phóng 100% vào{" "}
                <strong className="text-blue-600">
                  {activeSprint?.name || "Sprint đang diễn ra"}
                </strong>
              </p>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowMinimap(true);
                centerOnActiveSprint(1);
              }}
              className="px-3 py-1.5 bg-white/95 backdrop-blur-md border border-gray-300 rounded-xl shadow-md text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Radar: {activeSprint?.name || "Sprint đang chạy"}</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. FLOATING MAP LEGEND (COLLAPSIBLE, TOP-LEFT) */}
        {/* ========================================================================= */}
        {showLegend && (
          <div className="absolute top-4 left-4 z-40 w-64 bg-white/95 backdrop-blur-md border border-gray-300 rounded-2xl p-3.5 shadow-2xl space-y-2.5 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="font-extrabold text-[11px] text-gray-900 uppercase tracking-wider">
                Chú thích Ký hiệu
              </span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-gray-400 hover:text-black font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Trạng thái Sprint
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Hoàn thành (100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold text-blue-700">Đang diễn ra</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Đã đóng (chưa xong)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span>Chưa bắt đầu</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] pt-2 border-t">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Trạng thái Công việc
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold">
                  ✓
                </span>
                <span>Đã hoàn thành</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                </span>
                <span>Đang thực hiện</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold">
                  !
                </span>
                <span className="text-red-600 font-semibold">
                  Trễ hạn / Rủi ro
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm border-2 border-blue-600 bg-blue-100 animate-pulse" />
                <span className="text-blue-700 font-bold">
                  Công việc của bạn
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
