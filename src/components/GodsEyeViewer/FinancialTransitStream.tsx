import React, { useState } from 'react';
import { TrackedSubject, BankcardTransaction, TransitEvent } from '../../types';
import { CreditCard, Train, AlertTriangle, CheckCircle, Search, Filter, ShieldAlert } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface FinancialTransitStreamProps {
  subjects: TrackedSubject[];
  onSelectSubject: (subject: TrackedSubject) => void;
}

export const FinancialTransitStream: React.FC<FinancialTransitStreamProps> = ({
  subjects,
  onSelectSubject,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'FLAGGED' | 'BANKCARD' | 'TRANSIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Flatten all transactions and transit events
  const allEvents = subjects.flatMap((sub) => {
    const txs = sub.bankcardTransactions.map((tx) => ({
      type: 'BANKCARD' as const,
      id: tx.id,
      timestamp: tx.timestamp,
      subject: sub,
      title: `${tx.merchant} (${tx.cardMask})`,
      subtitle: `Terminal ${tx.terminalId} • ${tx.authMethod}`,
      amount: `€${tx.amount.toFixed(2)}`,
      isFlagged: tx.isFlagged,
      flagReason: tx.flagReason,
      icon: CreditCard,
    }));

    const transit = sub.transitEvents.map((tr) => ({
      type: 'TRANSIT' as const,
      id: tr.id,
      timestamp: tr.timestamp,
      subject: sub,
      title: `${tr.stationOrGate} [${tr.transitType}]`,
      subtitle: `Route ${tr.routeId} • Direction: ${tr.direction}`,
      amount: tr.biometricGateMatched ? 'Biometric Gate Passed' : 'Manual Scan',
      isFlagged: tr.anomalyDetected,
      flagReason: tr.anomalyDetected ? 'Transit passage synchronized with geofence alert' : undefined,
      icon: Train,
    }));

    return [...txs, ...transit];
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredEvents = allEvents.filter((ev) => {
    if (filterType === 'FLAGGED' && !ev.isFlagged) return false;
    if (filterType === 'BANKCARD' && ev.type !== 'BANKCARD') return false;
    if (filterType === 'TRANSIT' && ev.type !== 'TRANSIT') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ev.subject.fullName.toLowerCase().includes(q) ||
        ev.title.toLowerCase().includes(q) ||
        ev.subtitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-4 font-mono">
      {/* Stream Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-950 border border-blue-700/60 text-blue-300">
              <CreditCard className="w-4 h-4" />
            </span>
            BANKCARD & PUBLIC TRANSPORT SURVEILLANCE FEED
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-Time POS, ATM, Metro Gate, and Transit Intercept Matrix Linked to Gov DB
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {(['ALL', 'FLAGGED', 'BANKCARD', 'TRANSIT'] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => {
                soundFx.playClick();
                setFilterType(ft);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                filterType === ft
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by subject name, merchant, or transit terminal..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Event Stream List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No transactions or transit events matching the criteria.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const Icon = ev.icon;
            return (
              <div
                key={ev.id}
                onClick={() => {
                  soundFx.playLockOn();
                  onSelectSubject(ev.subject);
                }}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.008] ${
                  ev.isFlagged
                    ? 'bg-red-950/30 border-red-800/80 hover:bg-red-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-cyan-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      ev.isFlagged
                        ? 'bg-red-600/30 text-red-300 animate-pulse'
                        : 'bg-slate-800 text-cyan-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{ev.title}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-cyan-300 font-semibold">{ev.subject.fullName}</span>
                      {ev.isFlagged && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> FLAGGED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {ev.subtitle} • {new Date(ev.timestamp).toLocaleTimeString()}
                    </div>
                    {ev.flagReason && (
                      <div className="text-[11px] text-red-400 font-semibold mt-0.5">
                        ⚠️ {ev.flagReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-white text-xs">{ev.amount}</div>
                  <div className="text-[10px] text-slate-500">
                    {ev.type === 'BANKCARD' ? 'SWIFT/POS' : 'METRO GATE'}
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
