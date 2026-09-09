import React, { useState } from 'react';
import { ActiveAlertLog, TrackedSubject, PoliceStation, ThreatDispatchPacket, AlertPriority } from '../../types';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Car,
  Radio,
  Clock,
  Navigation,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Flame,
  Filter,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { POLICE_STATIONS } from '../../lib/mockData';
import {
  findNearestPoliceStation,
  calculateDistanceMeters,
  calculateResponseEtaMinutes,
  speakTacticalRadio,
  sendThreatToDispatcher,
} from '../../lib/dispatch';

interface ActiveAlertsPanelProps {
  alerts: ActiveAlertLog[];
  subjects: TrackedSubject[];
  onSelectSubject: (subject: TrackedSubject) => void;
  onResolveAlert: (alertId: string) => void;
  onDispatchAlert?: (subject: TrackedSubject, alert: ActiveAlertLog) => void;
  onDispatchComplete?: (packet: ThreatDispatchPacket, alert: ActiveAlertLog) => void;
}

interface DispatchSimulationState {
  alertId: string;
  step: 'IDLE' | 'TRIANGULATING' | 'ENCRYPTING' | 'TRANSMITTING' | 'CONFIRMED';
  progressText: string;
  station: PoliceStation;
  packet?: ThreatDispatchPacket;
}

