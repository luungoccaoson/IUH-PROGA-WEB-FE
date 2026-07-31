# FRONTEND SYSTEM SPECIFICATION & VIBE CODING GUIDE (PROGA)
> **Target Audience:** AI Coding Assistants (Claude 3.5 Sonnet, Cursor, Anysphere/Antigravity)
> **Project Name:** PROGA - Frontend Ecosystem (Web & Mobile)
> **Architecture Pattern:** Feature-based / Layered Frontend Architecture, Client-Side State Management, Reactive UI with Realtime Sync

---

## 1. TỔNG QUAN HỆ THỐNG FRONTEND (FRONTEND OVERVIEW)
Hệ thống Frontend của **PROGA** gồm 2 nền tảng chính:
1. **Web Application (Next.js App Router):** Dành cho Quản trị viên (Admin), Project Manager (PM) và Developer thao tác màn hình lớn, quản lý Sprints & Backlog, bảng Kanban đa cột, Dashboard thống kê phức tạp và Chatbot AI chuyên sâu.
2. **Mobile Application (React Native Expo):** Dành cho Member/Developer theo dõi nhanh tiến độ, nhận Push Notification thời gian thực, cập nhật nhanh trạng thái Task và trao đổi với AI Agents mọi lúc mọi nơi.

---

## 2. TECH STACK & CHUẨN THƯ VIỆN FRONTEND (FRONTEND TECH STACK)

### 2.1 Web Application Tech Stack
* **Framework:** Next.js 14+ (App Router, React 18+).
* **Language:** TypeScript (Strict Mode mandatory).
* **Styling & UI Kit:** Tailwind CSS + Shadcn UI (Radix UI primitives) + Lucide Icons.
* **State & Custom Hooks Architecture:**
  * **Stores (`src/stores/`):** Zustand - Quản lý **State toàn cục (Global State)** như `useAuthStore` (thông tin user đăng nhập, token), `useThemeStore`.
  * **Custom Hooks (`src/hooks/`):** Tách biệt **Business Logic** tái sử dụng khỏi UI Component (ví dụ `useSprints`, `useTasks`, `useSpace`).
  * **Server State & Caching:** TanStack Query v5 (React Query) / Custom Hooks gói Axios Service.
* **Drag and Drop (Kanban):** `@hello-pangea/dnd` hoặc `@dnd-kit/core`.
* **Form & Validation:** React Hook Form + Zod Schema Validation.
* **HTTP Client:** Axios (cấu hình Interceptors tự động đính kèm JWT Bearer Token & Refresh Token).
* **Realtime Connection:** `@stomp/stompjs` + `sockjs-client` (Lắng nghe WebSocket thông báo & đồng bộ Kanban real-time).

### 2.2 Mobile Application Tech Stack
* **Framework:** React Native (Expo SDK 50+).
* **Language:** TypeScript.
* **Navigation:** React Navigation v6 (Stack + Bottom Tabs + Drawer Navigation).
* **UI Components:** React Native Paper + React Native Vector Icons / React Native Reanimated.
* **State & Data Fetching:** Zustand + Custom Hooks / TanStack Query v5.
* **Storage:** `expo-secure-store` (Lưu JWT Token an toàn).

---

## 3. CẤU TRÚC THƯ MỤC CHUẨN (PROJECT FOLDER STRUCTURE)

Áp dụng cấu trúc **Feature-based Modular Architecture**:

```text
src/
├── app/                      # [Next.js App Router] Pages & Routes
│   ├── (auth)/               # Route Group: login, register
│   ├── (dashboard)/          # Route Group: main app layout
│   │   ├── workspaces/       # Workspace List & Detail
│   │   │   └── [id]/spaces/[spaceId]/ # Space Detail (Overview, Sprints/Backlog, Kanban)
│   │   └── admin/            # Admin Panel
│   └── api/                  # Next.js BFF (nếu cần)
├── assets/                   # Images, SVGs, Fonts
├── components/               # Shared Reusable UI Components
│   ├── ui/                   # Shadcn Base Components (Button, Dialog, Input, etc.)
│   ├── shared/               # Header, Sidebar, LoadingSpinner, UserAvatar
│   └── workspace/            # SprintTaskList, KanbanBoard, TaskModal, SprintModal
├── hooks/                    # Reusable Custom React Hooks (useSprints, useTasks, useDebounce)
├── lib/                      # Axios Instance, Stomp Client, Utils, Constants
├── services/                 # API Service Layer (workspaceService, sprintService, authService)
├── stores/                   # Zustand Stores (useAuthStore, useWorkspaceStore - Global State)
└── types/                    # Shared Modular TypeScript Interfaces / Enums
    ├── api.ts                # ApiResponse<T>
    ├── auth.ts               # User, AuthResponse, RoleName
    ├── workspace.ts          # Workspace, Space, WorkspaceLog
    ├── sprint.ts             # Sprint, SprintStatus ('FUTURE' | 'ACTIVE' | 'CLOSED')
    ├── task.ts               # Task, TaskStatus, TaskPriority, TaskNote
    ├── ai.ts                 # AgentType, ChatMessage
    └── index.ts              # Export toàn bộ types từ các file trên
```

