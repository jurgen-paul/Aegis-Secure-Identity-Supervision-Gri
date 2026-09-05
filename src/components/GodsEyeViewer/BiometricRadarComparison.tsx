import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { TrackedSubject } from '../../types';
import {
  Fingerprint,
  Eye,
  Mic,
  Activity,
  Footprints,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface BiometricRadarComparisonProps {
  subject: TrackedSubject;
}

interface BiometricMetricPoint {
  metric: string;
  category: 'gait' | 'voice' | 'iris' | 'facial';
  current: number;
  baseline: number;
  unit: string;
  currentDisplay: string;
  baselineDisplay: string;
  delta: number;
  isAnomalous: boolean;
  notes: string;
}

export const BiometricRadarComparison: React.FC<BiometricRadarComparisonProps> = ({ subject }) => {
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [showCurrent, setShowCurrent] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'gait' | 'voice' | 'iris'>('all');

  const isRed = subject.threatLevel === 'CRITICAL_CODE_RED';
  const isAmber = subject.threatLevel === 'HIGH';

  // Deterministic baseline extraction based on subject ID & current values
  const currentGaitHz = subject.biometrics.gaitCadenceFrequency || 1.75;
  // Historical baseline cadence is typically ~1.50 - 1.60 Hz for standard walking
  const baselineGaitHz =
    subject.id === 'SUB-9082' ? 1.52 : subject.id === 'SUB-4410' ? 1.58 : 1.65;
  const gaitCadenceScore = Math.min(100, Math.round((currentGaitHz / 2.0) * 100));
  const baselineGaitScore = Math.min(100, Math.round((baselineGaitHz / 2.0) * 100));

  // Voiceprint baseline vs current
  const currentVoiceHarmonics = subject.biometrics.voiceprintHarmonicScore || 94.0;
  const baselineVoiceHarmonics =
    subject.id === 'SUB-9082' ? 99.1 : subject.id === 'SUB-4410' ? 96.5 : 92.0;

  // Iris Cryptographic Pattern match vs Baseline
  const currentIrisScore = subject.id === 'SUB-9082' ? 99.4 : subject.id === 'SUB-4410' ? 98.2 : 97.5;
  const baselineIrisScore = 100.0; // Enrolled identity baseline is 100%

  // Additional Biometric Markers:
  // Gait Symmetry: under rush/evasion, symmetry drops
  const currentGaitSymmetry = subject.id === 'SUB-9082' ? 78 : subject.id === 'SUB-4410' ? 91 : 96;
  const baselineGaitSymmetry = 98;

  // Voice Formant / Jitter index (100 = optimal calm baseline)
  const currentVoiceStability = subject.id === 'SUB-9082' ? 72 : subject.id === 'SUB-4410' ? 88 : 95;
  const baselineVoiceStability = 96;

  // Iris Pupillary Constriction Dynamics
  const currentIrisPupilDynamics = subject.id === 'SUB-9082' ? 92 : subject.id === 'SUB-4410' ? 95 : 98;
  const baselineIrisPupilDynamics = 99;

  // Facial Neural Vector match
  const currentFaceMatch = subject.biometrics.faceMatchScore || 98.0;
  const baselineFaceMatch = 100.0;

  const radarData: BiometricMetricPoint[] = [
    {
      metric: 'Gait Cadence',
      category: 'gait',
      current: gaitCadenceScore,
      baseline: baselineGaitScore,
      unit: 'Hz',
      currentDisplay: `${currentGaitHz.toFixed(2)} Hz`,
      baselineDisplay: `${baselineGaitHz.toFixed(2)} Hz`,
      delta: Math.round(((currentGaitHz - baselineGaitHz) / baselineGaitHz) * 100),
      isAnomalous: Math.abs(currentGaitHz - baselineGaitHz) > 0.2,
      notes:
        currentGaitHz > baselineGaitHz
          + 0.2
            ? 'Elevated pace / flight response detected'
            : 'Nominal baseline walking cadence',
    },
    {
      metric: 'Gait Symmetry',
      category: 'gait',
      current: currentGaitSymmetry,
      baseline: baselineGaitSymmetry,
      unit: '%',
      currentDisplay: `${currentGaitSymmetry}%`,
      baselineDisplay: `${baselineGaitSymmetry}%`,
      delta: currentGaitSymmetry - baselineGaitSymmetry,
      isAnomalous: currentGaitSymmetry < 85,
      notes:
        currentGaitSymmetry < 85
          ? 'Asymmetric stride (hurried evasion pattern)'
          : 'Uniform bilateral stride',
    },
    {
      metric: 'Voice Harmonics',
      category: 'voice',
      current: Math.round(currentVoiceHarmonics),
      baseline: Math.round(baselineVoiceHarmonics),
      unit: '%',
      currentDisplay: `${currentVoiceHarmonics.toFixed(1)}%`,
      baselineDisplay: `${baselineVoiceHarmonics.toFixed(1)}%`,
      delta: Math.round(currentVoiceHarmonics - baselineVoiceHarmonics),
      isAnomalous: Math.abs(currentVoiceHarmonics - baselineVoiceHarmonics) > 5,
      notes: 'Spectral acoustic resonance match against enrolled voice token',
    },
    {
      metric: 'Voice Pitch Stability',
      category: 'voice',
      current: currentVoiceStability,
      baseline: baselineVoiceStability,
      unit: '%',
      currentDisplay: `${currentVoiceStability}%`,
      baselineDisplay: `${baselineVoiceStability}%`,
      delta: currentVoiceStability - baselineVoiceStability,
      isAnomalous: currentVoiceStability < 80,
      notes:
        currentVoiceStability < 80
          ? 'Micro-tremor / elevated stress frequency'
          : 'Calm harmonic modulation',
    },
    {
      metric: 'Iris Crypt Texture',
      category: 'iris',
      current: Math.round(currentIrisScore),
      baseline: Math.round(baselineIrisScore),
      unit: '%',
      currentDisplay: `${currentIrisScore.toFixed(1)}%`,
      baselineDisplay: `${baselineIrisScore.toFixed(1)}%`,
      delta: Math.round(currentIrisScore - baselineIrisScore),
      isAnomalous: currentIrisScore < 95,
      notes: 'Infrared stroma and crypt pattern matched to biometric passport',
    },
    {
      metric: 'Pupil Dynamics',
      category: 'iris',
      current: currentIrisPupilDynamics,
      baseline: baselineIrisPupilDynamics,
      unit: '%',
      currentDisplay: `${currentIrisPupilDynamics}%`,
      baselineDisplay: `${baselineIrisPupilDynamics}%`,
      delta: currentIrisPupilDynamics - baselineIrisPupilDynamics,
      isAnomalous: currentIrisPupilDynamics < 88,
      notes: 'Light-reflex constriction latency & autonomic pupil response',
    },
    {
      metric: 'Facial Landmarks',
      category: 'facial',
      current: Math.round(currentFaceMatch),
      baseline: Math.round(baselineFaceMatch),
      unit: '%',
      currentDisplay: `${currentFaceMatch.toFixed(1)}%`,
      baselineDisplay: `${baselineFaceMatch.toFixed(1)}%`,
      delta: Math.round(currentFaceMatch - baselineFaceMatch),
      isAnomalous: currentFaceMatch < 90,
      notes: '512-dimensional vector neural embedding match',
    },
  ];

  const filteredData =
    activeFilter === 'all'
      ? radarData
      : radarData.filter((item) => item.category === activeFilter);

  const handleRescan = () => {
    soundFx.playDecrypt();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      soundFx.playLockOn();
    }, 900);
  };

  const anomaliesCount = radarData.filter((d) => d.isAnomalous).length;
  const currentColor = isRed ? '#ef4444' : isAmber ? '#f59e0b' : '#10b981';

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide">
                BIOMETRIC MULTI-VECTOR RADAR MATRIX
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                LIVE VS HISTORICAL BASELINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Real-time optical & acoustic sensor telemetry compared to verified government registry
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px]">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowBaseline(!showBaseline);
              }}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                showBaseline
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span>Historical Baseline</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setShowCurrent(!showCurrent);
              }}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                showCurrent
                  ? 'border font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              style={{
                backgroundColor: showCurrent ? `${currentColor}25` : undefined,
                color: showCurrent ? currentColor : undefined,
                borderColor: showCurrent ? currentColor : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block animate-pulse"
                style={{ backgroundColor: currentColor }}
              />
              <span>Live Telemetry</span>
            </button>
          </div>

          {/* Neural Re-scan button */}
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition-all flex items-center gap-1.5 text-[11px] cursor-pointer"
            title="Re-synchronize optical and acoustic sensor streams"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Re-scan'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Radar Chart + Metric Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Radar Chart Display Area */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center bg-slate-950/90 border border-slate-800 rounded-xl p-3 min-h-[300px]">
          {/* Scanning Line Animation Overlay */}
          {isScanning && (
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-10">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_15px_#22d3ee] absolute top-1/2 -translate-y-1/2" />
              <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-[1px]" />
            </div>
          )}

          {/* Quick Filter Pills */}
          <div className="w-full flex items-center justify-between gap-1 mb-1 z-10 text-[10px]">
            <span className="text-slate-500 font-bold uppercase">FOCUS VECTOR:</span>
            <div className="flex gap-1">
              {(['all', 'gait', 'voice', 'iris'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveFilter(filter);
                  }}
                  className={`px-2 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Polar Radar View */}
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={filteredData}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 8 }}
                  stroke="#1e293b"
                />

                {/* Historical Baseline Radar Area */}
                {showBaseline && (
                  <Radar
                    name="Historical Baseline"
                    dataKey="baseline"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.22}
                    strokeWidth={2}
                  />
                )}

                {/* Live Telemetry Radar Area */}
                {showCurrent && (
                  <Radar
                    name="Live Scan"
                    dataKey="current"
                    stroke={currentColor}
                    fill={currentColor}
                    fillOpacity={0.42}
                    strokeWidth={2.2}
                  />
                )}

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as BiometricMetricPoint;
                      return (
                        <div className="bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 shadow-2xl backdrop-blur-md font-mono text-[11px] space-y-1.5 z-50 max-w-[220px]">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                            <span>{data.metric}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                data.isAnomalous
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {data.isAnomalous ? 'VARIANCE DETECTED' : 'NOMINAL'}
                            </span>
                          </div>

                          <div className="space-y-1 text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Live Telemetry:</span>
                              <span className="font-bold text-white">{data.currentDisplay}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Gov Baseline:</span>
                              <span className="font-bold text-cyan-300">{data.baselineDisplay}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-850 pt-1">
                              <span className="text-slate-400">Drift Delta:</span>
                              <span
                                className={`font-bold ${
                                  data.delta > 0
                                    ? 'text-amber-400'
                                    : data.delta < 0
                                    ? 'text-red-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {data.delta > 0 ? `+${data.delta}%` : `${data.delta}%`}
                              </span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 font-sans italic border-t border-slate-850 pt-1">
                            {data.notes}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Legend */}
          <div className="w-full flex items-center justify-center gap-4 text-[10px] text-slate-400 border-t border-slate-850 pt-1.5 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-cyan-400 rounded" />
              <span>Baseline (Enrolled Gov Profile)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-1 rounded"
                style={{ backgroundColor: currentColor }}
              />
              <span>Live Sensor Telemetry</span>
            </div>
          </div>
        </div>

        {/* Column 2: Specific Modality Cards (Gait, Voice, Iris, Facial) */}
        <div className="lg:col-span-6 space-y-2.5">
          {/* Gait Modality Card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white">GAIT KINEMATICS & CADENCE</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  Math.abs(currentGaitHz - baselineGaitHz) > 0.2
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                }`}
              >
                {Math.abs(currentGaitHz - baselineGaitHz) > 0.2
                  ? `ANOMALY: +${Math.round(((currentGaitHz - baselineGaitHz) / baselineGaitHz) * 100)}% CADENCE`
                  : 'STABLE STRIDE'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">CURRENT CADENCE</span>
                <span className="font-bold text-white">{currentGaitHz.toFixed(2)} Hz</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">BASELINE CADENCE</span>
                <span className="font-bold text-cyan-400">{baselineGaitHz.toFixed(2)} Hz</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">STRIDE SYMMETRY</span>
                <span className={`font-bold ${currentGaitSymmetry < 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentGaitSymmetry}% / 98%
                </span>
              </div>
            </div>
          </div>

          {/* Voiceprint Modality Card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white">VOICEPRINT & ACOUSTIC SPECTRAL</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700 font-bold">
                MATCH: {currentVoiceHarmonics.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">HARMONICS</span>
                <span className="font-bold text-white">{currentVoiceHarmonics.toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">HISTORICAL BASE</span>
                <span className="font-bold text-cyan-400">{baselineVoiceHarmonics.toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">STRESS STABILITY</span>
                <span className={`font-bold ${currentVoiceStability < 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {currentVoiceStability}%
                </span>
              </div>
            </div>
          </div>

          {/* Iris Cryptographic Modality Card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white">INFRARED IRIS STROMA PATTERN</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>CONFIRMED {currentIrisScore.toFixed(1)}%</span>
              </span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[9px]">ENROLLED HASH:</span>
                <span className="font-mono text-cyan-300 break-all text-[9px]">{subject.biometrics.irisHash}</span>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-slate-500 block text-[9px]">PUPIL RESPONSE</span>
                <span className="font-bold text-emerald-400">{currentIrisPupilDynamics}% nominal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Variance Telemetry Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>
            Biometric Divergence Index:{' '}
            <strong className={anomaliesCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {anomaliesCount > 0
                ? `${anomaliesCount} Vector Anomaly Detected (Elevated Stress / Kinetic Movement)`
                : 'Zero Critical Vector Drift Detected'}
            </strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Last Scanned: {new Date(subject.biometrics.lastScannedAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
