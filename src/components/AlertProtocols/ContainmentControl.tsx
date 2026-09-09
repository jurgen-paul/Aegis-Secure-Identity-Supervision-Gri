import React from 'react';
import { AutomatedAlertRule, ActiveAlertLog, TrackedSubject } from '../../types';
import { ShieldAlert, AlertTriangle, Lock, Unlock, Radio, BellRing, CheckCircle, Zap, Bot, Volume2 } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface ContainmentControlProps {
  rules: AutomatedAlertRule[];
  alerts: ActiveAlertLog[];
  subjects: TrackedSubject[];
  isLockdownActive: boolean;
  onToggleLockdown: () => void;
  onSimulateBreach: () => void;
  onRequestAlertFeedback?: (alert: ActiveAlertLog) => void;
}

export const ContainmentControl: React.FC<ContainmentControlProps> = ({
  rules,
  alerts,
  subjects,
  isLockdownActive,
  onToggleLockdown,
  onSimulateBreach,
  onRequestAlertFeedback,
}) => {
  return (
    <div className="space-y-6 font-mono">
      {/* Header Banner */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-600 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AUTOMATED ALERT & CONTAINMENT MATRIX
                <span className="text-xs px-2 py-0.5 rounded bg-red-950 border border-red-600 text-red-300">
                  AUTONOMOUS DISPATCH
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous protocols for unauthorized movement, geofence breaches, and multi-vector threat escalation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateBreach}
              className="px-3.5 py-2 rounded-lg bg-amber-950 border border-amber-600 text-amber-300 hover:bg-amber-900 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulate Geofence Breach</span>
            </button>

            <button
              onClick={onToggleLockdown}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isLockdownActive
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-slate-900 border border-red-800 text-red-300 hover:bg-red-950'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{isLockdownActive ? 'DISENGAGE LOCKDOWN' : 'ENGAGE NODE LOCKDOWN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Alerts with AI Feedback & Voice Talkback */}
      {alerts.length > 0 && (
        <div className="rounded-xl bg-slate-950 border border-amber-800/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Active Threat Alerts ({alerts.length})
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300">
              TACTICAL AI MONITORING ARMED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-700/80 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {al.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                    {al.severity}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                  <p>Type: <span className="text-cyan-300">{al.type}</span></p>
                  <p>Zone: <span className="text-slate-300">{al.locationDetails || 'Perimeter Sector'}</span></p>
                  <p>Timestamp: <span className="text-slate-400">{al.timestamp}</span></p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Ask AI for Feedback */}
                  {onRequestAlertFeedback && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        onRequestAlertFeedback(al);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-950/70 border border-purple-700 text-purple-300 hover:bg-purple-900 flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ask AI for Feedback</span>
                    </button>
                  )}

                  {/* Voice Broadcast Alert */}
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playAlarm();
                      soundFx.speakVoice(`Security Alert: ${al.title}. Severity: ${al.severity}. Location: ${al.locationDetails || 'Perimeter Sector'}. Immediate containment required.`);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-600 flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors"
                    title="Broadcast Alert Audio Over Radio"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Voice Announce</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BellRing className="w-4 h-4 text-cyan-400" />
            Active Containment & Trigger Rules
          </h3>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-cyan-700/60 transition-colors text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{rule.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                      {rule.severity}
                    </span>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {rule.isActive ? 'RULE ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  TRIGGER: {rule.condition}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Notifies: {rule.notifyNodes.join(', ')}</span>
                  <span>Triggered: {rule.triggerCount} times</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Containment Protocols Description */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Lockdown Escalation Tiers
          </h3>

          <div className="space-y-3 text-[11px]">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-bold">TIER 1: PASSIVE SUPERVISION</span>
              <p className="text-slate-400">Continuous telemetry logging, Merkle DAG block confirmation, ambient CCTV landmark scans.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-amber-800/80 space-y-1">
              <span className="text-amber-400 font-bold">TIER 2: TARGET ACQUISITION (AMBER)</span>
              <p className="text-slate-400">Flagged POS transaction or approaching geofence boundary activates optical camera auto-tracking.</p>
            </div>

            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 space-y-1">
              <span className="text-red-400 font-bold">TIER 3: SECTOR LOCKDOWN (CODE RED)</span>
              <p className="text-slate-300">Automated turnstile barrier lock, beacon intercept dispatch, broadcast of encrypted red-notice vectors.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
