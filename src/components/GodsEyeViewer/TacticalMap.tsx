import React, { useState, useEffect, useMemo } from 'react';
import {
  TrackedSubject,
  SurveillanceNode,
  CCTVCameraFeed,
  PoliceStation,
  ActiveAlertLog,
} from '../../types';
import { POLICE_STATIONS } from '../../lib/mockData';
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
  Car,
  PhoneCall,
  Flame,
  AlertTriangle,
  Activity,
  Info,
  X,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

export interface TacticalSector {
  id: string;
  code: string;
  name: string;
  subLabel: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  baseRisk: number;
  description: string;
}

export interface TacticalSectorWithRisk extends TacticalSector {
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'NOMINAL';
  colorHex: string;
  gradientId: string;
  activeAlerts: ActiveAlertLog[];
  subjectsInSector: TrackedSubject[];
}

const METRO_SECTORS: TacticalSector[] = [
  {
    id: 'SEC-1A',
    code: 'SEC-1A',
    name: 'Centraal Station & North Rail Corridor',
    subLabel: 'International Transit Hub & High-Speed Border',
    lat: 52.3792,
    lng: 4.8995,
    radiusMeters: 650,
    baseRisk: 30,
    description: 'High-density international railway terminus, Eurostar/Thalys transit gates, Metro 52 interchange.',
  },
  {
    id: 'SEC-2A',
    code: 'SEC-2A',
    name: 'Dam Square & Rokin Commercial Matrix',
    subLabel: 'High Pedestrian Flow & Financial Vaults',
    lat: 52.3731,
    lng: 4.8926,
    radiusMeters: 550,
    baseRisk: 22,
    description: 'Civic heart, high-volume retail, ATM clusters, multi-angle synthetic CCTV matrix.',
  },
  {
    id: 'SEC-3A',
    code: 'SEC-3A',
    name: 'Waterlooplein & South Transit Axis',
    subLabel: 'Metro Corridor & East Canal Crossing',
    lat: 52.3676,
    lng: 4.9041,
    radiusMeters: 500,
    baseRisk: 15,
    description: 'Metro hub, transit sensor array, secondary ingress corridor.',
  },
  {
    id: 'SEC-4B',
    code: 'SEC-4B',
    name: 'Museumplein Quantum Research Enclave',
    subLabel: 'Restricted Defense & Deep Tech Labs',
    lat: 52.3601,
    lng: 4.8852,
    radiusMeters: 580,
    baseRisk: 20,
    description: 'Advanced quantum computing enclave, diplomatic sector, restricted laboratory perimeter.',
  },
  {
    id: 'SEC-5C',
    code: 'SEC-5C',
    name: 'De Ruijterkade & Maritime River Corridor',
    subLabel: 'IJ Waterway & Port Intercept Hub',
    lat: 52.3812,
    lng: 4.9070,
    radiusMeters: 520,
    baseRisk: 15,
    description: 'Navigational waterway, passenger ferries, Europol maritime interdiction station.',
  },
  {
    id: 'SEC-6D',
    code: 'SEC-6D',
    name: 'Leidseplein & South-West Urban Sector',
    subLabel: 'High Nightlife & Dense Urban Matrix',
    lat: 52.3638,
    lng: 4.8820,
    radiusMeters: 460,
    baseRisk: 10,
    description: 'Dense pedestrian corridors, tram intersection nodes, surveillance relay coverage.',
  },
  {
    id: 'SEC-7W',
    code: 'SEC-7W',
    name: 'Jordaan Canal Matrix & West Perimeter',
    subLabel: 'Historic Residential & Canal Ingress',
    lat: 52.3745,
    lng: 4.8805,
    radiusMeters: 480,
    baseRisk: 10,
    description: 'Canal grid network, decentralized mesh node relay zone.',
  },
];

