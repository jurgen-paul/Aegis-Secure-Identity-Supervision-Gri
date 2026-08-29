import React, { useState } from 'react';
import { CCTVCameraFeed, TrackedSubject } from '../../types';
import { Video, Eye, Shield, Radio, RefreshCw, Maximize2, AlertCircle } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface RealTimeSurveillanceFeedProps {
  feeds: CCTVCameraFeed[];
  subjects: TrackedSubject[];
  onSelectSubject: (subject: TrackedSubject) => void;
}

export const RealTimeSurveillanceFeed: React.FC<RealTimeSurveillanceFeedProps> = ({
  feeds,
  subjects,
  onSelectSubject,
}) => {
  const [selectedFeedId, setSelectedFeedId] = useState<string>(feeds[0]?.id || '');
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'NEURAL' | 'THERMAL'>('ALL');

  const currentFeed = feeds.find((f) => f.id === selectedFeedId) || feeds[0];

  const handleTargetClick = (subjectId: string) => {
    const sub = subjects.find((s) => s.id === subjectId);
    if (sub) {
      soundFx.playLockOn();
      onSelectSubject(sub);
    }
  };

  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              REAL-TIME NEURAL CCTV SURVEILLANCE MATRIX
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-600/30 border border-red-500 text-red-300 animate-pulse">
                LIVE OPTICAL FEED
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Facial Landmark Vectoring & Neural Recognition Linked to Gov Databases
            </p>
          </div>
        </div>

        {/* Camera Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {feeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedFeedId(feed.id);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                selectedFeedId === feed.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CAM-{feed.id.slice(-3)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Video Screen Canvas */}
      {currentFeed && (
        <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-900 border border-cyan-800/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center">
          {/* Simulated CCTV Background Image / Shader */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950">
            <img
              src="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&h=800&fit=crop"
              alt="CCTV Background"
              className="w-full h-full object-cover opacity-35 filter contrast-125 saturate-50"
            />
          </div>

          {/* CCTV HUD Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />

          {/* Top Left Feed Telemetry */}
          <div className="absolute top-3 left-3 z-10 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded text-[11px] text-slate-300 space-y-0.5">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{currentFeed.cameraName}</span>
            </div>
            <div className="text-slate-400 text-[10px]">
              {currentFeed.sector} • {currentFeed.resolution} • {currentFeed.fps} FPS
            </div>
          </div>

          {/* Top Right Live Timecode */}
          <div className="absolute top-3 right-3 z-10 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded text-[11px] text-emerald-400 font-bold">
            REC ● {new Date().toLocaleTimeString()} [E2EE STREAM]
          </div>

          {/* Simulated Face Recognition Bounding Boxes on Targets */}
          {currentFeed.activeTargets.map((target) => (
            <div
              key={target.trackingId}
              onClick={() => handleTargetClick(target.subjectId)}
              style={{
                left: `${target.boundingBox.x}%`,
                top: `${target.boundingBox.y}%`,
                width: `${target.boundingBox.width}%`,
                height: `${target.boundingBox.height}%`,
              }}
              className="absolute border-2 border-red-500 rounded bg-red-500/10 cursor-pointer group hover:bg-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.6)]"
            >
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

              {/* Target Information Tag */}
              <div className="absolute -top-10 left-0 bg-slate-950/95 border border-red-500 px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap shadow-lg">
                <div className="text-red-400 font-bold">{target.subjectName}</div>
                <div className="text-cyan-300 text-[9px]">
                  NEURAL MATCH: {target.matchConfidence}% [CLICK TO INSPECT]
                </div>
              </div>
            </div>
          ))}

          {/* Center Target Acquisition Crosshair */}
          <div className="absolute pointer-events-none opacity-40">
            <div className="w-16 h-16 rounded-full border border-cyan-400/60" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/60" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400/60" />
          </div>
        </div>
      )}
    </div>
  );
};
