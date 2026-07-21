# FRONTEND SYSTEM SPECIFICATION & VIBE CODING GUIDE (PROGA)
> **Target Audience:** AI Coding Assistants (Claude 3.5 Sonnet, Cursor, Anysphere/Antigravity)
> **Project Name:** PROGA - Frontend Ecosystem (Web & Mobile)
> **Architecture Pattern:** Feature-based / Layered Frontend Architecture, Client-Side State Management, Reactive UI with Realtime Sync

---

## 1. TỔNG QUAN HỆ THỐNG FRONTEND (FRONTEND OVERVIEW)
Hệ thống Frontend của **PROGA** gồm 2 nền tảng chính:
1. **Web Application (Next.js App Router):** Dành cho Quản trị viên (Admin), Project Manager (PM) và Developer thao tác màn hình lớn, bảng Kanban đa cột, Dashboard thống kê phức tạp và Chatbot AI chuyên sâu.
2. **Mobile Application (React Native Expo):** Dành cho Member/Developer theo dõi nhanh tiến độ, nhận Push Notification thời gian thực, cập nhật nhanh trạng thái Task và trao đổi với AI Agents mọi lúc mọi nơi.

---

## 2. TECH STACK & CHUẨN THƯ VIỆN FRONTEND (FRONTEND TECH STACK)

### 2.1 Web Application Tech Stack
* **Framework:** Next.js 14+ (App Router, React 18+).
* **Language:** TypeScript (Strict Mode mandatory).
* **Styling & UI Kit:** Tailwind CSS + Shadcn UI (Radix UI primitives) + Lucide Icons.
* **State Management:**
  * **Global / Auth / UI State:** Zustand (Nhẹ, không boilerplate).
  * **Server State / Caching / Optimistic Update:** TanStack Query v5 (React Query).
* **Drag and Drop (Kanban):** `@hello-pangea/dnd` hoặc `@dnd-kit/core`.
* **Form & Validation:** React Hook Form + Zod Schema Validation.
* **HTTP Client:** Axios (cấu hình Interceptors tự động đính kèm JWT Bearer Token & Refresh Token).
* **Realtime Connection:** `@stomp/stompjs` + `sockjs-client` (Lắng nghe WebSocket thông báo).

### 2.2 Mobile Application Tech Stack
* **Framework:** React Native (Expo SDK 50+).
* **Language:** TypeScript.
* **Navigation:** React Navigation v6 (Stack + Bottom Tabs + Drawer Navigation).
* **UI Components:** React Native Paper + React Native Vector Icons / React Native Reanimated.
* **State & Data Fetching:** Zustand + TanStack Query v5.
* **Storage:** `expo-secure-store` (Lưu JWT Token an toàn).

---

## 3. CẤU TRÚC THƯ MỤC CHUẨN (PROJECT FOLDER STRUCTURE)

Áp dụng cấu trúc **Feature-based Modular Architecture** để AI sinh code không bị trùng lặp hoặc nhầm lẫn import:

```text
src/
├── app/                      # [Next.js App Router] Pages & Routes
│   ├── (auth)/               # Route Group: login, register
│   ├── (dashboard)/          # Route Group: main app layout
│   │   ├── workspaces/       # Workspace List & Detail
│   │   ├── spaces/[id]/      # Kanban Board, Space Analytics
│   │   └── admin/            # Admin Panel
│   └── api/                  # Next.js BFF (nếu cần)
├── assets/                   # Images, SVGs, Fonts
├── components/               # Shared Reusable UI Components
│   ├── ui/                   # Shadcn Base Components (Button, Dialog, Input, etc.)
│   ├── shared/               # Header, Sidebar, LoadingSpinner, UserAvatar
│   └── kanban/               # KanbanCard, KanbanColumn, TaskModal
├── features/                 # Modular Business Features
│   ├── auth/                 # components, hooks, services, types for Auth
│   ├── workspace/            # components, hooks, services, types for Workspace
│   ├── task/                 # components, hooks, services, types for Task
│   ├── ai-agent/             # components, hooks, services for AI Chat Drawer
│   └── notification/         # components, hooks, services for Realtime Alert
├── hooks/                    # Global Custom React Hooks (useDebounce, useMediaQuery)
├── lib/                      # Axios Instance, Stomp Client, Utils, Constants
├── services/                 # API Service Layer (Calls Backend API Gateway at :8080)
├── stores/                   # Zustand Stores (useAuthStore, useWorkspaceStore)
└── types/                    # Shared TypeScript Interfaces / Enums
```

---

## 4. MA TRẬN MÀN HÌNH & LUỒNG TRẢI NGHIỆM (USER FLOWS & SCREENS)

### 4.1 Luồng 1: Xác thực & Điều hướng (Authentication & Routing)
* **Screen 1.1: Login / Register Page (`/login`, `/register`)**
  * Nhập Email/Password $ightarrow$ Submit qua `auth-service` (port 8080/api/v1/auth/login).
  * Thành công: Lưu `accessToken` vào Secure Cookie/Storage, lưu thông tin User vào Zustand `useAuthStore`.
  * Redirect tự động về `/workspaces`.
* **Screen 1.2: Protected Layout (`(dashboard)/layout.tsx`)**
  * Check Token hợp lệ qua `AuthGuard` component. Nếu hết hạn $ightarrow$ Tự gọi Refresh Token hoặc đẩy về `/login`.

