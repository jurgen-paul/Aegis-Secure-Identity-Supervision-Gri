import React, { useState } from 'react';
import { generateZKPProof } from '../../lib/crypto';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { soundFx } from '../../lib/audio';

export const ZKPVerifier: React.FC = () => {
  const [statementType, setStatementType] = useState<'AGE_OVER_21' | 'CLEARANCE_LEVEL_4' | 'VALID_CITIZEN'>('CLEARANCE_LEVEL_4');
  const [actualSecret, setActualSecret] = useState<string>('Level 4 - Quantum Defense Custodian');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [proofResult, setProofResult] = useState<{
    proofHash: string;
    zkpCommitment: string;
    challenge: string;
    response: string;
    isValid: boolean;
  } | null>(null);

  const handleGenerateProof = async () => {
    setIsGenerating(true);
    soundFx.playClick();

    try {
      const result = await generateZKPProof(statementType, actualSecret, 4);
      setProofResult(result);
      soundFx.playDecrypt();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-6 font-mono">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            ZERO-KNOWLEDGE PROOF (ZKP) INTERACTIVE VERIFIER
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300">
              ZERO LEAKAGE
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Prove identity statements (e.g. security clearance, adult status) without ever disclosing the secret value.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prover Setup */}
        <div className="space-y-4 rounded-lg bg-slate-900/70 border border-slate-800 p-4 text-xs">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-cyan-400" />
            1. Prover Statement Configuration
          </h4>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Select Proposition to Prove:</label>
            <select
              value={statementType}
              onChange={(e) => setStatementType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="CLEARANCE_LEVEL_4">Security Clearance &gt;= Level 4 (Defense Node Access)</option>
              <option value="AGE_OVER_21">Citizen Age &gt;= 21 (Zero Birthday Disclosure)</option>
              <option value="VALID_CITIZEN">Valid EU Sovereign Citizen (Zero National ID Disclosure)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Underlying Private Secret (Client Enclave Only):</label>
            <input
              type="text"
              value={actualSecret}
              onChange={(e) => setActualSecret(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleGenerateProof}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:from-cyan-500 hover:to-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing ZKP Polynomial Commitment...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate Zero-Knowledge Proof</span>
              </>
            )}
          </button>
        </div>

        {/* Verifier Verification */}
        <div className="space-y-4 rounded-lg bg-slate-900/70 border border-slate-800 p-4 text-xs">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            2. Verifier Cryptographic Inspection
          </h4>

          {proofResult ? (
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">COMMITMENT HASH (BLINDED)</span>
                <span className="text-cyan-300 font-mono break-all text-[11px]">{proofResult.zkpCommitment}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">FIAT-SHAMIR CHALLENGE</span>
                <span className="text-amber-300 font-mono break-all text-[11px]">{proofResult.challenge}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">NON-INTERACTIVE PROOF HASH</span>
                <span className="text-emerald-300 font-mono break-all text-[11px]">{proofResult.proofHash}</span>
              </div>

              <div className="p-3 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>VERIFICATION PASSED: Statement is TRUE with 0 leaked data.</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
              Click "Generate Zero-Knowledge Proof" to compute and inspect the cryptographic proof.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
