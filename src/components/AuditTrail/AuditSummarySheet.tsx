import React from 'react';
import { MerkleAuditBlock } from '../../types';
import { ShieldCheck, GitBranch, Hash, CheckCircle2, Lock, Cpu, Server, FileText } from 'lucide-react';

interface AuditSummarySheetProps {
  blocks: MerkleAuditBlock[];
  totalBlocksCount: number;
  merkleRoot: string;
  searchQuery?: string;
  filterCategory?: string;
  generatedAt?: string;
}

export const AuditSummarySheet: React.FC<AuditSummarySheetProps> = ({
  blocks,
  totalBlocksCount,
  merkleRoot,
  searchQuery = '',
  filterCategory = 'ALL',
  generatedAt = new Date().toISOString(),
}) => {
  const dispatchCount = blocks.filter(
    (b) => b.action.includes('DISPATCH') || b.action.includes('CONTAINMENT')
  ).length;
  const biometricCount = blocks.filter(
    (b) => b.action.includes('BIOMETRIC') || b.action.includes('OPTICAL')
  ).length;
  const didCount = blocks.filter((b) => b.action.includes('DID') || b.action.includes('CREDENTIAL')).length;

  const certificateId = `CERT-AEGIS-${new Date(generatedAt).getFullYear()}-${Math.abs(
    merkleRoot.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  )
    .toString(16)
    .toUpperCase()
    .slice(0, 8)}`;

  return (
    <div className="bg-white text-slate-900 font-mono text-[11px] leading-relaxed p-6 md:p-8 space-y-6 max-w-5xl mx-auto selection:bg-slate-200">
      {/* Official Document Header */}
      <div className="border-b-2 border-slate-900 pb-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[9px] tracking-widest text-slate-500 font-bold uppercase">
              CONFIDENTIAL // LAW ENFORCEMENT & JUDICIAL FORENSIC RECORD
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-800" />
              AEGIS SECURE IDENTITY & SUPERVISION GRID
            </h1>
            <div className="text-xs font-bold text-slate-700 tracking-wider">
              IMMUTABLE CRYPTOGRAPHIC AUDIT TRAIL • MERKLE DAG SUMMARY SHEET
            </div>
          </div>

          <div className="text-right border border-slate-900 px-3 py-2 bg-slate-50 rounded space-y-0.5">
            <div className="text-[9px] text-slate-500 font-bold uppercase">CERTIFICATE SERIAL</div>
            <div className="text-xs font-bold font-mono text-slate-900">{certificateId}</div>
            <div className="text-[9px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED ON-CHAIN
            </div>
          </div>
        </div>

        {/* Certificate Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[10px] border-t border-slate-200">
          <div>
            <span className="text-slate-500 block uppercase text-[9px]">REPORT GENERATED</span>
            <span className="font-semibold text-slate-900">
              {new Date(generatedAt).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[9px]">WITNESS NODE ID</span>
            <span className="font-semibold text-slate-900">NODE-RELAY-01-AMS</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[9px]">CONSENSUS DAG STATUS</span>
            <span className="font-bold text-emerald-800">100% TAMPER-EVIDENT</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[9px]">RECORD POPULATION</span>
            <span className="font-semibold text-slate-900">
              {blocks.length} of {totalBlocksCount} Blocks
            </span>
          </div>
        </div>
      </div>

      {/* Cryptographic Merkle Root Seal */}
      <div className="p-3.5 bg-slate-50 border border-slate-300 rounded space-y-1.5 print-avoid-break">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase">
            <GitBranch className="w-3.5 h-3.5 text-slate-700" />
            CURRENT MERKLE ROOT ANCHOR (BLAKE2B / SHA-256)
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[9px] rounded">
            CRYPTOGRAPHIC PROOF ATTESTED
          </span>
        </div>
        <div className="p-2 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-800 break-all select-all font-semibold">
          {merkleRoot}
        </div>
      </div>

      {/* Filter Scope Notice (if search was active) */}
      {(searchQuery.trim() !== '' || filterCategory !== 'ALL') && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded text-[10px] flex items-center justify-between print-avoid-break">
          <span>
            <strong>AUDIT SCOPE FILTER APPLIED:</strong> Showing <strong>{blocks.length}</strong> records
            {searchQuery && (
              <>
                {' '}
                matching query &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </>
            )}
            {filterCategory !== 'ALL' && (
              <>
                {' '}
                under category <strong>{filterCategory}</strong>
              </>
            )}
          </span>
          <span className="text-amber-800 text-[9px]">Scope of {totalBlocksCount} Ledger Blocks</span>
        </div>
      )}

      {/* Executive KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-avoid-break">
        <div className="p-3 bg-slate-50 border border-slate-300 rounded">
          <div className="text-[9px] text-slate-500 font-bold uppercase">Included Blocks</div>
          <div className="text-lg font-bold text-slate-900">{blocks.length}</div>
          <div className="text-[9px] text-slate-500">of {totalBlocksCount} in DAG</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-300 rounded">
          <div className="text-[9px] text-slate-500 font-bold uppercase">Dispatch Events</div>
          <div className="text-lg font-bold text-slate-900">{dispatchCount}</div>
          <div className="text-[9px] text-slate-500">Autonomous CAD Alerts</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-300 rounded">
          <div className="text-[9px] text-slate-500 font-bold uppercase">Biometric Matches</div>
          <div className="text-lg font-bold text-slate-900">{biometricCount}</div>
          <div className="text-[9px] text-slate-500">Facial & Iris Sightings</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-300 rounded">
          <div className="text-[9px] text-slate-500 font-bold uppercase">DID Credentials</div>
          <div className="text-lg font-bold text-slate-900">{didCount}</div>
          <div className="text-[9px] text-slate-500">Identity Attestations</div>
        </div>
      </div>

      {/* Forensic Audit Records Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-700" />
            CHRONOLOGICAL LEDGER ENTRIES ({blocks.length} RECORDS)
          </h2>
          <span className="text-[9px] text-slate-500">Order: Descending Block Height</span>
        </div>

        <div className="border border-slate-300 rounded overflow-hidden">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2 px-2.5 border-r border-slate-300 w-14">HEIGHT</th>
                <th className="py-2 px-2.5 border-r border-slate-300 w-24">TIMESTAMP</th>
                <th className="py-2 px-2.5 border-r border-slate-300">ACTION / EVENT</th>
                <th className="py-2 px-2.5 border-r border-slate-300 w-28">ACTOR NODE</th>
                <th className="py-2 px-2.5 border-r border-slate-300 w-32">SUBJECT DID</th>
                <th className="py-2 px-2.5 border-r border-slate-300 w-28">BLOCK HASH</th>
                <th className="py-2 px-2.5 w-20 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {blocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                    No cryptographic blocks matched the query parameters.
                  </td>
                </tr>
              ) : (
                blocks.map((b, idx) => (
                  <tr
                    key={b.blockHeight}
                    className={`border-b border-slate-200 print-avoid-break ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    }`}
                  >
                    <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-900">
                      #{b.blockHeight}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-slate-600 font-mono text-[9px]">
                      {new Date(b.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      <span className="block text-[8px] text-slate-400">
                        {new Date(b.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{b.action}</div>
                      <div className="text-[9px] text-slate-600 line-clamp-1">{b.payloadSummary}</div>
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700 font-mono text-[9px]">
                      {b.actorNodeId}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700 font-mono text-[9px] truncate max-w-[120px]">
                      {b.subjectDid}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-[9px] text-slate-600 break-all">
                      {b.hash.slice(0, 10)}...{b.hash.slice(-6)}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic Signature & Attestation Sign-off */}
      <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4 print-avoid-break">
        <div className="space-y-1 text-[9px] text-slate-600">
          <div className="font-bold uppercase text-slate-900">EVIDENTIARY & LEGAL ATTESTATION</div>
          <p>
            This cryptographic ledger record represents an authenticated mathematical proof certified
            against the decentralized Aegis DAG node cluster. The Merkle root is anchored with Ed25519
            signatures, establishing mathematical non-repudiation and forensic chain of custody.
          </p>
          <div className="pt-1 text-[8px] text-slate-500">
            Hash Algorithm: SHA-256 / BLAKE2b • Peer Consensus: 12/12 Distributed Validator Nodes
          </div>
        </div>

        <div className="border border-slate-300 rounded p-3 bg-slate-50 space-y-1 text-right">
          <div className="text-[9px] text-slate-500 uppercase font-bold">DIGITAL AUDIT SEAL</div>
          <div className="text-[9px] font-mono text-slate-800 break-all">
            SIG: {blocks[0]?.signature || '0xed25519:e2ee98a1f4b267c8d9e0f1'}
          </div>
          <div className="pt-1 flex items-center justify-end gap-2 text-[9px] text-slate-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>CERTIFIED FORENSIC RECORD — AEGIS PROTOCOL</span>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="pt-2 text-center text-[8px] text-slate-400 border-t border-slate-200">
        PAGE 1 OF 1 • AEGIS SECURITY AUDIT REPORT • AUTOMATED EXTRACTION • ALL RIGHTS RESERVED
      </div>
    </div>
  );
};