export const ActiveAlertsPanel: React.FC<ActiveAlertsPanelProps> = ({
  alerts,
  subjects,
  onSelectSubject,
  onResolveAlert,
  onDispatchAlert,
  onDispatchComplete,
}) => {
  const unresolvedAlerts = alerts.filter((a) => !a.isResolved);
  const [activeSimulations, setActiveSimulations] = useState<Record<string, DispatchSimulationState>>({});
  const [expandedTransmissions, setExpandedTransmissions] = useState<Record<string, boolean>>({});
  const [speakingAlertId, setSpeakingAlertId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'ADVISORY'>('ALL');

  // Classification helper to determine priority level for any alert
  const getAlertPriority = (alert: ActiveAlertLog): AlertPriority => {
    if (alert.priorityLevel) return alert.priorityLevel;
    if (alert.severity === 'CRITICAL_CODE_RED' || alert.severity === 'HIGH') {
      return 'CRITICAL';
    }
    return 'ADVISORY';
  };

  const criticalCount = unresolvedAlerts.filter((a) => getAlertPriority(a) === 'CRITICAL').length;
  const advisoryCount = unresolvedAlerts.filter((a) => getAlertPriority(a) === 'ADVISORY').length;

  // Filtered alerts according to priority toggle selection
  const displayedAlerts = unresolvedAlerts.filter((a) => {
    if (priorityFilter === 'ALL') return true;
    return getAlertPriority(a) === priorityFilter;
  });

  const handleTogglePriority = (priority: 'CRITICAL' | 'ADVISORY') => {
    soundFx.playClick();
    if (priorityFilter === priority) {
      // Toggling the active priority off reverts to displaying all alerts
      setPriorityFilter('ALL');
    } else {
      // Toggle to viewing chosen priority level independently
      setPriorityFilter(priority);
    }
  };

  const handleSelectAll = () => {
    soundFx.playClick();
    setPriorityFilter('ALL');
  };

  // Helper to trigger rapid response dispatch simulation
  const handleDispatchRapidResponse = async (alert: ActiveAlertLog, subject?: TrackedSubject) => {
    soundFx.playPoliceSiren();

    // Default subject fallback if not found
    const targetSubject = subject || subjects[0];
    const nearestStation = findNearestPoliceStation(targetSubject.currentLocation, POLICE_STATIONS);

    // Initialize simulation state
    setActiveSimulations((prev) => ({
      ...prev,
      [alert.id]: {
        alertId: alert.id,
        step: 'TRIANGULATING',
        progressText: `Triangulating incident coordinates (${targetSubject.currentLocation.lat.toFixed(5)}° N, ${targetSubject.currentLocation.lng.toFixed(5)}° E)...`,
        station: nearestStation,
      },
    }));

    await new Promise((r) => setTimeout(r, 600));

    // Step 2: Encrypting payload
    setActiveSimulations((prev) => ({
      ...prev,
      [alert.id]: {
        alertId: alert.id,
        step: 'ENCRYPTING',
        progressText: `Targeting closest precinct: ${nearestStation.callsign} (${nearestStation.distanceMeters || 120}m, ETA ~${nearestStation.etaMinutes || 1} min). Sealing biometric vector...`,
        station: nearestStation,
      },
    }));

    await new Promise((r) => setTimeout(r, 700));

    // Step 3: Transmitting over TETRA C2000 / CAD
    setActiveSimulations((prev) => ({
      ...prev,
      [alert.id]: {
        alertId: alert.id,
        step: 'TRANSMITTING',
        progressText: `Transmitting CAD 10-33 emergency dispatch to ${nearestStation.name} on ${nearestStation.radioFrequency}...`,
        station: nearestStation,
      },
    }));

    try {
      const packet = await sendThreatToDispatcher({
        subject: targetSubject,
        alert,
        targetStation: nearestStation,
        channel: 'TETRA_C2000_POLICE_NET',
        priority: 'PRIORITY_1_CODE_RED',
      });

      soundFx.playDispatchSent();

      setActiveSimulations((prev) => ({
        ...prev,
        [alert.id]: {
          alertId: alert.id,
          step: 'CONFIRMED',
          progressText: `✓ DISPATCH TRANSMITTED & ACKNOWLEDGED BY CAD TERMINAL [${packet.acknowledgedByOfficerCallsign}]`,
          station: nearestStation,
          packet,
        },
      }));

      // Automatically expand transmission details
      setExpandedTransmissions((prev) => ({ ...prev, [alert.id]: true }));

      if (onDispatchComplete) {
        onDispatchComplete(packet, alert);
      }
    } catch (err) {
      console.error('Dispatch simulation error:', err);
    }
  };

  const handleToggleVoice = (alertId: string, transcript: string) => {
    if (speakingAlertId === alertId) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingAlertId(null);
    } else {
      setSpeakingAlertId(alertId);
      speakTacticalRadio(transcript, () => {
        setSpeakingAlertId(null);
      });
    }
  };

  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 md:p-5 space-y-4 font-mono">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-red-950/80 border border-red-600 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AUTOMATED ALERT & RAPID LAW ENFORCEMENT DISPATCH
            </h3>
            <p className="text-[11px] text-slate-400">
              Autonomous incident geofencing with one-click direct CAD dispatch to nearest police precinct coordinates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-red-600/20 border border-red-500 text-red-300 font-bold flex items-center gap-1.5 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>{unresolvedAlerts.length} ACTIVE INCIDENTS</span>
          </span>
        </div>
      </div>

      {/* Tactical Priority Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 shadow-inner">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold tracking-wide">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>PRIORITY FILTER:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800/90 p-1 rounded-lg">
            {/* View All */}
            <button
              id="alert-filter-all-btn"
              onClick={handleSelectAll}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                priorityFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Show all active incident alerts"
            >
              <span>ALL</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                priorityFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {unresolvedAlerts.length}
              </span>
            </button>

            {/* Toggle Critical Independently */}
            <button
              id="alert-filter-critical-btn"
              onClick={() => handleTogglePriority('CRITICAL')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                priorityFilter === 'CRITICAL'
                  ? 'bg-red-950 text-red-100 border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'text-slate-400 hover:text-red-300 border border-transparent hover:bg-red-950/30'
              }`}
              title="Toggle viewing Critical level alerts independently"
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${priorityFilter === 'CRITICAL' ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
              <span>CRITICAL</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                priorityFilter === 'CRITICAL'
                  ? 'bg-red-900 border border-red-600 text-red-100'
                  : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}>
                {criticalCount}
              </span>
            </button>

            {/* Toggle Advisory Independently */}
            <button
              id="alert-filter-advisory-btn"
              onClick={() => handleTogglePriority('ADVISORY')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                priorityFilter === 'ADVISORY'
                  ? 'bg-amber-950 text-amber-100 border border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-amber-300 border border-transparent hover:bg-amber-950/30'
              }`}
              title="Toggle viewing Advisory level alerts independently"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${priorityFilter === 'ADVISORY' ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>ADVISORY</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                priorityFilter === 'ADVISORY'
                  ? 'bg-amber-900 border border-amber-600 text-amber-100'
                  : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}>
                {advisoryCount}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Status / Independent View Indicator */}
        <div className="flex items-center gap-2 text-[11px]">
          {priorityFilter !== 'ALL' ? (
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 ${
                priorityFilter === 'CRITICAL'
                  ? 'bg-red-950/80 border-red-600 text-red-300'
                  : 'bg-amber-950/80 border-amber-600 text-amber-300'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                <span>Viewing {priorityFilter} Alerts Independently ({displayedAlerts.length})</span>
              </span>
              <button
                onClick={handleSelectAll}
                className="text-cyan-400 hover:text-cyan-300 text-[10px] underline cursor-pointer"
              >
                Reset to All
              </button>
            </div>
          ) : (
            <span className="text-slate-500 text-[10px] hidden sm:flex items-center gap-1">
              <span>Displaying all priority tiers ({unresolvedAlerts.length} total)</span>
            </span>
          )}
        </div>
      </div>

      {/* Unresolved Incident List */}
      <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
        {displayedAlerts.length === 0 ? (
          unresolvedAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-400 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-900/40 border border-emerald-900/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-bold">All secure sectors nominal.</span>
              <span className="text-slate-500 text-[11px]">No active geofence breaches or unauthorized transit departures.</span>
            </div>
          ) : priorityFilter === 'CRITICAL' ? (
            <div className="p-8 text-center text-xs text-slate-300 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-900/40 border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-bold text-white">No Active Critical Level Incidents</span>
              <span className="text-slate-400 text-[11px]">No active geofence boundary breaches or high-threat Code Red events.</span>
              {advisoryCount > 0 && (
                <button
                  onClick={() => handleTogglePriority('ADVISORY')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-700 text-amber-300 text-xs font-bold hover:bg-amber-900 cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Toggle to Advisory Incidents ({advisoryCount})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-300 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-900/40 border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-bold text-white">No Active Advisory Level Incidents</span>
              <span className="text-slate-400 text-[11px]">All secondary telemetry and sensor node correlation metrics are within normal variance.</span>
              {criticalCount > 0 && (
                <button
                  onClick={() => handleTogglePriority('CRITICAL')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-700 text-red-300 text-xs font-bold hover:bg-red-900 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Toggle to Critical Incidents ({criticalCount})</span>
                </button>
              )}
            </div>
          )
        ) : (
          displayedAlerts.map((alt) => {
            const sub = subjects.find((s) => s.id === alt.subjectId) || subjects[0];
            const sim = activeSimulations[alt.id];
            const isDispatched = alt.dispatchedToStationId || sim?.step === 'CONFIRMED';
            const isSimulating = sim && sim.step !== 'IDLE' && sim.step !== 'CONFIRMED';
            const nearestStation = sim?.station || findNearestPoliceStation(sub.currentLocation, POLICE_STATIONS);
            const isExpanded = expandedTransmissions[alt.id];
            const priority = getAlertPriority(alt);
            const isCritical = priority === 'CRITICAL';

            return (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border text-xs space-y-3 relative overflow-hidden transition-all ${
                  isDispatched
                    ? 'bg-emerald-950/20 border-emerald-700/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : isCritical
                    ? 'bg-red-950/25 border-red-800/80 hover:border-red-600/90 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : 'bg-amber-950/20 border-amber-800/80 hover:border-amber-600/90 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                }`}
              >
                {/* Top Alert Status Bar */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-bold text-xs tracking-wide ${isCritical ? 'text-red-300' : 'text-amber-200'}`}>
                        {alt.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                        isCritical
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      }`}>
                        {isCritical ? (
                          <>
                            <ShieldAlert className="w-3 h-3" />
                            <span>CRITICAL // {alt.severity}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>ADVISORY // {alt.severity}</span>
                          </>
                        )}
                      </span>
                      {isDispatched && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/90 border border-emerald-500 text-emerald-200 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          LAW ENFORCEMENT DISPATCHED
                        </span>
                      )}
                    </div>

                    <div className="text-slate-200 font-semibold flex items-center gap-2">
                      <span>Target: {alt.subjectName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-cyan-400 font-mono text-[11px]">[{sub.alias}]</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-emerald-400 text-[11px]">Match: {sub.biometrics.faceMatchScore}%</span>
                    </div>

                    <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{alt.locationDetails}</span>
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        GPS: {sub.currentLocation.lat.toFixed(5)}°N, {sub.currentLocation.lng.toFixed(5)}°E
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 mt-1.5 leading-relaxed">
                      {alt.details}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                    {/* The Primary Dispatch Rapid Response Button */}
                    <button
                      onClick={() => handleDispatchRapidResponse(alt, sub)}
                      disabled={isSimulating}
                      className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                        isSimulating
                          ? 'bg-amber-600 text-white border border-amber-400 animate-pulse'
                          : isDispatched
                          ? 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : isCritical
                          ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                          : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      }`}
                    >
                      {isSimulating ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Car className="w-4 h-4 text-white" />
                      )}
                      <span>
                        {isSimulating
                          ? 'DISPATCHING...'
                          : isDispatched
                          ? 'Re-Dispatch Units'
                          : isCritical
                          ? 'Dispatch Rapid Response'
                          : 'Dispatch Law Enforcement'}
                      </span>
                    </button>

                    {/* Target Lock on Tactical Map */}
                    {sub && (
                      <button
                        onClick={() => {
                          soundFx.playLockOn();
                          onSelectSubject(sub);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950/90 border border-cyan-600 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-colors text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Target Lock</span>
                      </button>
                    )}

                    {/* Open Tactical Modal / Advanced Dispatch Console */}
                    {onDispatchAlert && sub && (
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          onDispatchAlert(sub, alt);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-[11px] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Radio className="w-3.5 h-3.5 text-purple-400" />
                        <span>CAD Console</span>
                      </button>
                    )}

                    {/* Acknowledge / Resolve Alert */}
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onResolveAlert(alt.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700 transition-colors text-[11px] cursor-pointer text-center"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>

                {/* Real-time Law Enforcement Dispatch Coordinates HUD */}
                <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Nearest Law Enforcement Coordinates:</span>
                      <span className="text-blue-300 font-bold">{nearestStation.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 border border-blue-700 text-blue-300 font-mono">
                        {nearestStation.callsign}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {nearestStation.distanceMeters ? `${nearestStation.distanceMeters}m` : '~150m'}
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA ~{nearestStation.etaMinutes || 1} min
                      </span>
                      <span className="text-cyan-400 text-[10px] font-mono">
                        {nearestStation.lat.toFixed(5)}°N, {nearestStation.lng.toFixed(5)}°E
                      </span>
                    </div>
                  </div>

                  {/* Active Simulation Step Indicator */}
                  {sim && sim.step !== 'IDLE' && (
                    <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>{sim.progressText}</span>
                        </span>
                        {sim.packet && (
                          <span className="text-emerald-400 font-bold text-[10px]">
                            CAD REF: {sim.packet.dispatchId}
                          </span>
                        )}
                      </div>

                      {/* Transmission Progress Bar */}
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            sim.step === 'TRIANGULATING'
                              ? 'w-1/3 bg-amber-500'
                              : sim.step === 'ENCRYPTING'
                              ? 'w-2/3 bg-blue-500'
                              : sim.step === 'TRANSMITTING'
                              ? 'w-5/6 bg-purple-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Dispatched Packet Summary & Voice Callout */}
                  {(sim?.packet || isDispatched) && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setExpandedTransmissions((prev) => ({
                              ...prev,
                              [alt.id]: !prev[alt.id],
                            }));
                          }}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isExpanded ? 'Hide Police Radio Dossier' : 'View Police Radio Transmission Dossier'}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            handleToggleVoice(
                              alt.id,
                              sim?.packet?.tacticalRadioTranscript ||
                                `CAD EMERGENCY DISPATCH. SUBJECT ${sub.fullName.toUpperCase()} FLAGGED AT ${alt.locationDetails.toUpperCase()}. DEPLOY IMMEDIATE PERIMETER CORDON TO INTERCEPT.`
                            )
                          }
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            speakingAlertId === alt.id
                              ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                              : 'bg-slate-900 border-slate-700 text-cyan-300 hover:bg-slate-800'
                          }`}
                        >
                          {speakingAlertId === alt.id ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                          )}
                          <span>
                            {speakingAlertId === alt.id ? 'Stop Voice Broadcast' : 'Hear Police Radio Voice'}
                          </span>
                        </button>
                      </div>

                      {/* Expandable Police Radio Transcript */}
                      {isExpanded && (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 space-y-2 font-mono">
                          <div className="text-slate-400 text-[10px] font-bold flex items-center justify-between">
                            <span>APCO-10 STANDARDIZED POLICE RADIO CALLOUT:</span>
                            <span className="text-emerald-400">STATUS: TRANSMITTED (TETRA C2000)</span>
                          </div>

                          <p className="p-2 rounded bg-slate-900/90 border border-slate-800/80 leading-relaxed text-slate-200 text-[11px]">
                            {sim?.packet?.tacticalRadioTranscript ||
                              `[CAD DISPATCH ALL SECTOR UNITS - 10-33 EMERGENCY TRAFFIC]\nTRANSMITTING TO: ${nearestStation.name.toUpperCase()} [${nearestStation.callsign}]\nSUBJECT: ${sub.fullName.toUpperCase()} (ALIAS: ${sub.alias})\nLOCATION: ${alt.locationDetails.toUpperCase()} (LAT: ${sub.currentLocation.lat.toFixed(5)}, LNG: ${sub.currentLocation.lng.toFixed(5)})\nDIRECTIVE: DEPLOY CORDON INTERCEPT UNITS IMMEDIATELY.`}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1">
                            <span>Assigned Units: {sim?.packet?.assignedPatrolUnits.join(', ') || `${nearestStation.callsign}-PATROL-01, ${nearestStation.callsign}-K9`}</span>
                            <span>CAD Acknowledged: {sim?.packet?.acknowledgedByOfficerCallsign || `${nearestStation.callsign}-DISPATCH`}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
