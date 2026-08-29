import React from 'react';
import { ActiveAlertLog, TrackedSubject } from '../../types';
import { AlertTriangle, ShieldAlert, CheckCircle2, MapPin, Zap, Lock, Send, Car, Radio } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface ActiveAlertsPanelProps {
  alerts: ActiveAlertLog[];
  subjects: TrackedSubject[];
  onSelectSubject: (subject: TrackedSubject) => void;
  onResolveAlert: (alertId: string) => void;
  onDispatchAlert?: (subject: TrackedSubject, alert: ActiveAlertLog) => void;
}

export const ActiveAlertsPanel: React.FC<ActiveAlertsPanelProps> = ({
  alerts,
  subjects,
  onSelectSubject,
  onResolveAlert,
  onDispatchAlert,
}) => {
  const unresolvedAlerts = alerts.filter((a) => !a.isResolved);

  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="p-1.5 rounded bg-red-950 border border-red-700 text-red-400">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </span>
          AUTOMATED ALERT & CONTAINMENT INCIDENT QUEUE
        </h3>
        <span className="text-xs px-2 py-0.5 rounded bg-red-600/30 border border-red-500 text-red-300 font-bold">
          {unresolvedAlerts.length} ACTIVE INCIDENTS
        </span>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {unresolvedAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>All secure sectors nominal. No active unauthorized movement protocols.</span>
          </div>
        ) : (
          unresolvedAlerts.map((alt) => {
            const sub = subjects.find((s) => s.id === alt.subjectId);
            return (
              <div
                key={alt.id}
                className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/80 text-xs space-y-2 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-300 text-xs tracking-wide">
                        {alt.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold animate-pulse">
                        {alt.severity}
                      </span>
                    </div>

                    <div className="text-slate-300 font-semibold">
                      Subject: {alt.subjectName}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{alt.locationDetails}</span>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded border border-red-900/60 mt-1">
                      {alt.details}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {sub && onDispatchAlert && (
                      <button
                        onClick={() => {
                          soundFx.playRadioChirp();
                          onDispatchAlert(sub, alt);
                        }}
                        className="px-2.5 py-1.5 rounded bg-red-600 border border-red-400 text-white hover:bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all text-[11px] font-bold cursor-pointer flex items-center gap-1.5"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Dispatch Police</span>
                      </button>
                    )}

                    {sub && (
                      <button
                        onClick={() => {
                          soundFx.playLockOn();
                          onSelectSubject(sub);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-colors text-[11px] font-bold cursor-pointer"
                      >
                        Target Lock
                      </button>
                    )}

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onResolveAlert(alt.id);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700 transition-colors text-[11px] cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
