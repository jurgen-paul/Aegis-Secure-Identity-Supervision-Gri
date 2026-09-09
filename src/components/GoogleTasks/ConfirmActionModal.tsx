import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  description,
  itemName,
  confirmLabel = 'Delete from Google Tasks',
  danger = true,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="relative w-full max-w-md bg-slate-950 border border-red-900/80 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.25)] text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-950/90 to-slate-950 border-b border-red-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-red-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onCancel();
            }}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 leading-relaxed">
              <p className="text-slate-300">{description}</p>
              {itemName && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-semibold break-all">
                  &ldquo;{itemName}&rdquo;
                </div>
              )}
              <p className="text-[11px] text-red-400/90 font-medium">
                This modification will immediately synchronize with your Google Tasks cloud account.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onCancel();
              }}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.playAlarm();
                onConfirm();
              }}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-lg ${
                danger
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
              }`}
            >
              {danger && <Trash2 className="w-3.5 h-3.5" />}
              <span>{isProcessing ? 'Processing...' : confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
