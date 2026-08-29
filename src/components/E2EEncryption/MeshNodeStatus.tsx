import React from 'react';
import { SurveillanceNode } from '../../types';
import { Server, ShieldCheck, Radio, Activity, Zap, Cpu, Lock } from 'lucide-react';

interface MeshNodeStatusProps {
  nodes: SurveillanceNode[];
}

export const MeshNodeStatus: React.FC<MeshNodeStatusProps> = ({ nodes }) => {
  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              DECENTRALIZED SECURE NODE RELAY TOPOLOGY
            </h3>
            <p className="text-[11px] text-slate-400">
              Mesh nodes route encrypted telemetry & verify zero-knowledge proofs
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          18 NODES ONLINE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const isAlert = node.status === 'ALERT_LOCK';
          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border text-xs space-y-3 ${
                isAlert
                  ? 'bg-red-950/40 border-red-800/80'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{node.nodeName}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                    isAlert
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  }`}
                >
                  {node.status}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Type:</span>
                  <span className="text-slate-200">{node.type}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Throughput:</span>
                  <span className="text-cyan-300 font-bold">{node.packetThroughputKbps} Kbps</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Clients / Beacons:</span>
                  <span className="text-slate-200">{node.connectedClients} active</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Quantum Lattice:</span>
                  <span className="text-emerald-400 font-bold">KYBER-768 ON</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