interface TacticalMapProps {
  subjects: TrackedSubject[];
  nodes: SurveillanceNode[];
  cctvFeeds: CCTVCameraFeed[];
  selectedSubject: TrackedSubject | null;
  onSelectSubject: (subject: TrackedSubject) => void;
  isLockdownActive: boolean;
  policeStations?: PoliceStation[];
  onDispatchToPolice?: (subject: TrackedSubject) => void;
  alerts?: ActiveAlertLog[];
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  subjects,
  nodes,
  cctvFeeds,
  selectedSubject,
  onSelectSubject,
  isLockdownActive,
  policeStations = POLICE_STATIONS,
  onDispatchToPolice,
  alerts = [],
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showCameras, setShowCameras] = useState<boolean>(true);
  const [showPolice, setShowPolice] = useState<boolean>(true);
  const [radarAngle, setRadarAngle] = useState<number>(0);
  const [selectedSector, setSelectedSector] = useState<TacticalSectorWithRisk | null>(null);

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

  // Data-driven Regional Risk Heatmap Computation
  const computedSectors = useMemo<TacticalSectorWithRisk[]>(() => {
    const unresolvedAlerts = alerts.filter((a) => !a.isResolved);

    return METRO_SECTORS.map((sec) => {
      // 1. Identify active alerts matching this sector by name, code, or proximity
      const sectorAlerts = unresolvedAlerts.filter((a) => {
        const text = `${a.locationDetails} ${a.title} ${a.details}`.toLowerCase();
        const matchesKeyword =
          text.includes(sec.code.toLowerCase()) ||
          text.includes(sec.name.toLowerCase()) ||
          text.includes(sec.id.toLowerCase()) ||
          (sec.id === 'SEC-1A' && (text.includes('centraal') || text.includes('1a') || text.includes('platform 15') || text.includes('rail'))) ||
          (sec.id === 'SEC-2A' && (text.includes('dam') || text.includes('2a') || text.includes('rokin'))) ||
          (sec.id === 'SEC-3A' && (text.includes('waterloo') || text.includes('3a'))) ||
          (sec.id === 'SEC-4B' && (text.includes('museum') || text.includes('quantum') || text.includes('4b'))) ||
          (sec.id === 'SEC-5C' && (text.includes('maritime') || text.includes('water') || text.includes('ruijterkade')));

        return matchesKeyword;
      });

      // 2. Identify tracked subjects inside this sector radius
      const sectorSubjects = subjects.filter((s) => {
        const dist = Math.hypot(
          s.currentLocation.lat - sec.lat,
          s.currentLocation.lng - sec.lng
        );
        return dist <= 0.0078; // Approx ~750m radius
      });

      // 3. Compute dynamic weighted risk score (0 - 100%)
      let score = sec.baseRisk;

      sectorAlerts.forEach((a) => {
        if (a.severity === 'CRITICAL_CODE_RED') score += 35;
        else if (a.severity === 'HIGH') score += 20;
        else score += 12;
      });

      sectorSubjects.forEach((s) => {
        if (s.threatLevel === 'CRITICAL_CODE_RED') score += 32;
        else if (s.threatLevel === 'HIGH') score += 18;
        else score += 8;

        if (s.geofenceStatus === 'BREACH_DETECTED') score += 25;
        else if (s.geofenceStatus === 'APPROACHING_BOUNDARY') score += 12;

        // Flagged transactions or transit anomalies in sector
        if (s.bankcardTransactions.some((tx) => tx.isFlagged)) score += 10;
        if (s.transitEvents.some((tr) => tr.anomalyDetected)) score += 12;
      });

      const clampedScore = Math.min(Math.max(score, 10), 99);

      // Determine risk tier & color palette
      let riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'NOMINAL' = 'NOMINAL';
      let colorHex = '#10b981'; // Green
      let gradientId = 'heatGradCyan';

      if (clampedScore >= 70) {
        riskLevel = 'CRITICAL';
        colorHex = '#ef4444'; // Red
        gradientId = 'heatGradRed';
      } else if (clampedScore >= 45) {
        riskLevel = 'HIGH';
        colorHex = '#f97316'; // Orange
        gradientId = 'heatGradOrange';
      } else if (clampedScore >= 25) {
        riskLevel = 'ELEVATED';
        colorHex = '#eab308'; // Yellow
        gradientId = 'heatGradYellow';
      }

      return {
        ...sec,
        riskScore: clampedScore,
        riskLevel,
        colorHex,
        gradientId,
        activeAlerts: sectorAlerts,
        subjectsInSector: sectorSubjects,
      };
    });
  }, [alerts, subjects]);

  const maxRiskSector = useMemo(() => {
    if (computedSectors.length === 0) return null;
    return [...computedSectors].sort((a, b) => b.riskScore - a.riskScore)[0];
  }, [computedSectors]);

  const handleMarkerClick = (sub: TrackedSubject) => {
    soundFx.playLockOn();
    onSelectSubject(sub);
  };

  const handleSectorClick = (sector: TacticalSectorWithRisk) => {
    soundFx.playClick();
    setSelectedSector((prev) => (prev?.id === sector.id ? null : sector));
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
          {maxRiskSector && (
            <>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-[11px]">
                <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="text-red-400 font-bold">
                  PEAK RISK: {maxRiskSector.code} ({maxRiskSector.riskScore}%)
                </span>
              </div>
            </>
          )}
        </div>

        {/* Map Layers & Zoom controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1 rounded-lg">
          {/* Regional Risk Heatmap Layer Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowHeatmap(!showHeatmap);
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-gradient-to-r from-red-950 via-orange-950 to-amber-950 text-amber-300 border border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Regional Risk Heatmap (Active Alert & Threat Density Layer)"
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                showHeatmap ? 'text-orange-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span>Risk Heatmap</span>
            {showHeatmap && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showGeofences
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Geofence Boundaries"
          >
            Geofence
          </button>
          <button
            onClick={() => setShowTrails(!showTrails)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showTrails
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Historical Movement Trails"
          >
            Trails
          </button>
          <button
            onClick={() => setShowNodes(!showNodes)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showNodes
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Secure Node Relays"
          >
            Nodes
          </button>
          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              showCameras
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle CCTV Towers"
          >
            CCTV
          </button>
          <button
            onClick={() => setShowPolice(!showPolice)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1 ${
              showPolice
                ? 'bg-blue-950 text-blue-300 border border-blue-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Police Stations & Patrol Response Units"
          >
            <Car className="w-3 h-3" />
            <span>Police</span>
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

            {/* Heatmap Gaussian Diffusion Filter */}
            <filter id="heatDiffusion" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.4 0"
              />
            </filter>

            {/* Heatmap Multi-Stop Radial Gradients (Red / Orange / Yellow / Cyan) */}
            <radialGradient id="heatGradRed" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#dc2626" stopOpacity="0.55" />
              <stop offset="65%" stopColor="#b91c1c" stopOpacity="0.30" />
              <stop offset="85%" stopColor="#ef4444" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heatGradOrange" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.70" />
              <stop offset="35%" stopColor="#ea580c" stopOpacity="0.48" />
              <stop offset="65%" stopColor="#c2410c" stopOpacity="0.25" />
              <stop offset="85%" stopColor="#f97316" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heatGradYellow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.65" />
              <stop offset="35%" stopColor="#ca8a04" stopOpacity="0.42" />
              <stop offset="65%" stopColor="#a16207" stopOpacity="0.20" />
              <stop offset="85%" stopColor="#eab308" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heatGradCyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.20" />
              <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            {/* Danger Cross-Hatch Pattern */}
            <pattern id="dangerHatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#ef4444" strokeWidth="0.8" opacity="0.35" />
            </pattern>
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

          {/* LAYER: Regional Risk Heatmap (Data-Driven Threat Intensity) */}
          {showHeatmap && (
            <g id="regional-risk-heatmap-layer" className="transition-opacity duration-500">
              {computedSectors.map((sector) => {
                const { x, y } = projectCoord(sector.lat, sector.lng);
                const radius = (sector.radiusMeters / 10) * zoomLevel;
                const isCritical = sector.riskLevel === 'CRITICAL';
                const isHigh = sector.riskLevel === 'HIGH';
                const isSelected = selectedSector?.id === sector.id;

                return (
                  <g
                    key={`heatmap-${sector.id}`}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={() => handleSectorClick(sector)}
                  >
                    {/* Outer Thermal Dispersion Blob with Filter */}
                    <circle
                      r={radius * 1.3}
                      fill={`url(#${sector.gradientId})`}
                      filter="url(#heatDiffusion)"
                      opacity={isCritical ? 0.95 : isHigh ? 0.85 : 0.75}
                    />

                    {/* Concentric Thermal Core */}
                    <circle
                      r={radius * 0.75}
                      fill={`url(#${sector.gradientId})`}
                      opacity={0.8}
                    />

                    {/* Cross-Hatch Danger Texture for Critical Sectors */}
                    {isCritical && (
                      <circle
                        r={radius * 0.9}
                        fill="url(#dangerHatch)"
                        className="animate-pulse"
                      />
                    )}

                    {/* Outer Iso-Threat Topological Contour Rings */}
                    <circle
                      r={radius}
                      fill="none"
                      stroke={sector.colorHex}
                      strokeWidth={isSelected ? '2.5' : isCritical ? '1.8' : '1.2'}
                      strokeDasharray={isCritical ? '6,4' : '4,3'}
                      opacity={isCritical ? 0.85 : 0.55}
                      className={isCritical ? 'animate-pulse' : ''}
                    />
                    <circle
                      r={radius * 0.5}
                      fill="none"
                      stroke={sector.colorHex}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity={0.4}
                    />

                    {/* Pulsing Thermal Center Node */}
                    <circle
                      r="4"
                      fill={sector.colorHex}
                      filter={isCritical ? 'url(#redGlow)' : undefined}
                    />
                    {isCritical && (
                      <circle
                        r="10"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Sector Tactical Risk Label & Density Badge */}
                    <g transform={`translate(0, ${-radius * 0.85 - 12})`}>
                      <rect
                        x="-70"
                        y="-10"
                        width="140"
                        height="20"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.92)"
                        stroke={sector.colorHex}
                        strokeWidth={isSelected ? '1.8' : '1'}
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill={sector.colorHex}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        [{sector.code}] {sector.riskScore}% {sector.riskLevel}
                      </text>

                      {/* Active Alert Density Flag Badge if alerts present */}
                      {sector.activeAlerts.length > 0 && (
                        <g transform="translate(48, -12)">
                          <rect
                            x="-8"
                            y="-6"
                            width="34"
                            height="14"
                            rx="3"
                            fill="#991b1b"
                            stroke="#f87171"
                            strokeWidth="0.8"
                          />
                          <text
                            x="9"
                            y="4"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            ! {sector.activeAlerts.length}
                          </text>
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          )}

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

          {/* Police Stations & Rapid Intercept Precincts */}
          {showPolice &&
            policeStations.map((station) => {
              const { x, y } = projectCoord(station.lat, station.lng);
              const isAlert = station.status === 'CODE_RED_ALERT';

              return (
                <g key={station.id} transform={`translate(${x}, ${y})`}>
                  {/* Outer Radar Dispatch Ring */}
                  <circle
                    r="20"
                    fill="rgba(59, 130, 246, 0.12)"
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    strokeDasharray="4,2"
                    className={isAlert ? 'animate-spin-slow' : ''}
                  />

                  {/* Pulsing Alert Ring if Code Red */}
                  {isAlert && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      className="animate-ping opacity-50"
                    />
                  )}

                  {/* Police Badge Emblem */}
                  <rect
                    x="-10"
                    y="-10"
                    width="20"
                    height="20"
                    rx="4"
                    fill="#1e3a8a"
                    stroke={isAlert ? '#ef4444' : '#60a5fa'}
                    strokeWidth="1.8"
                  />

                  {/* Blue LED Center */}
                  <circle cx="0" cy="0" r="3" fill="#93c5fd" />

                  {/* Station Callout HUD */}
                  <g transform="translate(14, -10)">
                    <rect
                      width="150"
                      height="28"
                      rx="4"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#3b82f6"
                      strokeWidth="1"
                    />
                    <text
                      x="6"
                      y="12"
                      fill="#93c5fd"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {station.callsign}
                    </text>
                    <text
                      x="6"
                      y="22"
                      fill="#cbd5e1"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {station.availableUnits} UNITS | CAD ONLINE
                    </text>
                  </g>
                </g>
              );
            })}

          {/* Intercept Vector from Closest Police Station to Selected Subject */}
          {selectedSubject && showPolice && policeStations.length > 0 && (() => {
            const subCoord = projectCoord(selectedSubject.currentLocation.lat, selectedSubject.currentLocation.lng);
            // find nearest station
            const nearest = policeStations.reduce((closest, current) => {
              const d1 = Math.hypot(selectedSubject.currentLocation.lat - closest.lat, selectedSubject.currentLocation.lng - closest.lng);
              const d2 = Math.hypot(selectedSubject.currentLocation.lat - current.lat, selectedSubject.currentLocation.lng - current.lng);
              return d2 < d1 ? current : closest;
            }, policeStations[0]);

            const stCoord = projectCoord(nearest.lat, nearest.lng);
            const midX = (subCoord.x + stCoord.x) / 2;
            const midY = (subCoord.y + stCoord.y) / 2;

            return (
              <g key="intercept-vector">
                {/* Dashed intercept vector */}
                <line
                  x1={stCoord.x}
                  y1={stCoord.y}
                  x2={subCoord.x}
                  y2={subCoord.y}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />

                {/* Tactical Intercept HUD Pill */}
                <g transform={`translate(${midX - 55}, ${midY - 10})`}>
                  <rect
                    width="110"
                    height="20"
                    rx="10"
                    fill="rgba(153, 27, 27, 0.9)"
                    stroke="#f87171"
                    strokeWidth="1"
                  />
                  <text
                    x="55"
                    y="13"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    POLICE INTERCEPT VECTOR
                  </text>
                </g>
              </g>
            );
          })()}

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

        {/* Floating Sector Risk Inspector Card (If a Sector is Clicked) */}
        {selectedSector && (
          <div className="absolute top-14 right-3 z-30 w-80 bg-slate-950/95 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-md font-mono text-xs animate-fadeIn space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded"
                  style={{
                    backgroundColor: `${selectedSector.colorHex}20`,
                    color: selectedSector.colorHex,
                    border: `1px solid ${selectedSector.colorHex}`,
                  }}
                >
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase">{selectedSector.code}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${selectedSector.colorHex}25`,
                        color: selectedSector.colorHex,
                        border: `1px solid ${selectedSector.colorHex}60`,
                      }}
                    >
                      {selectedSector.riskLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans line-clamp-1">
                    {selectedSector.name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSector(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Risk Meter Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Risk Intensity Index</span>
                <span className="font-bold font-mono" style={{ color: selectedSector.colorHex }}>
                  {selectedSector.riskScore}% / 100
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${selectedSector.riskScore}%`,
                    backgroundColor: selectedSector.colorHex,
                    boxShadow: `0 0 10px ${selectedSector.colorHex}`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              {selectedSector.description}
            </p>

            {/* Active Alerts in Sector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-850 pb-1">
                <span>ACTIVE SECTOR ALERTS</span>
                <span className="font-bold text-white">{selectedSector.activeAlerts.length} LOGGED</span>
              </div>
              {selectedSector.activeAlerts.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {selectedSector.activeAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 flex items-start gap-1.5"
                    >
                      <AlertOctagon className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white line-clamp-1">{alt.title}</div>
                        <div className="text-[9px] text-slate-400">{alt.subjectName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic">No unresolved critical alerts in this sector.</div>
              )}
            </div>

            {/* Monitored Subjects Present */}
            {selectedSector.subjectsInSector.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-850">
                <div className="text-[10px] text-slate-400">
                  TARGETS IN CORRIDOR: {selectedSector.subjectsInSector.map((s) => s.fullName).join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Map Legend */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800/80 backdrop-blur-md text-[11px] font-mono text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
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

          {/* Risk Heatmap Color Scale Legend */}
          {showHeatmap && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-[10px]">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>RISK SPECTRUM:</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> &gt;=70% Critical
                </span>
                <span className="flex items-center gap-1 text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> 45-69% High
                </span>
                <span className="flex items-center gap-1 text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> 25-44% Elevated
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> &lt;25% Nominal
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
