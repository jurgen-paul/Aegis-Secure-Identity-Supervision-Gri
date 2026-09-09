import React, { useState } from 'react';
import { GoogleTaskList } from '../../lib/googleTasks';
import { TrackedSubject, ActiveAlertLog } from '../../types';
import {
  ListTodo,
  Calendar,
  X,
  Plus,
  Shield,
  MapPin,
  Clock,
  Sparkles,
  User,
  AlertTriangle,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface CreateDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskLists: GoogleTaskList[];
  selectedListId: string;
  onCreateTask: (
    listId: string,
    taskData: { title: string; notes?: string; due?: string }
  ) => Promise<void>;
  prefilledSubject?: TrackedSubject | null;
  prefilledAlert?: ActiveAlertLog | null;
}

export const CreateDirectiveModal: React.FC<CreateDirectiveModalProps> = ({
  isOpen,
  onClose,
  taskLists,
  selectedListId,
  onCreateTask,
  prefilledSubject,
  prefilledAlert,
}) => {
  const [listId, setListId] = useState<string>(selectedListId || taskLists[0]?.id || '');
  const [title, setTitle] = useState<string>(() => {
    if (prefilledSubject) {
      return `[MISSION] Surveillance Intercept: ${prefilledSubject.fullName} (${prefilledSubject.alias})`;
    }
    if (prefilledAlert) {
      return `[ALERT DISPATCH] ${prefilledAlert.title}`;
    }
    return '';
  });

  const [notes, setNotes] = useState<string>(() => {
    if (prefilledSubject) {
      return `Target DID: ${prefilledSubject.did}
Threat Level: ${prefilledSubject.threatLevel}
Last Known Location: ${prefilledSubject.currentLocation.locationName} (Lat: ${prefilledSubject.currentLocation.lat.toFixed(4)}, Lng: ${prefilledSubject.currentLocation.lng.toFixed(4)})
Geofence Status: ${prefilledSubject.geofenceStatus}
Assigned Node: ${prefilledSubject.assignedSecureNodeId}
Biometric Score: ${(prefilledSubject.biometrics.faceMatchScore * 100).toFixed(1)}%`;
    }
    if (prefilledAlert) {
      return `Alert ID: ${prefilledAlert.id}
Severity: ${prefilledAlert.severity}
Location: ${prefilledAlert.locationDetails}
Timestamp: ${prefilledAlert.timestamp}`;
    }
    return '';
  });

  // Due date default to tomorrow
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (presetTitle: string, presetNotes: string) => {
    soundFx.playClick();
    setTitle(presetTitle);
    setNotes(presetNotes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Directive title is required');
      return;
    }
    if (!listId) {
      setError('Please select a Google Tasks list');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let rfcDueDate: string | undefined = undefined;
      if (dueDate) {
        // Google Tasks API expects RFC 3339 formatted timestamp e.g. 2026-09-06T00:00:00.000Z
        rfcDueDate = new Date(`${dueDate}T00:00:00.000Z`).toISOString();
      }

      await onCreateTask(listId, {
        title: title.trim(),
        notes: notes.trim(),
        due: rfcDueDate,
      });

      soundFx.playDecrypt();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task in Google Tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="relative w-full max-w-xl bg-slate-950 border border-cyan-700/80 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <ListTodo className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              DISPATCH DIRECTIVE TO GOOGLE TASKS
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-700 text-red-300">
              {error}
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Tactical Mission Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    '[SECURITY] Deploy Perimeter Sensor Nodes',
                    'Task: Mount mesh relay node on high-vantage tower. Validate AES-256 telemetry handshake and post-quantum Kyber key exchange.'
                  )
                }
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-600 hover:text-cyan-300 text-[11px] transition-all cursor-pointer"
              >
                + Deploy Sensor Nodes
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    '[AUDIT] Verify Merkle DAG Ledger Integrity',
                    'Task: Execute hash verification across all active audit blocks. Ensure zero tampering detected on decentralized sovereign chain.'
                  )
                }
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-600 hover:text-cyan-300 text-[11px] transition-all cursor-pointer"
              >
                + Merkle Chain Audit
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    '[INTERCEPT] Execute Biometric Cross-Verification',
                    'Task: Cross-examine iris biometric hash against Interpol Red Notice registry and local surveillance telemetry.'
                  )
                }
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-600 hover:text-cyan-300 text-[11px] transition-all cursor-pointer"
              >
                + Biometric Cross-Check
              </button>
            </div>
          </div>

          {/* Target List Selection */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300">
              Target Google Tasks List:
            </label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {taskLists.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300">
              Directive / Task Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. [MISSION] Rapid Response Intercept: Sector 4"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300">
              Tactical Description & Details (Notes):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Enter subject DID, coordinate references, officer instructions, or evidentiary criteria..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Due Date:</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Syncing to Google Tasks...' : 'Create Directive in Google Tasks'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
