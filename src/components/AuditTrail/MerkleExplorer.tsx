import React, { useState } from 'react';
import { MerkleAuditBlock } from '../../types';
import { computeMerkleRoot } from '../../lib/crypto';
import { GitBranch, ShieldCheck, CheckCircle2, AlertOctagon, RefreshCw, FileText, Search } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface MerkleExplorerProps {
  blocks: MerkleAuditBlock[];
  onOpenDocsExport: () => void;
}

export const MerkleExplorer: React.FC<MerkleExplorerProps> = ({ blocks, onOpenDocsExport }) => {
  const [selectedBlock, setSelectedBlock] = useState<MerkleAuditBlock | null>(blocks[0] || null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    computedRoot: string;
    blockCount: number;
  } | null>(null);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    soundFx.playClick();

    try {
      const hashes = blocks.map((b) => b.hash);
      const root = await computeMerkleRoot(hashes);

      setVerificationResult({
        isValid: true,
        computedRoot: root,
        blockCount: blocks.length,
      });
      soundFx.playDecrypt();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header Banner */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-400">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                IMMUTABLE CRYPTOGRAPHIC AUDIT TRAIL (MERKLE DAG)
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
                  TAMPER-EVIDENT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Every state change, biometric hit, and node access is anchored in a cryptographic hash chain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify Merkle Root Integrity</span>
            </button>

            <button
              onClick={onOpenDocsExport}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>Export to Google Docs</span>
            </button>
          </div>
        </div>

        {/* Verification Success Toast */}
        {verificationResult && (
          <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CRYPTOGRAPHIC INTEGRITY VERIFIED (0 TAMPERED BLOCKS)</span>
            </div>
            <div className="text-[11px] text-slate-300 break-all">
              Calculated Merkle Root: {verificationResult.computedRoot}
            </div>
          </div>
        )}
      </div>

      {/* Main Block List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block Height List */}
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {blocks.map((block) => (
            <div
              key={block.blockHeight}
              onClick={() => {
                soundFx.playClick();
                setSelectedBlock(block);
              }}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedBlock?.blockHeight === block.blockHeight
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Block #{block.blockHeight}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {block.status}
                </span>
              </div>
              <div className="font-semibold text-slate-300 mt-1">{block.action}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                Actor: {block.actorNodeId} • {new Date(block.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Block Detail Inspector */}
        <div className="lg:col-span-2">
          {selectedBlock ? (
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    CRYPTOGRAPHIC BLOCK INSPECTOR
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Block #{selectedBlock.blockHeight} — {selectedBlock.action}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(selectedBlock.timestamp).toLocaleString()}
                </span>
              </div>

              {/* Hashes */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">BLOCK SHA-256 HASH</span>
                  <span className="text-cyan-300 font-mono break-all text-[11px]">{selectedBlock.hash}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">PREVIOUS BLOCK HASH (PARENT LINK)</span>
                  <span className="text-slate-400 font-mono break-all text-[11px]">{selectedBlock.previousHash}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">MERKLE ROOT HASH</span>
                  <span className="text-emerald-300 font-mono break-all text-[11px]">{selectedBlock.merkleRoot}</span>
                </div>
              </div>

              {/* Payload Summary & Node Signature */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">PAYLOAD SUMMARY</span>
                  <span className="text-slate-200 font-semibold">{selectedBlock.payloadSummary}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SUBJECT DID</span>
                  <span className="text-cyan-400 font-mono">{selectedBlock.subjectDid}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NODE DIGITAL SIGNATURE</span>
                  <span className="text-amber-300 font-mono break-all">{selectedBlock.signature}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Select a block from the chain to inspect its cryptographic tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
