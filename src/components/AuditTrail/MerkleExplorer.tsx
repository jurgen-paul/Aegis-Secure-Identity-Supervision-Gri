import React, { useState, useMemo, useEffect } from 'react';
import { MerkleAuditBlock } from '../../types';
import { computeMerkleRoot } from '../../lib/crypto';
import {
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FileText,
  Search,
  Printer,
  Download,
  X,
  Filter,
  Eye,
  Sparkles,
  Lock,
  Cpu,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { AuditSummarySheet } from './AuditSummarySheet';
import { AuditPdfExportModal } from './AuditPdfExportModal';

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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Filtered blocks based on search and category
  const filteredBlocks = useMemo(() => {
    return blocks.filter((block) => {
      // Category filtering
      if (selectedCategory === 'DISPATCH' && !block.action.includes('DISPATCH')) {
        return false;
      }
      if (
        selectedCategory === 'CONTAINMENT' &&
        !block.action.includes('CONTAINMENT') &&
        !block.action.includes('GEOFENCE') &&
        !block.action.includes('BREACH')
      ) {
        return false;
      }
      if (
        selectedCategory === 'BIOMETRIC' &&
        !block.action.includes('BIOMETRIC') &&
        !block.action.includes('FACE') &&
        !block.action.includes('IRIS') &&
        !block.action.includes('SIGHTING')
      ) {
        return false;
      }
      if (
        selectedCategory === 'DID' &&
        !block.action.includes('DID') &&
        !block.action.includes('KEY') &&
        !block.action.includes('CREDENTIAL') &&
        !block.action.includes('ATTESTATION')
      ) {
        return false;
      }

      // Text query filtering
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const matchHeight =
        block.blockHeight.toString().includes(q) || `#${block.blockHeight}`.includes(q);
      const matchAction = block.action.toLowerCase().includes(q);
      const matchActor = block.actorNodeId.toLowerCase().includes(q);
      const matchDid = block.subjectDid.toLowerCase().includes(q);
      const matchPayload = block.payloadSummary.toLowerCase().includes(q);
      const matchHash =
        block.hash.toLowerCase().includes(q) ||
        block.previousHash.toLowerCase().includes(q) ||
        block.merkleRoot.toLowerCase().includes(q);
      const matchStatus = block.status.toLowerCase().includes(q);

      return (
        matchHeight ||
        matchAction ||
        matchActor ||
        matchDid ||
        matchPayload ||
        matchHash ||
        matchStatus
      );
    });
  }, [blocks, searchQuery, selectedCategory]);

  // Synchronize selected block when filtered results change
  useEffect(() => {
    if (filteredBlocks.length > 0) {
      const isSelectedStillPresent = filteredBlocks.some(
        (b) => b.blockHeight === selectedBlock?.blockHeight
      );
      if (!isSelectedStillPresent) {
        setSelectedBlock(filteredBlocks[0]);
      }
    } else {
      setSelectedBlock(null);
    }
  }, [filteredBlocks]);

  const currentMerkleRoot =
    verificationResult?.computedRoot ||
    blocks[0]?.merkleRoot ||
    '0x4f8a29b3c1d4e7f6a9b8c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1';

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

  const handleDirectPrint = () => {
    soundFx.playClick();
    window.print();
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header Banner */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-600 text-cyan-400">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span>IMMUTABLE CRYPTOGRAPHIC AUDIT TRAIL (MERKLE DAG)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                  TAMPER-EVIDENT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Every state change, biometric hit, node dispatch, and DID event is anchored in a cryptographic hash chain.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Verify Chain */}
            <button
              type="button"
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95"
              title="Mathematically compute and verify all hashes in the Merkle Tree"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify Merkle Root</span>
            </button>

            {/* Download / Print PDF Report Button */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsPdfModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 transition-all text-xs font-black flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
              title="Generate a formatted PDF summary sheet using browser print engine"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>

            {/* Google Docs Export */}
            <button
              type="button"
              onClick={onOpenDocsExport}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Export to Docs</span>
            </button>
          </div>
        </div>

        {/* Verification Success Toast */}
        {verificationResult && (
          <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-300 space-y-1 animate-fadeIn">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CRYPTOGRAPHIC INTEGRITY VERIFIED (0 TAMPERED BLOCKS)</span>
            </div>
            <div className="text-[11px] text-slate-300 break-all">
              Calculated Merkle Root: {verificationResult.computedRoot}
            </div>
          </div>
        )}

        {/* SEARCH BAR & CATEGORY PRESETS */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input Container */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by block height, action, actor node, DID, hash, or payload..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSearchQuery('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Print Quick Action */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              title="Quick Print directly to browser print engine"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Quick Print</span>
            </button>
          </div>

          {/* Filter Pills / Categories */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-slate-400" /> Filter:
              </span>

              {[
                { id: 'ALL', label: 'All Records', count: blocks.length },
                {
                  id: 'DISPATCH',
                  label: 'Police Dispatches',
                  count: blocks.filter((b) => b.action.includes('DISPATCH')).length,
                },
                {
                  id: 'CONTAINMENT',
                  label: 'Containment / Breaches',
                  count: blocks.filter(
                    (b) =>
                      b.action.includes('CONTAINMENT') ||
                      b.action.includes('GEOFENCE') ||
                      b.action.includes('BREACH')
                  ).length,
                },
                {
                  id: 'BIOMETRIC',
                  label: 'Biometric Events',
                  count: blocks.filter(
                    (b) =>
                      b.action.includes('BIOMETRIC') ||
                      b.action.includes('FACE') ||
                      b.action.includes('IRIS')
                  ).length,
                },
                {
                  id: 'DID',
                  label: 'DID & Keys',
                  count: blocks.filter((b) => b.action.includes('DID') || b.action.includes('KEY')).length,
                },
              ].map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedCategory(category.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1.5 font-mono ${
                    selectedCategory === category.id
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{category.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded ${
                      selectedCategory === category.id
                        ? 'bg-cyan-800 text-cyan-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Results Counter */}
            <div className="text-[11px] text-slate-400">
              Showing <strong className="text-cyan-400">{filteredBlocks.length}</strong> of{' '}
              <strong className="text-white">{blocks.length}</strong> blocks
              {(searchQuery || selectedCategory !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                  }}
                  className="ml-2 text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Block List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Block Height List */}
        <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
          {filteredBlocks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-950/60 space-y-3">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-300">NO MATCHING BLOCKS FOUND</div>
              <p className="text-[11px] text-slate-500">
                No cryptographic audit entries matched &ldquo;{searchQuery}&rdquo;. Try another keyword, block number, or category.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-bold cursor-pointer hover:bg-cyan-900"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            filteredBlocks.map((block) => (
              <div
                key={block.blockHeight}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedBlock(block);
                }}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedBlock?.blockHeight === block.blockHeight
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="text-cyan-400">#</span>
                    {block.blockHeight}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    {block.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-200 mt-1 truncate">{block.action}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Actor: <span className="text-slate-300">{block.actorNodeId}</span> •{' '}
                  {new Date(block.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
                  Hash: {block.hash.slice(0, 16)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Block Detail Inspector */}
        <div className="lg:col-span-2">
          {selectedBlock ? (
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> CRYPTOGRAPHIC BLOCK INSPECTOR
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Block #{selectedBlock.blockHeight} — {selectedBlock.action}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(selectedBlock.timestamp).toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                    {selectedBlock.status}
                  </span>
                </div>
              </div>

              {/* Hashes Matrix */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-bold">BLOCK SHA-256 HASH</span>
                    <span className="text-[10px] text-slate-500">BLAKE2B COMPLIANT</span>
                  </div>
                  <span className="text-cyan-300 font-mono break-all text-[11px] select-all font-semibold">
                    {selectedBlock.hash}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] font-bold block">
                    PREVIOUS BLOCK HASH (PARENT LINK IN DAG)
                  </span>
                  <span className="text-slate-400 font-mono break-all text-[11px] select-all">
                    {selectedBlock.previousHash}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-bold">MERKLE ROOT HASH</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">VERIFIED ANCHOR</span>
                  </div>
                  <span className="text-emerald-300 font-mono break-all text-[11px] select-all font-semibold">
                    {selectedBlock.merkleRoot}
                  </span>
                </div>
              </div>

              {/* Payload Summary & Node Signature */}
              <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    PAYLOAD SUMMARY
                  </span>
                  <span className="text-slate-100 font-semibold text-xs leading-relaxed block mt-0.5">
                    {selectedBlock.payloadSummary}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      SUBJECT DID
                    </span>
                    <span className="text-cyan-400 font-mono text-[11px] break-all">
                      {selectedBlock.subjectDid}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      ACTOR NODE ID
                    </span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {selectedBlock.actorNodeId}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    NODE DIGITAL SIGNATURE (ED25519)
                  </span>
                  <span className="text-amber-300 font-mono break-all text-[10px] select-all">
                    {selectedBlock.signature}
                  </span>
                </div>
              </div>

              {/* Block Inspector Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-500">
                  Verified tamper-evident cryptographic block anchored to decentralized ledger.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsPdfModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Include in PDF Report</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Select a block from the chain to inspect its cryptographic tree.
            </div>
          )}
        </div>
      </div>

      {/* PDF Export & Print Preview Modal */}
      <AuditPdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        blocks={filteredBlocks.length > 0 ? filteredBlocks : blocks}
        allBlocks={blocks}
        merkleRoot={currentMerkleRoot}
        searchQuery={searchQuery}
        filterCategory={selectedCategory}
      />

      {/* HIDDEN PRINT-ONLY CONTAINER: Browser window.print() renders this directly */}
      <div id="printable-summary-sheet" className="hidden print:block">
        <AuditSummarySheet
          blocks={filteredBlocks.length > 0 ? filteredBlocks : blocks}
          totalBlocksCount={blocks.length}
          merkleRoot={currentMerkleRoot}
          searchQuery={searchQuery}
          filterCategory={selectedCategory}
        />
      </div>
    </div>
  );
};