### 4.2 Luồng 2: Quản lý Workspace & Space (Workspace & Space Hierarchy)
* **Screen 2.1: Workspace Dashboard (`/workspaces`)**
  * Hiển thị Grid các Workspace card.
  * Modal: "Tạo Workspace Mới" & "Mời Thành Viên" (PM / Admin).
  * Header có Workspace Switcher dropdown.
* **Screen 2.2: Space Detail View (`/workspaces/[id]/spaces/[spaceId]`)**
  * Chứa Tab Navigation: `[ Bảng Kanban | Tiến độ Timeline | AI Assistant | Settings ]`.

### 4.3 Luồng 3: Vận hành Bảng Kanban & Task (`/spaces/[spaceId]/kanban`)
* **Screen 3.1: Kanban Board View**
  * 4 Cột: **TODO**, **IN_PROGRESS**, **REVIEW**, **DONE**.
  * Filter Bar: Lọc theo Assignee (`owner_id`), Độ ưu tiên (`priority`), Từ khóa tìm kiếm.
  * Drag & Drop: Kéo card giữa các cột $ightarrow$ Trigger Optimistic UI Update $ightarrow$ Gọi API PATCH `/api/v1/workspaces/tasks/{id}/status`.
* **Screen 3.2: Task Detail Drawer / Modal**
  * Mở khi click vào Task Card.
  * Cho phép: Đổi tiêu đề, mô tả, ngày hết hạn (`due_date`), gán Assignee.
  * Tab **Notes & Comments:** Thêm ghi chú mới (`task_notes`).
  * Tab **Activity Logs:** Hiển thị danh sách lịch sử biến động (`workspace_logs`) từ backend.

### 4.4 Luồng 4: Tương tác AI Agents (AI Assistant Drawer)
* **Screen 4.1: AI Chat Widget (Sidebar / Drawer)**
  * Cho phép chọn 1 trong 3 Agents: **Requirement Agent**, **PM Agent**, **Technical Advisor Agent**.
  * UI Chat: Hiển thị bong bóng chat real-time.
  * Special Action (Requirement Agent): Khi AI trả về JSON Payload phân rã Task $ightarrow$ Render UI dạng **Preview Task List** kèm nút **"Đồng ý tạo các Task này vào Space"**.

### 4.5 Luồng 5: Thông báo Realtime (Notification Center)
* **Screen 5.1: Notification Bell & Popover**
  * Kết nối WebSocket STOMP tới Endpoint `/ws-guide` của `notification-service`.
  * Khi nhận Event: Bật Toast Message thông báo + Tăng badge unread count + Append vào danh sách thông báo.

---

## 5. ĐỊNH NGHĨA KIỂU DỮ LIỆU FRONTEND (TYPESCRIPT INTERFACES)

AI bắt buộc dùng các Interface này để khớp 100% với Backend DTO:

```typescript
// Enums
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AgentType = 'REQUIREMENT' | 'PM' | 'TECHNICAL_ADVISOR';
export type RoleName = 'ADMIN' | 'PM' | 'MEMBER';

// User & Auth
export interface User {
  id: string; // UUID
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Workspace & Space
export interface Workspace {
  id: string; // UUID
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
}

export interface Space {
  id: string; // UUID
  workspaceId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Task & Kanban
export interface Task {
  id: string; // UUID
  spaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerId?: string; // Assignee ID
  ownerName?: string;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
}

export interface TaskNote {
  id: number;
  taskId: string;
  authorId: string;
  authorName: string;
  noteContent: string;
  createdAt: string;
}

export interface WorkspaceLog {
  id: number;
  workspaceId: string;
  taskId?: string;
  userId: string;
  actionType: string;
  oldValue?: string;
  newValue?: string;
  logMessage: string;
  createdAt: string;
}

// AI Chat
export interface ChatMessage {
  id: number;
  threadId: string;
  senderType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  messageContent: string;
  jsonPayload?: string; // Dùng cho Task Deconstruction preview
  createdAt: string;
}
```

---

## 6. QUY TẮC BẮT BUỘC KHI XUẤT CODE FRONTEND (VIBE CODING RULES)

1. **API Call Single Entry Point:**
   * Tất cả Axios Call đều gọi qua API Gateway tại `http://localhost:8080/api/v1/...`. Không gọi trực tiếp vào port lẻ của Microservice.
2. **State Caching Standard:**
   * Dùng TanStack Query cho Server State. Key Query phải chuẩn:
     * Workspace List: `['workspaces']`
     * Space List: `['workspaces', workspaceId, 'spaces']`
     * Kanban Tasks: `['spaces', spaceId, 'tasks']`
3. **Optimistic Updates:**
   * Khi kéo thả Task trên Kanban, bắt buộc triển khai Optimistic Update (Cập nhật UI ngay lập tức trước khi API response) để đem lại trải nghiệm mượt mà. Nếu API lỗi mới Rollback.
4. **Form & Error Handling:**
   * Dùng React Hook Form + Zod. Bắt buộc hiển thị Toast notification (Shadcn Toast/Sonner) khi API thất bại.
5. **Responsive & Mobile Ready:**
   * Dựng Web CSS ưu tiên Responsive layout (Sidebar thu gọn trên Tablet/Mobile, Bảng Kanban hỗ trợ Scroll ngang mượt mà).
