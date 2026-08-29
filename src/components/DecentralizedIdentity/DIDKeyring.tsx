import React, { useState } from 'react';
import { SovereignDID } from '../../types';
import { generateSovereignDID } from '../../lib/crypto';
import { KeyRound, Shield, Plus, Copy, Check, Users, RefreshCw, Lock, Award } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface DIDKeyringProps {
  dids: SovereignDID[];
  onAddDID: (did: SovereignDID) => void;
}

export const DIDKeyring: React.FC<DIDKeyringProps> = ({ dids, onAddDID }) => {
  const [aliasInput, setAliasInput] = useState('');
  const [copiedDID, setCopiedDID] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'DIDS' | 'GUARDIANS' | 'ZERO_AUTH'>('DIDS');

  // Zero-server auth challenge state
  const [authChallenge, setAuthChallenge] = useState<string>('');
  const [authSignature, setAuthSignature] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<'IDLE' | 'SIGNED' | 'VERIFIED'>('IDLE');

  const handleCreateDID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasInput.trim()) return;

    setIsGenerating(true);
    soundFx.playClick();

    try {
      const generated = await generateSovereignDID(aliasInput.trim());
      const newDID: SovereignDID = {
        did: generated.did,
        alias: aliasInput.trim(),
        publicKeyHex: generated.publicKeyHex,
        keyType: 'Ed25519',
        createdDate: new Date().toISOString(),
        isPrimary: dids.length === 0,
        credentialsCount: 0,
        seedPhrasePreview: generated.seedPhrase,
        guardians: ['did:aegis:guardian-primary-node'],
      };

      onAddDID(newDID);
      setAliasInput('');
      soundFx.playDecrypt();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDID(id);
    soundFx.playClick();
    setTimeout(() => setCopiedDID(null), 2000);
  };

  const handleRunZeroServerAuth = (did: SovereignDID) => {
    soundFx.playClick();
    const challengeNonce = `AUTH_CHALLENGE_${Date.now()}_NONCE_${Math.random().toString(36).substring(2, 9)}`;
    setAuthChallenge(challengeNonce);
    // Sign challenge with client-side key
    const sig = `0xed25519_sig_${did.publicKeyHex.substring(0, 20)}_${Date.now()}`;
    setAuthSignature(sig);
    setAuthStatus('SIGNED');

    setTimeout(() => {
      setAuthStatus('VERIFIED');
      soundFx.playDecrypt();
    }, 600);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Overview Banner */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-600 text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              DECENTRALIZED IDENTITY (DID) & SOVEREIGN KEYRING
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
                W3C DID v1.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Eliminates centralized login servers via cryptographic Ed25519 keypairs, seed recovery, and multi-sig guardians.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('DIDS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'DIDS'
              ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          My Sovereign DIDs ({dids.length})
        </button>
        <button
          onClick={() => setActiveTab('GUARDIANS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'GUARDIANS'
              ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          Multi-Signature Guardians
        </button>
        <button
          onClick={() => setActiveTab('ZERO_AUTH')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ZERO_AUTH'
              ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          Zero-Server Auth Simulator
        </button>
      </div>

      {activeTab === 'DIDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Create New DID */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Generate Sovereign Identity
            </h3>

            <form onSubmit={handleCreateDID} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Identity Alias / Citizen Name
                </label>
                <input
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  placeholder="e.g. Elena Rostova (Personal Vault)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !aliasInput.trim()}
                className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deriving Cryptographic Keypair...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Generate W3C DID Keyring</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-bold text-cyan-300">🔒 Zero-Knowledge Guarantee:</div>
              <div>Private keys are computed locally via WebCrypto and never transmitted to any centralized database.</div>
            </div>
          </div>

          {/* Right Column: DID List */}
          <div className="lg:col-span-2 space-y-3">
            {dids.map((did) => (
              <div
                key={did.did}
                className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-3 relative hover:border-cyan-700/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{did.alias}</h4>
                      {did.isPrimary && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold">
                          PRIMARY KEY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Created: {new Date(did.createdDate).toLocaleDateString()} • Standard: {did.keyType}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunZeroServerAuth(did)}
                    className="px-3 py-1.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 hover:text-white transition-all text-xs font-bold cursor-pointer"
                  >
                    Test Zero-Server Login
                  </button>
                </div>

                {/* DID URI */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div className="text-cyan-400 font-mono break-all">{did.did}</div>
                  <button
                    onClick={() => handleCopy(did.did, did.did)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                    title="Copy DID"
                  >
                    {copiedDID === did.did ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Public Key & Recovery Seed Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">PUBLIC ENCLAVE KEY</span>
                    <span className="text-slate-300 font-mono truncate block">{did.publicKeyHex}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">RECOVERY SEED PHRASE</span>
                    <span className="text-amber-300/90 font-mono truncate block">{did.seedPhrasePreview}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'GUARDIANS' && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Social Recovery & Multi-Signature Guardians
          </h3>
          <p className="text-xs text-slate-400">
            Shamir Secret Sharing + 2-of-3 Threshold Guardian Recovery allows restoring sovereign keys without relying on cloud password resets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400">Guardian 1 (Hardware Security Token)</span>
              <p className="text-[11px] text-slate-400">YubiKey Bio Enclave (did:aegis:guardian-hw-01)</p>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                ACTIVE & SYNCED
              </span>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400">Guardian 2 (Trusted Node Relay)</span>
              <p className="text-[11px] text-slate-400">Amsterdam Centraal Defense Beacon</p>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                ACTIVE & SYNCED
              </span>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400">Guardian 3 (Offline Cold Air-Gap)</span>
              <p className="text-[11px] text-slate-400">Encrypted Paper Vault Key</p>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                STANDBY
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ZERO_AUTH' && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Zero-Server Authentication Protocol
          </h3>
          <p className="text-xs text-slate-400">
            Demonstrates how users authenticate securely by cryptographically signing a transient challenge using their private key. No passwords or central user databases exist to be breached.
          </p>

          {authStatus !== 'IDLE' ? (
            <div className="space-y-3 p-4 rounded-lg bg-slate-900 border border-cyan-800/80 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">CHALLENGE NONCE ISSUED BY RELAY</span>
                <span className="text-cyan-300 font-mono break-all">{authChallenge}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">CLIENT-SIDE ED25519 SIGNATURE</span>
                <span className="text-amber-300 font-mono break-all">{authSignature}</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-600">
                  <Check className="w-4 h-4" />
                </span>
                <span className="font-bold text-emerald-400">
                  AUTHENTICATION SUCCESSFUL (Zero server records required)
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              Click "Test Zero-Server Login" on any DID card above to simulate cryptographic authentication.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
