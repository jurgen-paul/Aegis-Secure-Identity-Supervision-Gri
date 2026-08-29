import React, { useState, useEffect } from 'react';
import {
  TrackedSubject,
  SurveillanceNode,
  CCTVCameraFeed,
} from '../../types';
import {
  Crosshair,
  Radio,
  Video,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation as NavIcon,
  AlertOctagon,
  Eye,
  CreditCard,
  Train,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface TacticalMapProps {
  subjects: TrackedSubject[];
  nodes: SurveillanceNode[];
  cctvFeeds: CCTVCameraFeed[];
  selectedSubject: TrackedSubject | null;
  onSelectSubject: (subject: TrackedSubject) => void;
  isLockdownActive: boolean;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  subjects,
  nodes,
  cctvFeeds,
  selectedSubject,
  onSelectSubject,
  isLockdownActive,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showCameras, setShowCameras] = useState<boolean>(true);
  const [radarAngle, setRadarAngle] = useState<number>(0);

  // Center coordinate around Amsterdam core (52.3702° N, 4.8952° E)
  const centerLat = 52.3702;
  const centerLng = 4.8952;

  // Radar sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Map coordinate projection to SVG canvas (800x600)
  const mapWidth = 800;
  const mapHeight = 550;
  const latScale = 14000 * zoomLevel;
  const lngScale = 9000 * zoomLevel;

  const projectCoord = (lat: number, lng: number) => {
    const x = mapWidth / 2 + (lng - centerLng) * lngScale;
    const y = mapHeight / 2 - (lat - centerLat) * latScale;
    return { x, y };
  };

  const handleMarkerClick = (sub: TrackedSubject) => {
    soundFx.playLockOn();
    onSelectSubject(sub);
  };

  return (
    <div className="relative w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Map HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-md text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Radio className="w-4 h-4 animate-spin text-cyan-400" />
            <span>GOD'S EYE ORBITAL RADAR</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">LAT: 52.3702°N LNG: 4.8952°E</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">{subjects.length} TARGETS TRACKED</span>
        </div>

        {/* Map Layers & Zoom controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1 rounded-lg">
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showGeofences ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Geofence Boundaries"
          >
            Geofence
          </button>
          <button
            onClick={() => setShowTrails(!showTrails)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showTrails ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Historical Movement Trails"
          >
            Trails
          </button>
          <button
            onClick={() => setShowNodes(!showNodes)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showNodes ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Secure Node Relays"
          >
            Nodes
          </button>
          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showCameras ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle CCTV Towers"
          >
            CCTV
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.4))}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main SVG Radar Screen */}
      <div className="relative w-full h-[520px] bg-[#030712] overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full select-none"
        >
          <defs>
            {/* Radar Sweep Gradient */}
            <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>

            {/* Grid Pattern */}
            <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e2a47" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="0.8" fill="#0284c7" opacity="0.4" />
            </pattern>

            {/* Red Alert Glow */}
            <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Cyan Node Glow */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width={mapWidth} height={mapHeight} fill="url(#tacticalGrid)" />

          {/* Simulated Geographic Sector Shapes (Canals & City Matrix) */}
          <g stroke="#1e293b" strokeWidth="1.5" fill="none" opacity="0.6">
            {/* Canal Rings */}
            <path d="M 150,180 Q 400,280 650,180" stroke="#0c4a6e" strokeWidth="2.5" />
            <path d="M 180,220 Q 400,310 620,220" stroke="#0c4a6e" strokeWidth="2" />
            <path d="M 210,260 Q 400,340 590,260" stroke="#0c4a6e" strokeWidth="1.5" />
            {/* IJ Waterfront */}
            <path d="M 100,120 Q 400,150 700,100" stroke="#0369a1" strokeWidth="4" opacity="0.7" />
          </g>

          {/* Concentric Radar Range Circles */}
          <g stroke="#0369a1" strokeWidth="0.7" strokeDasharray="3,3" fill="none" opacity="0.4">
            <circle cx={mapWidth / 2} cy={mapHeight / 2} r="80" />
            <circle cx={mapWidth / 2} cy={mapHeight / 2} r="160" />
            <circle cx={mapWidth / 2} cy={mapHeight / 2} r="240" />
            <circle cx={mapWidth / 2} cy={mapHeight / 2} r="320" />
            {/* Axis crosshairs */}
            <line x1={mapWidth / 2} y1="0" x2={mapWidth / 2} y2={mapHeight} stroke="#0284c7" strokeWidth="0.8" opacity="0.3" />
            <line x1="0" y1={mapHeight / 2} x2={mapWidth} y2={mapHeight / 2} stroke="#0284c7" strokeWidth="0.8" opacity="0.3" />
          </g>

          {/* Rotating Radar Beam */}
          <g transform={`rotate(${radarAngle} ${mapWidth / 2} ${mapHeight / 2})`}>
            <path
              d={`M ${mapWidth / 2} ${mapHeight / 2} L ${mapWidth / 2 + 320} ${mapHeight / 2} A 320 320 0 0 0 ${
                mapWidth / 2 + 320 * Math.cos((35 * Math.PI) / 180)
              } ${mapHeight / 2 - 320 * Math.sin((35 * Math.PI) / 180)} Z`}
              fill="url(#radarSweepGrad)"
            />
            <line
              x1={mapWidth / 2}
              y1={mapHeight / 2}
              x2={mapWidth / 2 + 320}
              y2={mapHeight / 2}
              stroke="#22d3ee"
              strokeWidth="1.5"
              opacity="0.8"
            />
          </g>

          {/* Geofence Perimeter Zones */}
          {showGeofences && (
            <g>
              {/* High Security Perimeter (Centraal Sector) */}
              <circle
                cx={mapWidth / 2 + (4.899431 - centerLng) * lngScale}
                cy={mapHeight / 2 - (52.379189 - centerLat) * latScale}
                r="70"
                fill="rgba(239, 68, 68, 0.08)"
                stroke="#ef4444"
                strokeWidth="1.8"
                strokeDasharray="6,4"
                className={isLockdownActive ? 'animate-pulse' : ''}
              />
              <text
                x={mapWidth / 2 + (4.899431 - centerLng) * lngScale - 65}
                y={mapHeight / 2 - (52.379189 - centerLat) * latScale - 75}
                fill="#f87171"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                GEOFENCE ZONE 1A [RESTRICTED RAIL/BORDER]
              </text>

              {/* Research Perimeter (Museumplein Sector) */}
              <circle
                cx={mapWidth / 2 + (4.8852 - centerLng) * lngScale}
                cy={mapHeight / 2 - (52.3601 - centerLat) * latScale}
                r="65"
                fill="rgba(6, 182, 212, 0.06)"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={mapWidth / 2 + (4.8852 - centerLng) * lngScale - 60}
                y={mapHeight / 2 - (52.3601 - centerLat) * latScale + 80}
                fill="#22d3ee"
                fontSize="10"
                fontFamily="monospace"
              >
                ZONE 4B [QUANTUM ENCLAVE]
              </text>
            </g>
          )}

          {/* Secure Node Relays */}
          {showNodes &&
            nodes.map((node) => {
              const { x, y } = projectCoord(node.lat, node.lng);
              const isAlert = node.status === 'ALERT_LOCK';
              return (
                <g key={node.id} transform={`translate(${x}, ${y})`}>
                  {/* Coverage Pulse */}
                  <circle
                    r="24"
                    fill={isAlert ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.1)'}
                    stroke={isAlert ? '#ef4444' : '#06b6d4'}
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                  {/* Node Diamond icon */}
                  <polygon
                    points="0,-8 8,0 0,8 -8,0"
                    fill={isAlert ? '#dc2626' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth="1"
                    filter="url(#cyanGlow)"
                  />
                  <text
                    x="12"
                    y="4"
                    fill={isAlert ? '#fca5a5' : '#7dd3fc'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {node.nodeName.split('-')[0]} [RELAY]
                  </text>
                </g>
              );
            })}

          {/* CCTV Camera Cones & Towers */}
          {showCameras &&
            cctvFeeds.map((cam) => {
              const { x, y } = projectCoord(cam.lat, cam.lng);
              return (
                <g key={cam.id} transform={`translate(${x}, ${y})`}>
                  {/* Camera Field of View Wedge */}
                  <path
                    d="M 0 0 L -25 -40 L 25 -40 Z"
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="#3b82f6"
                    strokeWidth="0.8"
                  />
                  <circle r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                  <text
                    x="-20"
                    y="-45"
                    fill="#93c5fd"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    CCTV-{cam.id.slice(-3)}
                  </text>
                </g>
              );
            })}

          {/* Target Historical Movement Trails */}
          {showTrails &&
            subjects.map((sub) => {
              if (!sub.locationHistory || sub.locationHistory.length < 2) return null;
              const points = sub.locationHistory
                .map((loc) => {
                  const { x, y } = projectCoord(loc.lat, loc.lng);
                  return `${x},${y}`;
                })
                .join(' ');

              const isRed = sub.threatLevel === 'CRITICAL_CODE_RED';

              return (
                <g key={`trail-${sub.id}`}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={isRed ? '#ef4444' : '#06b6d4'}
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    opacity="0.75"
                  />
                  {sub.locationHistory.map((loc, i) => {
                    const { x, y } = projectCoord(loc.lat, loc.lng);
                    return (
                      <circle
                        key={`pt-${i}`}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={isRed ? '#f87171' : '#38bdf8'}
                        opacity="0.8"
                      />
                    );
                  })}
                </g>
              );
            })}

          {/* Tracked Subjects Pins (Real-Time Targets) */}
          {subjects.map((sub) => {
            const { x, y } = projectCoord(sub.currentLocation.lat, sub.currentLocation.lng);
            const isRed = sub.threatLevel === 'CRITICAL_CODE_RED';
            const isAmber = sub.threatLevel === 'HIGH';
            const isSelected = selectedSubject?.id === sub.id;

            const ringColor = isRed ? '#ef4444' : isAmber ? '#f59e0b' : '#10b981';

            return (
              <g
                key={sub.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => handleMarkerClick(sub)}
                className="cursor-pointer group"
              >
                {/* Target Locked-on Reticle if selected */}
                {isSelected && (
                  <g className="animate-spin-slow">
                    <circle
                      r="28"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      strokeDasharray="8,6"
                    />
                    <path
                      d="M -32 0 L -22 0 M 32 0 L 22 0 M 0 -32 L 0 -22 M 0 32 L 0 22"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* Animated Pulsing Beacon */}
                <circle
                  r="16"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="2"
                  className="animate-ping opacity-60"
                />

                {/* Target Face / Identity Badge */}
                <circle
                  r="14"
                  fill="#0f172a"
                  stroke={ringColor}
                  strokeWidth="2.5"
                  filter={isRed ? 'url(#redGlow)' : 'url(#cyanGlow)'}
                />

                {/* Target Heading Vector Line */}
                <line
                  x1="0"
                  y1="0"
                  x2={18 * Math.sin((sub.currentLocation.headingDegrees * Math.PI) / 180)}
                  y2={-18 * Math.cos((sub.currentLocation.headingDegrees * Math.PI) / 180)}
                  stroke={ringColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Face Icon inside marker */}
                <clipPath id={`clip-${sub.id}`}>
                  <circle r="12" />
                </clipPath>
                <image
                  href={sub.avatarUrl}
                  x="-12"
                  y="-12"
                  width="24"
                  height="24"
                  clipPath={`url(#clip-${sub.id})`}
                  preserveAspectRatio="xMidYMid slice"
                />

                {/* Hover / Label HUD Tag */}
                <g transform="translate(18, -12)">
                  <rect
                    width="140"
                    height="36"
                    rx="4"
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke={ringColor}
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="14"
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {sub.fullName.split(' ')[0]} ({sub.alias.split('_')[0]})
                  </text>
                  <text
                    x="8"
                    y="27"
                    fill={ringColor}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {sub.threatLevel} | {sub.biometrics.faceMatchScore}% BIO
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Bottom Map Legend */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800/80 backdrop-blur-md text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 font-semibold">Code Red Subject</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300">High Watch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-300">Verified Citizen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-cyan-400" />
            <span className="text-cyan-300">E2EE Node Relay</span>
          </div>
        </div>
      </div>
    </div>
  );
};
