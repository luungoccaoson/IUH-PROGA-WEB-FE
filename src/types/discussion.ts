export interface TaskNote {
  id: number;
  taskId: number;
  taskTitle?: string;
  authorId: number;
  noteContent: string;
  createdAt: string;
}

export interface WorkspaceLog {
  id: number;
  workspaceId: number;
  taskId?: number | null;
  taskTitle?: string;
  userId: number;
  actionType: string;
  oldValue?: string;
  newValue?: string;
  logMessage: string;
  createdAt: string;
}

export const formatStatusVn = (status?: string | null): string => {
  if (!status) return "";
  const s = status.trim().toUpperCase();
  switch (s) {
    case "TODO":
      return "Cần làm";
    case "IN_PROGRESS":
      return "Đang làm";
    case "IN_REVIEW":
    case "REVIEW":
      return "Chờ duyệt";
    case "DONE":
      return "Đã xong";
    default:
      return status;
  }
};

export const formatPriorityVn = (priority?: string | null): string => {
  if (!priority) return "";
  const p = priority.trim().toUpperCase();
  switch (p) {
    case "LOW":
      return "Thấp";
    case "MEDIUM":
      return "Trung bình";
    case "HIGH":
      return "Cao";
    case "URGENT":
      return "Khẩn cấp";
    default:
      return priority;
  }
};

export const formatActionTypeVn = (actionType?: string | null): string => {
  if (!actionType) return "Hoạt động";
  const a = actionType.trim().toUpperCase();
  switch (a) {
    case "CREATE_TASK":
      return "Tạo công việc";
    case "STATUS_CHANGE":
    case "UPDATE_STATUS":
      return "Đổi trạng thái";
    case "UPDATE_TASK":
      return "Cập nhật công việc";
    case "DELETE_TASK":
      return "Chuyển vào thùng rác";
    case "RESTORE_TASK":
      return "Khôi phục công việc";
    default:
      return actionType;
  }
};

export const formatLogMessageVn = (msg?: string | null): string => {
  if (!msg) return "";
  return msg
    .replace(/\bTODO\b/gi, "Cần làm")
    .replace(/\bIN_PROGRESS\b/gi, "Đang làm")
    .replace(/\bIN_REVIEW\b/gi, "Chờ duyệt")
    .replace(/\bREVIEW\b/gi, "Chờ duyệt")
    .replace(/\bDONE\b/gi, "Đã xong")
    .replace(/\bLOW\b/gi, "Thấp")
    .replace(/\bMEDIUM\b/gi, "Trung bình")
    .replace(/\bHIGH\b/gi, "Cao")
    .replace(/\bURGENT\b/gi, "Khẩn cấp");
};
