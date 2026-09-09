import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from '../../lib/firebaseAuth';
import {
  GoogleTaskList,
  GoogleTask,
  fetchTaskLists,
  createTaskList,
  deleteTaskList,
  fetchTasks,
  createTask,
  patchTask,
  deleteTask,
  clearCompletedTasks,
} from '../../lib/googleTasks';
import { TrackedSubject, ActiveAlertLog } from '../../types';
import {
  CheckSquare,
  Square,
  ListTodo,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  LogOut,
  ShieldCheck,
  Sparkles,
  Edit2,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';
import { ConfirmActionModal } from './ConfirmActionModal';
import { CreateDirectiveModal } from './CreateDirectiveModal';

interface GoogleTasksManagerProps {
  subjects: TrackedSubject[];
  activeAlerts: ActiveAlertLog[];
  onSelectSubject?: (subject: TrackedSubject) => void;
  pendingDirectiveSubject?: TrackedSubject | null;
  onClearPendingDirectiveSubject?: () => void;
}

export const GoogleTasksManager: React.FC<GoogleTasksManagerProps> = ({
  subjects,
  activeAlerts,
  onSelectSubject,
  pendingDirectiveSubject,
  onClearPendingDirectiveSubject,
}) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Google Tasks Data
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'DUE_SOON'>('ALL');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // New List State
  const [isCreatingList, setIsCreatingList] = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<GoogleTask | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDue, setEditDue] = useState<string>('');

  // Confirmation Modal State (Mandatory for destructive actions)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemName?: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });
  const [isConfirmProcessing, setIsConfirmProcessing] = useState<boolean>(false);

  // Open modal if prefilled subject is received
  useEffect(() => {
    if (pendingDirectiveSubject && token) {
      setIsCreateModalOpen(true);
    }
  }, [pendingDirectiveSubject, token]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        loadTaskLists(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setTaskLists([]);
        setTasks([]);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    soundFx.playClick();

    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        soundFx.playDecrypt();
        await loadTaskLists(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err.message || 'Authentication with Google Tasks failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    soundFx.playClick();
    await logout();
    setUser(null);
    setToken(null);
    setTaskLists([]);
    setTasks([]);
  };

  // Load Task Lists
  const loadTaskLists = async (accessToken: string) => {
    setIsLoadingLists(true);
    setApiError(null);

    try {
      const lists = await fetchTaskLists(accessToken);
      setTaskLists(lists);
      if (lists.length > 0) {
        const defaultList = lists[0].id;
        setSelectedListId(defaultList);
        await loadTasks(accessToken, defaultList);
      }
    } catch (err: any) {
      console.error('Failed to load task lists:', err);
      setApiError(err.message || 'Error loading Google Task lists.');
    } finally {
      setIsLoadingLists(false);
    }
  };

  // Load Tasks for a List
  const loadTasks = async (accessToken: string, listId: string) => {
    setIsLoadingTasks(true);
    setApiError(null);

    try {
      const items = await fetchTasks(accessToken, listId, true, true);
      setTasks(items);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setApiError(err.message || 'Error loading tasks from Google Tasks.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Switch Selected List
  const handleSelectList = (listId: string) => {
    soundFx.playClick();
    setSelectedListId(listId);
    if (token) {
      loadTasks(token, listId);
    }
  };

  // Create New Task List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newListName.trim()) return;

    soundFx.playClick();
    try {
      const created = await createTaskList(token, newListName.trim());
      setTaskLists((prev) => [...prev, created]);
      setSelectedListId(created.id);
      setNewListName('');
      setIsCreatingList(false);
      soundFx.playDecrypt();
      await loadTasks(token, created.id);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create task list');
    }
  };

  // Delete Task List with confirmation dialog
  const promptDeleteList = (list: GoogleTaskList) => {
    soundFx.playAlert();
    setConfirmModalState({
      isOpen: true,
      title: 'CONFIRM TASK LIST DELETION',
      description:
        'Are you sure you want to permanently delete this Google Task list and all its contained missions?',
      itemName: list.title,
      action: async () => {
        if (!token) return;
        setIsConfirmProcessing(true);
        try {
          await deleteTaskList(token, list.id);
          const remaining = taskLists.filter((l) => l.id !== list.id);
          setTaskLists(remaining);
          if (remaining.length > 0) {
            setSelectedListId(remaining[0].id);
            await loadTasks(token, remaining[0].id);
          } else {
            setSelectedListId('');
            setTasks([]);
          }
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          soundFx.playClick();
        } catch (err: any) {
          setApiError(err.message || 'Failed to delete task list');
        } finally {
          setIsConfirmProcessing(false);
        }
      },
    });
  };

  // Toggle Task Completion
  const handleToggleTaskStatus = async (task: GoogleTask) => {
    if (!token || !selectedListId) return;

    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    soundFx.playClick();

    if (nextStatus === 'completed') {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
      });
      soundFx.playDecrypt();
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completed: nextStatus === 'completed' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    try {
      await patchTask(token, selectedListId, task.id, {
        status: nextStatus,
      });
    } catch (err: any) {
      console.error('Failed to update task:', err);
      // Revert on error
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      setApiError(err.message || 'Failed to update task status in Google Tasks');
    }
  };

  // Delete Task with mandatory confirmation dialog
  const promptDeleteTask = (task: GoogleTask) => {
    soundFx.playAlert();
    setConfirmModalState({
      isOpen: true,
      title: 'CONFIRM TASK DELETION',
      description:
        'Are you sure you want to permanently delete this task from Google Tasks? This action cannot be undone.',
      itemName: task.title,
      action: async () => {
        if (!token || !selectedListId) return;
        setIsConfirmProcessing(true);
        try {
          await deleteTask(token, selectedListId, task.id);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          soundFx.playClick();
        } catch (err: any) {
          setApiError(err.message || 'Failed to delete task');
        } finally {
          setIsConfirmProcessing(false);
        }
      },
    });
  };

  // Clear Completed with mandatory confirmation dialog
  const promptClearCompleted = () => {
    soundFx.playAlert();
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    if (completedCount === 0) return;

    setConfirmModalState({
      isOpen: true,
      title: 'CLEAR COMPLETED TASKS',
      description: `Are you sure you want to clear ${completedCount} completed task(s) from this Google Tasks list?`,
      action: async () => {
        if (!token || !selectedListId) return;
        setIsConfirmProcessing(true);
        try {
          await clearCompletedTasks(token, selectedListId);
          setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          soundFx.playClick();
        } catch (err: any) {
          setApiError(err.message || 'Failed to clear completed tasks');
        } finally {
          setIsConfirmProcessing(false);
        }
      },
    });
  };

  // Handle Edit Task Save
  const handleSaveEdit = async () => {
    if (!token || !selectedListId || !editingTask) return;
    soundFx.playClick();

    try {
      const updated = await patchTask(token, selectedListId, editingTask.id, {
        title: editTitle.trim(),
        notes: editNotes.trim(),
        due: editDue ? new Date(`${editDue}T00:00:00.000Z`).toISOString() : undefined,
      });

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      setEditingTask(null);
      soundFx.playDecrypt();
    } catch (err: any) {
      setApiError(err.message || 'Failed to update task details');
    }
  };

  // Seed sample missions if list is empty
  const handleSeedTacticalTasks = async () => {
    if (!token || !selectedListId) return;
    soundFx.playClick();
    setIsLoadingTasks(true);

    try {
      const sampleMissions = [
        {
          title: '[CRITICAL] Geofence Intercept: Victor "Apex" Vance',
          notes: 'DID: did:aegis:subj-001\nSector: Rail Transit Corridor 1A\nBiometric Match: 99.4%\nAction: Dispatch tactical response unit to Charter Gate 4.',
          due: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          title: '[SURVEILLANCE] Biometric Attestation: Anton Chen',
          notes: 'DID: did:aegis:subj-002\nSighting: Financial District ATM\nAction: Verify SWIFT token intercept and check ATM neural CCTV feed.',
          due: new Date(Date.now() + 172800000).toISOString(),
        },
        {
          title: '[AUDIT] Verify Merkle DAG Block #14082 Anchor',
          notes: 'Cryptographic attestation: Recalculate BLAKE2b root and verify Ed25519 node relay signatures across all 18 mesh nodes.',
          due: new Date(Date.now() + 259200000).toISOString(),
        },
      ];

      for (const m of sampleMissions) {
        const created = await createTask(token, selectedListId, m);
        setTasks((prev) => [created, ...prev]);
      }
      soundFx.playDecrypt();
    } catch (err: any) {
      setApiError(err.message || 'Failed to seed sample missions');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Toggle Note expansion
  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (filterStatus === 'ACTIVE' && task.status === 'completed') return false;
      if (filterStatus === 'COMPLETED' && task.status !== 'completed') return false;
      if (filterStatus === 'DUE_SOON') {
        if (!task.due || task.status === 'completed') return false;
        const dueTime = new Date(task.due).getTime();
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (dueTime - now > threeDaysMs) return false;
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNotes = (task.notes || '').toLowerCase().includes(q);
      return matchTitle || matchNotes;
    });
  }, [tasks, filterStatus, searchQuery]);

  const activeCount = useMemo(() => tasks.filter((t) => t.status !== 'completed').length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner / Auth Bar */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-900/60 to-cyan-900/40 border border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  GOOGLE TASKS // TACTICAL DIRECTIVES GRID
                </h2>
                {user && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SYNC ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Synchronize supervision directives, warrants, and investigative missions directly with your Google Tasks account.
              </p>
            </div>
          </div>

          {/* User Sign-In Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-cyan-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-white font-semibold text-[11px] truncate max-w-[150px]">
                    {user.displayName || user.email}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate max-w-[150px]">
                    {user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Sign out of Google Tasks"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button"
                title="Sign in with Google to sync tasks"
              >
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block', width: 18, height: 18 }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </div>
                <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Banners */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700 text-xs text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-red-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {apiError && (
          <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-700 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              type="button"
              onClick={() => setApiError(null)}
              className="text-amber-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Unauthenticated Onboarding State */}
        {!user && (
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950 border border-cyan-900/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-600/60 text-cyan-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-white">
                AUTHORIZE GOOGLE TASKS SYNCHRONIZATION
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your account to dispatch tactical orders, mark mission milestones, and track fugitive apprehension tasks in real time across mobile and web.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button scale-105"
              >
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block', width: 20, height: 20 }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </div>
                <span>{isAuthenticating ? 'Connecting...' : 'Connect with Google Tasks'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Task Grid if Authenticated */}
      {user && (
        <div className="space-y-6">
          {/* TASK LIST SELECTION & CONTROLS */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">GOOGLE TASK LISTS:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {taskLists.map((list) => (
                    <div key={list.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleSelectList(list.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                          selectedListId === list.id
                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-1 ring-blue-400'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{list.title}</span>
                        {taskLists.length > 1 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteList(list);
                            }}
                            className="p-0.5 rounded text-slate-400 hover:text-red-300 hover:bg-slate-800/80 transition-colors"
                            title="Delete this task list"
                          >
                            <Trash2 className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Create List Toggle */}
                {!isCreatingList ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setIsCreatingList(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>New List</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreateList} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name..."
                      className="px-2.5 py-1 bg-slate-900 border border-cyan-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingList(false)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Refresh Tasks Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    if (token && selectedListId) loadTasks(token, selectedListId);
                  }}
                  disabled={isLoadingTasks}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
                  title="Refresh tasks from Google Tasks"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                </button>

                {/* Create Directive Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsCreateModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Directive</span>
                </button>
              </div>
            </div>

            {/* SEARCH & STATUS FILTERS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tactical tasks by title or notes..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterStatus === 'ALL'
                      ? 'bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('ACTIVE')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterStatus === 'ACTIVE'
                      ? 'bg-amber-950 border border-amber-600 text-amber-300 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('COMPLETED')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterStatus === 'COMPLETED'
                      ? 'bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Completed ({completedCount})
                </button>

                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={promptClearCompleted}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/60 border border-red-900 hover:border-red-700 text-red-300 hover:text-white transition-all cursor-pointer text-xs"
                    title="Clear all completed tasks"
                  >
                    Clear Done
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TASK ITEMS LIST */}
          <div className="space-y-3">
            {isLoadingTasks ? (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-950/60 space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
                <div className="text-xs font-bold text-white">SYNCING WITH GOOGLE TASKS CLOUD...</div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-950/60 space-y-4">
                <ListTodo className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">NO TASKS FOUND IN THIS VIEW</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery
                      ? `No missions matched "${searchQuery}".`
                      : 'You currently have no tasks in this Google Tasks list.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setIsCreateModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-lg"
                  >
                    + Create First Directive
                  </button>
                  <button
                    type="button"
                    onClick={handleSeedTacticalTasks}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-600 text-cyan-300 font-semibold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Populate Sample Operations</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isExpanded = expandedTaskIds.has(task.id);
                const hasDue = Boolean(task.due);
                const isDueOverdue =
                  hasDue && !isCompleted && new Date(task.due!).getTime() < Date.now();

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-slate-950/60 border-slate-800/80 opacity-70'
                        : isDueOverdue
                        ? 'bg-slate-950 border-red-900/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 shadow-md'
                    }`}
                  >
                    <div className="p-4 sm:p-4.5 flex items-start gap-3.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`mt-0.5 p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-slate-500 hover:text-cyan-400'
                        }`}
                        title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 fill-emerald-950/80" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isCompleted
                                ? 'line-through text-slate-500'
                                : 'text-white'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Badges */}
                          <div className="flex items-center gap-2 shrink-0">
                            {hasDue && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                  isCompleted
                                    ? 'bg-slate-900 text-slate-500 border border-slate-800'
                                    : isDueOverdue
                                    ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(task.due!).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {isCompleted ? 'COMPLETED' : 'PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Notes Preview / Full */}
                        {task.notes && (
                          <div className="pt-1">
                            <p
                              className={`text-xs text-slate-400 whitespace-pre-line leading-relaxed ${
                                !isExpanded ? 'line-clamp-2' : ''
                              }`}
                            >
                              {task.notes}
                            </p>
                            {task.notes.length > 80 && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(task.id)}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1 cursor-pointer font-bold"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Collapse Details</span>
                                    <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Expand Tactical Brief</span>
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setEditingTask(task);
                            setEditTitle(task.title);
                            setEditNotes(task.notes || '');
                            setEditDue(
                              task.due ? new Date(task.due).toISOString().split('T')[0] : ''
                            );
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Edit task in Google Tasks"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDeleteTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Delete task from Google Tasks"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE DIRECTIVE */}
      <CreateDirectiveModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          if (onClearPendingDirectiveSubject) onClearPendingDirectiveSubject();
        }}
        taskLists={taskLists}
        selectedListId={selectedListId}
        onCreateTask={async (listId, taskData) => {
          if (!token) return;
          const created = await createTask(token, listId, taskData);
          if (listId === selectedListId) {
            setTasks((prev) => [created, ...prev]);
          }
          confetti({ particleCount: 25, spread: 40 });
        }}
        prefilledSubject={pendingDirectiveSubject}
      />

      {/* MODAL: EDIT TASK */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>EDIT GOOGLE TASK DIRECTIVE</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Title:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Tactical Notes:
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Due Date:</label>
                <input
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS (MANDATORY REQUIREMENT) */}
      <ConfirmActionModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        description={confirmModalState.description}
        itemName={confirmModalState.itemName}
        onConfirm={confirmModalState.action}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
        isProcessing={isConfirmProcessing}
      />
    </div>
  );
};