---

## 4. MA TRẬN MÀN HÌNH & LUỒNG TRẢI NGHIỆM (USER FLOWS & SCREENS)

### 4.1 Luồng 1: Xác thực & Điều hướng (Authentication & Routing)
* **Screen 1.1: Login / Register Page (`/login`, `/register`)**
  * Nhập Email/Password $\rightarrow$ Submit qua `auth-service` (port 8080/api/v1/auth/login).
  * Thành công: Lưu `accessToken` vào Secure Cookie/Storage, lưu thông tin User vào Zustand `useAuthStore`.
  * Redirect tự động về `/workspaces`.
* **Screen 1.2: Protected Layout (`(dashboard)/layout.tsx`)**
  * Check Token hợp lệ qua `AuthGuard` component. Nếu hết hạn $\rightarrow$ Tự gọi Refresh Token hoặc đẩy về `/login`.

### 4.2 Luồng 2: Quản lý Workspace & Space (Workspace & Space Hierarchy)
* **Screen 2.1: Workspace Dashboard (`/workspaces`)**
  * Hiển thị Grid các Workspace card.
  * Modal: "Tạo Workspace Mới" & "Mời Thành Viên" (PM / Admin).
  * Header có Workspace Switcher dropdown.
* **Screen 2.2: Space Detail View (`/workspaces/[id]/spaces/[spaceId]`)**
  * Chứa Tab Navigation: `[ Tổng quan | Danh sách task (Sprints & Backlog) | Bảng kanban ]`.

### 4.3 Luồng 3: Quản lý Sprints, Backlog & Task (`/spaces/[spaceId]`)
* **Screen 3.1: Tab Danh sách Task (Sprints & Backlog View)**
  * Hiển thị các Sprints (`PROGA Sprint 1`, `PROGA Sprint 2`...) và Công việc tồn đọng (`Backlog`).
  * **Tự động bắt đầu / kết thúc Sprint theo ngày:**
    * Khi `now >= startDate` và `now < endDate` $\rightarrow$ Sprint tự chuyển `ACTIVE`.
    * Khi `now >= endDate` $\rightarrow$ Sprint tự đóng `CLOSED`, toàn bộ Task chưa `DONE` tự đẩy sang Sprint kế tiếp (hoặc về Backlog nếu không còn Sprint kế).
  * **Đánh dấu TRỄ HẠN (OVERDUE):**
    * So sánh `dueDate` với ngày hiện tại: Nếu `dueDate < now` và chưa `DONE` $\rightarrow$ Hiện nhãn cảnh báo đỏ **QUÁ HẠN / OVERDUE**.

* **Screen 3.2: Bảng Kanban View (`/spaces/[spaceId]`)**
  * 4 Cột: **CẦN LÀM (TODO)**, **ĐANG LÀM (IN_PROGRESS)**, **ĐANG DUYỆT (REVIEW)**, **ĐÃ XONG (DONE)**.
  * Hiển thị danh sách task của Sprint đang `ACTIVE`.
  * Kéo thả (Drag & Drop) chuyển trạng thái task real-time qua WebSocket.

### 4.4 Luồng 4: Tương tác AI Agents (AI Assistant Drawer)
* **Screen 4.1: AI Chat Widget (Sidebar / Drawer)**
  * Cho phép chọn 1 trong 3 Agents: **Requirement Agent**, **PM Agent**, **Technical Advisor Agent**.
  * Dynamic Task Deconstruction: AI trả về đề xuất chia nhỏ task $\rightarrow$ UI hiện nút "Đồng ý tạo các Task này vào Sprint/Backlog".

---

## 5. PHÂN BIỆT STORES VÀ CUSTOM HOOKS

* **Zustand Stores (`src/stores/`):**
  * Dùng cho State TOÀN CỤC (Global Application State).
  * Dữ liệu cần truy cập ở mọi vị trí trên cây component mà không cần truyền props (ví dụ `useAuthStore.getState().user`).
* **Custom Hooks (`src/hooks/`):**
  * Dùng đóng gói BUSINESS LOGIC, API call và State LOCAL của tính năng.
  * Giúp giữ cho các React UI Component gọn gàng, tuân thủ nguyên tắc Single Responsibility.
  * Ví dụ: `useSprints(spaceId)` quản lý logic load danh sách Sprint, tạo/sửa Sprint, tự động tính toán thời gian đóng/mở Sprint.

---

## 6. ĐỊNH NGHĨA KIỂU DỮ LIỆU FRONTEND (TYPESCRIPT INTERFACES)

Đã chuyển sang cấu trúc modular trong `src/types/*.ts`:
- `auth.ts`: `User`, `RoleName`, `AuthResponse`
- `workspace.ts`: `Workspace`, `Space`, `WorkspaceLog`
- `sprint.ts`: `Sprint`, `SprintStatus` (`FUTURE` | `ACTIVE` | `CLOSED`)
- `task.ts`: `Task`, `TaskStatus`, `TaskPriority`, `TaskNote`
- `ai.ts`: `AgentType`, `ChatMessage`
- `api.ts`: `ApiResponse<T>`
