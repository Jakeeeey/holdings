# Schedule of Activities (Tasks Module)

This module provides the employee relations schedule of activities and task tracking functionalities. It supports displaying tasks in board, calendar, and list views, assigning tasks to multiple users, setting priorities, categorizing activities, and assigning custom colors.

## 📂 Architecture & Data Flow

The module follows a three-tier architecture:
1. **Frontend UI Components** (React/Tailwind) -> 
2. **Next.js API Routes** (`/api/er/tasks`) -> 
3. **Directus Backend Service** (`taskService.ts`) -> **Directus Database**

### Components
- `TaskBoard.tsx`: The primary interface. Manages the state for `viewMode` (board/calendar/list) and renders the appropriate sub-components. Fetches data using the `useTasks` hook.
- `CreateTaskDialog.tsx` & `EditTaskDialog.tsx`: Modals for creating and editing activities. Includes inputs for title, description, category, color, priority, status, start/end dates, and multiple assignees.

### Hooks & State Management
- `useTasks.ts`: A custom hook that calls the internal Next.js API endpoints (`/api/er/tasks`). It encapsulates the fetching, creating, updating, and deleting logic and manages the loading/error states.

### Services & API
- `taskService.ts`: A utility module that abstracts the Directus REST API logic. It fetches tasks and maps junction tables (like `employee_task_assignee` for multi-user assignment) into a single unified JSON object for the frontend.

## 💾 Database Schema (Directus)

This module relies on the following primary tables in the Directus instance:

### `employee_task`
The central table for storing activities/tasks.
- `id` (Primary Key)
- `title` (String, required)
- `description` (Text, optional)
- `category` (String: `'Task' | 'Activity' | 'Meeting' | 'Other'`)
- `color` (String: Hex color code for calendar styling)
- `status` (String: `'Pending' | 'In Progress' | 'Complete'`)
- `priority` (String: `'Low' | 'Medium' | 'High' | 'Urgent'`)
- `user_id` (Integer/String: The creator of the task)
- `start_date` (Datetime ISO string)
- `end_date` (Datetime ISO string)
- `date_created`, `date_updated`

### `employee_task_assignee`
A junction table to support Many-to-Many relationships between Tasks and Users (assignees).
- `id` (Primary Key)
- `task_id` (Foreign Key referencing `employee_task.id`)
- `user_id` (Foreign Key referencing the employee's `user_id`)

### `recurring_rules` (Beta)
Stores cron schedules for tasks that need to be generated repeatedly.
- `id` (Primary Key)
- `task_template` (JSON representation of the task to clone)
- `cron_expression` (String)
- `status` (String: `'Active' | 'Paused'`)

## 🎨 UI Styling and Colors
- **Categories**: Category badges (`Task`, `Activity`, `Meeting`, `Other`) are displayed on Board cards and in the List view.
- **Custom Colors**: The `color` property overrides standard status/priority colors. If set, the color is rendered as the background block in Calendar Views (Month, Week, Day) and as a left border highlight on Board View cards.

## 🔗 Extensibility
To add a new field to the Schedule of Activities:
1. **Schema**: Add the field to the `employee_task` table in Directus Data Studio.
2. **Types**: Update the Zod schemas and inferred types in `type.ts`.
3. **UI**: Add the input elements to `CreateTaskDialog.tsx` and `EditTaskDialog.tsx`. Ensure the frontend displays the new field in `TaskBoard.tsx`.
