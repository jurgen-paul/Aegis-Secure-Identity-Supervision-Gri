import React from 'react';
import {
  Eye,
  KeyRound,
  ShieldCheck,
  FileCheck,
  BellRing,
  Cpu,
  Flame,
  Network,
  ListTodo,
  Award,
} from 'lucide-react';

export type ActiveTab = 'gods-eye' | 'ip-tracker' | 'most-wanted' | 'did-vault' | 'e2ee-mesh' | 'audit-dag' | 'containment' | 'ai-intel' | 'google-tasks' | 'security-assurance';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeAlertCount: number;
  fugitiveCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  activeAlertCount,
  fugitiveCount = 9,
}) => {
  const tabs = [
    {
      id: 'gods-eye' as ActiveTab,
      label: "God's Eye Viewer",
      subLabel: 'Track & Trace Grid',
      icon: Eye,
      badge: null,
      highlight: true,
    },
    {
      id: 'ip-tracker' as ActiveTab,
      label: 'IP Address Tracker',
      subLabel: 'Name • DOB • Village • City',
      icon: Network,
      badge: 'Live Locator',
    },
    {
      id: 'most-wanted' as ActiveTab,
      label: 'Most Wanted',
      subLabel: 'FBI • INTERPOL • MI6',
      icon: Flame,
      badge: `${fugitiveCount} WANTED`,
      badgeRed: true,
    },
    {
      id: 'did-vault' as ActiveTab,
      label: 'Decentralized ID',
      subLabel: 'W3C DID & ZKP Keyring',
      icon: KeyRound,
      badge: 'Zero-Server',
    },
    {
      id: 'e2ee-mesh' as ActiveTab,
      label: 'E2EE & Secure Nodes',
      subLabel: 'AES-256-GCM + Kyber',
      icon: ShieldCheck,
      badge: '18 Relays',
    },
    {
      id: 'audit-dag' as ActiveTab,
      label: 'Merkle Audit Trail',
      subLabel: 'Tamper-Evident Chain',
      icon: FileCheck,
      badge: 'Docs Export',
    },
    {
      id: 'containment' as ActiveTab,
      label: 'Alert Protocols',
      subLabel: 'Geofence Lockdown',
      icon: BellRing,
      badge: activeAlertCount > 0 ? `${activeAlertCount} ACTIVE` : null,
      badgeRed: activeAlertCount > 0,
    },
    {
      id: 'ai-intel' as ActiveTab,
      label: 'AI Threat Dossier',
      subLabel: 'Gemini Anomaly Intel',
      icon: Cpu,
      badge: 'AI Powered',
    },
    {
      id: 'google-tasks' as ActiveTab,
      label: 'Google Tasks',
      subLabel: 'Tactical Directives',
      icon: ListTodo,
      badge: 'Tasks API',
    },
    {
      id: 'security-assurance' as ActiveTab,
      label: 'OpenSSF Assurance',
      subLabel: 'FLOSS • Tests • SAST/DAST',
      icon: Award,
      badge: 'Silver Badge',
      highlight: true,
    },
  ];

  return (
    <nav className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-left transition-all shrink-0 cursor-pointer font-mono ${
                isActive
                  ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-md ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold whitespace-nowrap">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold whitespace-nowrap ${
                        tab.badgeRed
                          ? 'bg-red-500/30 border border-red-500 text-red-300 animate-pulse'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 hidden sm:block">
                  {tab.subLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
