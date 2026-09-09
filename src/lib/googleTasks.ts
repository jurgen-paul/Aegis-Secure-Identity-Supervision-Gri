export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
  parent?: string;
  position?: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339 timestamp (e.g. 2026-09-05T00:00:00.000Z)
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
  links?: Array<{
    href: string;
    type: string;
    description: string;
  }>;
}

const BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

const getHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

// Fetch all task lists
export async function fetchTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  const res = await fetch(`${BASE_URL}/users/@me/lists?maxResults=100`, {
    headers: getHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch task lists (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

// Create new task list
export async function createTaskList(accessToken: string, title: string): Promise<GoogleTaskList> {
  const res = await fetch(`${BASE_URL}/users/@me/lists`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create task list (HTTP ${res.status})`);
  }

  return res.json();
}

// Delete task list (Requires explicit user confirmation before calling)
export async function deleteTaskList(accessToken: string, tasklistId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/@me/lists/${tasklistId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete task list (HTTP ${res.status})`);
  }
}

// Fetch tasks for a given list
export async function fetchTasks(
  accessToken: string,
  tasklistId: string,
  showCompleted = true,
  showHidden = true
): Promise<GoogleTask[]> {
  const params = new URLSearchParams({
    maxResults: '100',
    showCompleted: String(showCompleted),
    showHidden: String(showHidden),
  });

  const res = await fetch(`${BASE_URL}/lists/${tasklistId}/tasks?${params.toString()}`, {
    headers: getHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch tasks (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

// Create task in a list
export async function createTask(
  accessToken: string,
  tasklistId: string,
  taskData: {
    title: string;
    notes?: string;
    due?: string;
  }
): Promise<GoogleTask> {
  const res = await fetch(`${BASE_URL}/lists/${tasklistId}/tasks`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      title: taskData.title,
      notes: taskData.notes,
      due: taskData.due,
      status: 'needsAction',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create task (HTTP ${res.status})`);
  }

  return res.json();
}

// Patch / Update task status or details
export async function patchTask(
  accessToken: string,
  tasklistId: string,
  taskId: string,
  updates: Partial<GoogleTask>
): Promise<GoogleTask> {
  const res = await fetch(`${BASE_URL}/lists/${tasklistId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update task (HTTP ${res.status})`);
  }

  return res.json();
}

// Delete task (Requires explicit user confirmation before calling)
export async function deleteTask(
  accessToken: string,
  tasklistId: string,
  taskId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/lists/${tasklistId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete task (HTTP ${res.status})`);
  }
}

// Clear all completed tasks in list (Requires explicit user confirmation before calling)
export async function clearCompletedTasks(
  accessToken: string,
  tasklistId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/lists/${tasklistId}/clear`, {
    method: 'POST',
    headers: getHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to clear completed tasks (HTTP ${res.status})`);
  }
}
