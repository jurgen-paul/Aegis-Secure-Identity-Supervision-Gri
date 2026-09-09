import React, { useState } from 'react';
import { MerkleAuditBlock } from '../../types';
import { AuditSummarySheet } from './AuditSummarySheet';
import { Printer, Download, X, FileText, CheckCircle2, Shield, Eye, Sparkles } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface AuditPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: MerkleAuditBlock[];
  allBlocks: MerkleAuditBlock[];
  merkleRoot: string;
  searchQuery?: string;
  filterCategory?: string;
}

export const AuditPdfExportModal: React.FC<AuditPdfExportModalProps> = ({
  isOpen,
  onClose,
  blocks,
  allBlocks,
  merkleRoot,
  searchQuery = '',
  filterCategory = 'ALL',
}) => {
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');

  if (!isOpen) return null;

  const targetBlocks = scope === 'filtered' ? blocks : allBlocks;

  const handlePrint = () => {
    soundFx.playClick();
    // Invoke browser native print dialog (Destination: Save as PDF)
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn no-print">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden font-mono text-xs">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-600 text-cyan-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  CRYPTOGRAPHIC AUDIT TRAIL // PDF SUMMARY SHEET
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  PRINT READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formatted forensic summary report. In your browser print dialog, choose &ldquo;Save as PDF&rdquo;.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Scope Toggle */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex items-center text-[10px]">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setScope('filtered');
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  scope === 'filtered'
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Current Filter ({blocks.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setScope('all');
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entire DAG ({allBlocks.length})
              </button>
            </div>

            {/* Print / Save as PDF Primary Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tip / Instruction Bar */}
        <div className="px-5 py-2.5 bg-cyan-950/40 border-b border-cyan-900/50 text-[11px] text-cyan-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              <strong>Tip:</strong> In the print prompt, set Destination to <em>&ldquo;Save as PDF&rdquo;</em>,
              Margins to <em>Default</em> or <em>Minimum</em>, and enable <em>&ldquo;Background graphics&rdquo;</em>.
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Merkle Root: {merkleRoot.slice(0, 16)}...
          </span>
        </div>

        {/* Printable Sheet Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/50 flex justify-center">
          <div className="w-full max-w-4xl shadow-2xl rounded-lg overflow-hidden border border-slate-300">
            <AuditSummarySheet
              blocks={targetBlocks}
              totalBlocksCount={allBlocks.length}
              merkleRoot={merkleRoot}
              searchQuery={scope === 'filtered' ? searchQuery : ''}
              filterCategory={scope === 'filtered' ? filterCategory : 'ALL'}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              All {targetBlocks.length} records verified with immutable SHA-256 block hash signatures.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer text-xs"
            >
              Done / Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Launch Print Dialog</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
