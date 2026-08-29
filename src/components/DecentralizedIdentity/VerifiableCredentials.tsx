import React, { useState } from 'react';
import { VerifiableCredential } from '../../types';
import { Award, ShieldCheck, CheckCircle2, AlertCircle, FileCheck, Lock, Eye } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface VerifiableCredentialsProps {
  credentials: VerifiableCredential[];
  onAddCredential: (cred: VerifiableCredential) => void;
}

export const VerifiableCredentials: React.FC<VerifiableCredentialsProps> = ({
  credentials,
  onAddCredential,
}) => {
  const [selectedCred, setSelectedCred] = useState<VerifiableCredential | null>(credentials[0] || null);

  return (
    <div className="space-y-6 font-mono">
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              VERIFIABLE CREDENTIALS (W3C VC STANDARD)
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
                CRYPTOGRAPHICALLY ATTESTED
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Portable, tamper-proof credentials issued by sovereign authorities and cryptographically verified on-device.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credential Selector */}
        <div className="space-y-3">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedCred(cred);
              }}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedCred?.id === cred.id
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{cred.type}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {cred.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">ID: {cred.id}</div>
              {cred.zkpProofAvailable && (
                <div className="mt-2 text-[10px] text-cyan-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ZKP Privacy Disclosure Available
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detailed Credential View */}
        <div className="lg:col-span-2">
          {selectedCred ? (
            <div className="rounded-xl bg-slate-950 border border-cyan-800/60 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    DECENTRALIZED CREDENTIAL PAYLOAD
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedCred.type}</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                </span>
              </div>

              {/* Claims Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">Attested Claims:</span>
                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  {Object.entries(selectedCred.claims).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 last:border-0">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-white font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata & Cryptographic Proof */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Issuer DID:</span> {selectedCred.issuerDid}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Subject DID:</span> {selectedCred.subjectDid}
                  </div>
                  <div className="text-[10px] text-amber-300/90 break-all font-mono">
                    <span className="text-slate-500">Ed25519 Proof:</span> {selectedCred.proofSignature}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Select a credential from the list to view cryptographic attestation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
