import React, { useState, useMemo } from 'react';
import { TrackedSubject, BiometricAuthEvent, BiometricModality } from '../../types';
import { INITIAL_BIOMETRIC_EVENTS } from '../../lib/mockData';
import {
  Eye,
  Activity,
  Mic,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Radio,
  Clock,
  MapPin,
  Cpu,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface BiometricActivityLogProps {
  subjects: TrackedSubject[];
  selectedSubject: TrackedSubject | null;
  onSelectSubject?: (sub: TrackedSubject) => void;
}

export const BiometricActivityLog: React.FC<BiometricActivityLogProps> = ({
  subjects,
  selectedSubject,
  onSelectSubject,
}) => {
  const [events, setEvents] = useState<BiometricAuthEvent[]>(INITIAL_BIOMETRIC_EVENTS);
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<'ALL' | BiometricModality>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'AUTHENTICATED' | 'ANOMALIES_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fallback to first subject if none explicitly selected
  const activeSubject = selectedSubject || subjects[0] || null;

  // Filter events strictly for the active subject + search & filter criteria
  const subjectEvents = useMemo(() => {
    if (!activeSubject) return [];
    return events.filter((e) => e.subjectId === activeSubject.id);
  }, [events, activeSubject]);

  const filteredEvents = useMemo(() => {
    return subjectEvents.filter((evt) => {
      // Modality filter
      if (selectedModalityFilter !== 'ALL' && evt.modality !== selectedModalityFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter === 'AUTHENTICATED' && evt.status !== 'AUTHENTICATED') {
        return false;
      }
      if (
        selectedStatusFilter === 'ANOMALIES_ONLY' &&
        evt.status === 'AUTHENTICATED'
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLocation = evt.sensorLocation.toLowerCase().includes(q);
        const matchesNode = evt.sensorNodeId.toLowerCase().includes(q);
        const matchesHash = evt.signatureHash.toLowerCase().includes(q);
        const matchesProof = evt.tamperProofProofId.toLowerCase().includes(q);
        const matchesNotes = evt.notes.toLowerCase().includes(q);
        const matchesModality = evt.modality.toLowerCase().includes(q);
        if (
          !matchesLocation &&
          !matchesNode &&
          !matchesHash &&
          !matchesProof &&
          !matchesNotes &&
          !matchesModality
        ) {
          return false;
        }
      }
      return true;
    });
  }, [subjectEvents, selectedModalityFilter, selectedStatusFilter, searchQuery]);

  // Counts by modality for the active subject
  const modalityCounts = useMemo(() => {
    const iris = subjectEvents.filter((e) => e.modality === 'IRIS_SCAN').length;
    const gait = subjectEvents.filter((e) => e.modality === 'GAIT_DYNAMICS').length;
    const voice = subjectEvents.filter((e) => e.modality === 'VOICEPRINT_SIGNATURE').length;
    return {
      all: subjectEvents.length,
      iris,
      gait,
      voice,
    };
  }, [subjectEvents]);

  // Copy hash or proof ID helper
  const handleCopy = (text: string, id: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Simulate real-time sensor capture for the current subject
  const handleSimulateRealtimeScan = () => {
    if (!activeSubject) return;
    setIsSimulatingScan(true);
    soundFx.playClick();

    setTimeout(() => {
      const modalities: BiometricModality[] = ['IRIS_SCAN', 'GAIT_DYNAMICS', 'VOICEPRINT_SIGNATURE'];
      const randomModality = modalities[Math.floor(Math.random() * modalities.length)];
      const scanId = `BIO-EVT-${activeSubject.id}-${Date.now().toString().slice(-4)}`;
      const randomScore = +(94 + Math.random() * 5.8).toFixed(1);
      const isAnomaly = Math.random() < 0.25;

      let newDetails = {};
      let sensorLoc = 'Dam Square Neural Sentry Post - Optical Unit #08';
      let node = 'NODE-CCTV-01-AMS-CENTRAAL';
      let note = 'Automated real-time multi-spectral capture verified against ledger.';

      if (randomModality === 'IRIS_SCAN') {
        sensorLoc = 'Centraal Station Metro Gate #03 - Retinal Iris Scanner';
        node = 'NODE-CCTV-04-AMS-REPUBLIC';
        newDetails = {
          irisPatternSector: 'SECTOR-5-RADIAL-FURROWS',
          retinalPupilRatio: +(0.33 + Math.random() * 0.08).toFixed(2),
          livenessScore: 99.5,
          environmentalNoiseDb: 44.1,
        };
        note = isAnomaly
          ? 'Minor pupil dilation anomaly detected due to rapid illumination transition.'
          : 'High-fidelity dual-pupil iris pattern match verified via zero-knowledge proof.';
      } else if (randomModality === 'GAIT_DYNAMICS') {
        sensorLoc = 'Rokin Pedestrian Boulevard - LiDAR Kinetic Array';
        node = 'NODE-RADAR-01-AMS-DAM';
        newDetails = {
          cadenceFrequencyHz: +(1.45 + Math.random() * 0.4).toFixed(2),
          strideSymmetryPct: +(94 + Math.random() * 5.5).toFixed(1),
          accelerationProfile: 'Kinetic vector tracking normal pedestrian cadence',
          livenessScore: 98.2,
        };
        note = isAnomaly
          ? 'Gait cadence acceleration +18% indicates evasive maneuvering or hurried pacing.'
          : 'Kinetic gait stride telemetry matches calibrated baseline within 1.2% variance.';
      } else {
        sensorLoc = 'Dam Square Public Kiosk - Acoustic Array Intercom';
        node = 'NODE-RELAY-01-AMS';
        newDetails = {
          harmonicPitchHz: +(140 + Math.random() * 90).toFixed(1),
          spectralResonanceDb: +(35 + Math.random() * 12).toFixed(1),
          formantFrequencies: [
            Math.round(600 + Math.random() * 200),
            Math.round(1600 + Math.random() * 350),
            Math.round(2600 + Math.random() * 300),
            Math.round(3400 + Math.random() * 250),
          ],
          livenessScore: 98.8,
          environmentalNoiseDb: 52.4,
        };
        note = isAnomaly
          ? 'Elevated formant frequency pitch indicates psychological stress during interrogation.'
          : 'Acoustic vocal harmonics verified against encrypted biometric sovereign token.';
      }

      const newEvent: BiometricAuthEvent = {
        id: scanId,
        subjectId: activeSubject.id,
        subjectDid: activeSubject.did,
        timestamp: new Date().toISOString(),
        modality: randomModality,
        sensorNodeId: node,
        sensorLocation: sensorLoc,
        matchScore: isAnomaly ? 86.4 : randomScore,
        status: isAnomaly ? 'ANOMALY_DETECTED' : 'AUTHENTICATED',
        signatureHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        details: newDetails,
        tamperProofProofId: `PROOF-ED25519-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: note,
      };

      setEvents((prev) => [newEvent, ...prev]);
      setExpandedEventId(scanId);
      setIsSimulatingScan(false);
      soundFx.playDecrypt();
    }, 900);
  };

  const getModalityBadge = (modality: BiometricModality) => {
    switch (modality) {
      case 'IRIS_SCAN':
        return {
          label: 'IRIS PATTERN SCAN',
          icon: <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
          color: 'bg-cyan-950/80 border-cyan-700/80 text-cyan-300',
          indicator: 'bg-cyan-400',
        };
      case 'GAIT_DYNAMICS':
        return {
          label: 'GAIT KINETIC DYNAMICS',
          icon: <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          color: 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300',
          indicator: 'bg-emerald-400',
        };
      case 'VOICEPRINT_SIGNATURE':
        return {
          label: 'VOICEPRINT ACOUSTIC SIGNATURE',
          icon: <Mic className="w-3.5 h-3.5 text-violet-400 shrink-0" />,
          color: 'bg-violet-950/80 border-violet-700/80 text-violet-300',
          indicator: 'bg-violet-400',
        };
      default:
        return {
          label: 'FACIAL VECTOR MESH',
          icon: <Fingerprint className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
          color: 'bg-blue-950/80 border-blue-700/80 text-blue-300',
          indicator: 'bg-blue-400',
        };
    }
  };

  const getStatusBadge = (status: BiometricAuthEvent['status']) => {
    switch (status) {
      case 'AUTHENTICATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/80 text-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            AUTHENTICATED
          </span>
        );
      case 'ANOMALY_DETECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-500/80 text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            ANOMALY DETECTED
          </span>
        );
      case 'SPOOF_REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-500/80 text-rose-300">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            SPOOF REJECTED
          </span>
        );
      case 'FLAGGED_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 border border-red-500/80 text-red-300">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            FLAGGED MISMATCH
          </span>
        );
    }
  };

  return (
    <div
      id="biometric-activity-log-container"
      data-testid="biometric-activity-log"
      className="space-y-4 font-mono"
    >
      {/* SECTION HEADER BANNER */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-400 shrink-0">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  BIOMETRIC ACTIVITY LOG
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scrollable forensic timeline of iris scans, kinetic gait dynamics, and acoustic voiceprint signatures.
              </p>
            </div>
          </div>

          {/* Trigger Live Realtime Scan Simulation */}
          <button
            type="button"
            onClick={handleSimulateRealtimeScan}
            disabled={isSimulatingScan || !activeSubject}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-md active:scale-95"
            title="Poll biometric sensors for immediate real-time capture"
          >
            {isSimulatingScan ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Biometric Sensor Mesh...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Simulate Sensor Scan</span>
              </>
            )}
          </button>
        </div>

        {/* TARGET SUBJECT SELECTION BAR */}
        <div className="pt-3 border-t border-slate-850">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400 animate-ping" />
              Target Supervised Subject
            </span>
            {activeSubject && (
              <span className="text-[11px] text-slate-400">
                DID:{' '}
                <span className="text-cyan-400 font-bold">{activeSubject.did}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {subjects.map((sub) => {
              const isSelected = activeSubject?.id === sub.id;
              return (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectSubject?.(sub);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/90 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={sub.avatarUrl}
                    alt={sub.fullName}
                    className={`w-9 h-9 rounded-md object-cover border shrink-0 ${
                      isSelected ? 'border-emerald-400' : 'border-slate-700'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white text-xs truncate">
                        {sub.fullName}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          sub.threatLevel === 'CRITICAL_CODE_RED'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600'
                            : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}
                      >
                        {sub.threatLevel.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{sub.id}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        {sub.biometrics.faceMatchScore}% Match
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODALITY FILTER TABS & SEARCH BAR */}
        <div className="pt-3 border-t border-slate-850 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Modality Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedModalityFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedModalityFilter === 'ALL'
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span>ALL MODALITIES</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-900 text-[10px] text-slate-300">
                  {modalityCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedModalityFilter('IRIS_SCAN');
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedModalityFilter === 'IRIS_SCAN'
                    ? 'bg-cyan-950/90 border-cyan-600 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>IRIS SCANS</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-900/60 text-[10px] text-cyan-300">
                  {modalityCounts.iris}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedModalityFilter('GAIT_DYNAMICS');
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedModalityFilter === 'GAIT_DYNAMICS'
                    ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>GAIT DYNAMICS</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 text-[10px] text-emerald-300">
                  {modalityCounts.gait}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedModalityFilter('VOICEPRINT_SIGNATURE');
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedModalityFilter === 'VOICEPRINT_SIGNATURE'
                    ? 'bg-violet-950/90 border-violet-600 text-violet-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-violet-400" />
                <span>VOICEPRINT</span>
                <span className="px-1.5 py-0.2 rounded bg-violet-900/60 text-[10px] text-violet-300">
                  {modalityCounts.voice}
                </span>
              </button>
            </div>

            {/* Status Filter Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  selectedStatusFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('AUTHENTICATED')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  selectedStatusFilter === 'AUTHENTICATED'
                    ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verified Only
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('ANOMALIES_ONLY')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  selectedStatusFilter === 'ANOMALIES_ONLY'
                    ? 'bg-amber-950 border border-amber-600 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Anomalies & Spoofs
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sensor node, checkpoint location, signature hash, proof ID, or notes..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SCROLLABLE LIST OF BIOMETRIC AUTHENTICATION EVENTS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            CHRONOLOGICAL CAPTURE STREAM (
            <span className="text-emerald-400 font-bold">{filteredEvents.length}</span> EVENTS RECORDED)
          </span>
          <span className="text-[10px] text-slate-500">ED25519 VERIFIED • ZERO-KNOWLEDGE PROOF BACKED</span>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto max-h-[540px] pr-1 space-y-3 custom-scrollbar">
          {filteredEvents.length === 0 ? (
            <div className="rounded-xl bg-slate-950 border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <Fingerprint className="w-8 h-8 text-slate-600" />
              <p className="font-bold text-slate-400">No Biometric Events Match Filter Criteria</p>
              <p className="text-[11px]">
                Adjust the modality filter, clear search text, or click "Simulate Sensor Scan" to capture telemetry.
              </p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isExpanded = expandedEventId === evt.id;
              const badge = getModalityBadge(evt.modality);
              const formattedTime = new Date(evt.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const formattedDate = new Date(evt.timestamp).toISOString().slice(0, 10);

              return (
                <div
                  key={evt.id}
                  className={`rounded-xl border transition-all text-xs ${
                    isExpanded
                      ? 'bg-slate-950 border-slate-700 shadow-xl ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/90 border-slate-850 hover:border-slate-750 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Event Header Row */}
                  <div
                    onClick={() => {
                      soundFx.playClick();
                      setExpandedEventId(isExpanded ? null : evt.id);
                    }}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                  >
                    {/* Left: Modality icon & core details */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-lg border ${badge.color} shrink-0`}>
                        {badge.icon}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                          {getStatusBadge(evt.status)}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {evt.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-white font-bold text-xs truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{evt.sensorLocation}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="text-cyan-400 font-semibold">{evt.sensorNodeId}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formattedTime} UTC ({formattedDate})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Match score & expand button */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Match Score</div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                evt.matchScore >= 95
                                  ? 'bg-emerald-400'
                                  : evt.matchScore >= 85
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, evt.matchScore)}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold font-mono ${
                              evt.matchScore >= 95
                                ? 'text-emerald-400'
                                : evt.matchScore >= 85
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {evt.matchScore}%
                          </span>
                        </div>
                      </div>

                      <div className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Forensic Telemetry Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-850/80 space-y-3.5 bg-slate-950/60 animate-fadeIn">
                      {/* Notes / Assessment */}
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 text-xs">
                        <span className="font-bold text-emerald-400">FORENSIC OBSERVATION: </span>
                        {evt.notes}
                      </div>

                      {/* Modality Specific Breakdown */}
                      {evt.modality === 'IRIS_SCAN' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-900/60 space-y-1">
                            <div className="text-[10px] text-cyan-400 uppercase font-bold">
                              Iris Pattern Sector
                            </div>
                            <div className="text-white font-mono font-bold text-xs">
                              {evt.details.irisPatternSector || 'SECTOR-7-COLLATERAL'}
                            </div>
                            <div className="text-[10px] text-slate-500">Optical Sector Grid</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-900/60 space-y-1">
                            <div className="text-[10px] text-cyan-400 uppercase font-bold">
                              Retinal Pupil Ratio
                            </div>
                            <div className="text-white font-mono font-bold text-xs">
                              {evt.details.retinalPupilRatio !== undefined
                                ? evt.details.retinalPupilRatio
                                : '0.36'}
                            </div>
                            <div className="text-[10px] text-slate-500">Cornea to pupil ratio</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-900/60 space-y-1">
                            <div className="text-[10px] text-cyan-400 uppercase font-bold">
                              Liveness Verification
                            </div>
                            <div className="text-emerald-400 font-mono font-bold text-xs">
                              {evt.details.livenessScore || 99.4}% CONFIDENCE
                            </div>
                            <div className="text-[10px] text-slate-500">Infrared reflection test</div>
                          </div>
                        </div>
                      )}

                      {evt.modality === 'GAIT_DYNAMICS' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-900/60 space-y-1">
                            <div className="text-[10px] text-emerald-400 uppercase font-bold">
                              Cadence Frequency
                            </div>
                            <div className="text-white font-mono font-bold text-xs">
                              {evt.details.cadenceFrequencyHz || 1.68} Hz
                            </div>
                            <div className="text-[10px] text-slate-500">Steps per second profile</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-900/60 space-y-1">
                            <div className="text-[10px] text-emerald-400 uppercase font-bold">
                              Stride Symmetry Index
                            </div>
                            <div className="text-white font-mono font-bold text-xs">
                              {evt.details.strideSymmetryPct || 96.5}%
                            </div>
                            <div className="text-[10px] text-slate-500">Bilateral kinetic alignment</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-900/60 space-y-1">
                            <div className="text-[10px] text-emerald-400 uppercase font-bold">
                              Acceleration Profile
                            </div>
                            <div className="text-emerald-300 font-mono text-[11px] truncate">
                              {evt.details.accelerationProfile || 'Standard kinetic motion'}
                            </div>
                            <div className="text-[10px] text-slate-500">LiDAR 3D Vector Telemetry</div>
                          </div>
                        </div>
                      )}

                      {evt.modality === 'VOICEPRINT_SIGNATURE' && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-violet-900/60 space-y-1">
                              <div className="text-[10px] text-violet-400 uppercase font-bold">
                                Fundamental Pitch
                              </div>
                              <div className="text-white font-mono font-bold text-xs">
                                {evt.details.harmonicPitchHz || 184.2} Hz
                              </div>
                              <div className="text-[10px] text-slate-500">Acoustic fundamental (F0)</div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-violet-900/60 space-y-1">
                              <div className="text-[10px] text-violet-400 uppercase font-bold">
                                Spectral Resonance
                              </div>
                              <div className="text-white font-mono font-bold text-xs">
                                {evt.details.spectralResonanceDb || 41.5} dB
                              </div>
                              <div className="text-[10px] text-slate-500">Harmonic amplitude peak</div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-violet-900/60 space-y-1">
                              <div className="text-[10px] text-violet-400 uppercase font-bold">
                                Ambient Noise Floor
                              </div>
                              <div className="text-slate-300 font-mono font-bold text-xs">
                                {evt.details.environmentalNoiseDb || 48.0} dB
                              </div>
                              <div className="text-[10px] text-slate-500">Signal-to-noise ratio</div>
                            </div>
                          </div>

                          {/* Formant frequency bands visualizer */}
                          {evt.details.formantFrequencies && (
                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-bold">Acoustic Formants:</span>
                              <div className="flex items-center gap-3">
                                {evt.details.formantFrequencies.map((f, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-700/60 text-violet-300 font-mono text-[10px]"
                                  >
                                    F{idx + 1}: {f} Hz
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cryptographic Signature & Proof Hash */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-slate-500 text-[10px] uppercase font-semibold">
                            Ed25519 Signature Hash
                          </div>
                          <div className="font-mono text-cyan-300 text-[11px] truncate select-all">
                            {evt.signatureHash}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(evt.signatureHash, `sig-${evt.id}`)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Copy cryptographic signature hash"
                          >
                            {copiedId === `sig-${evt.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Signature</span>
                              </>
                            )}
                          </button>

                          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                            {evt.tamperProofProofId}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
