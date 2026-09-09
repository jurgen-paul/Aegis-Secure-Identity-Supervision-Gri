import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  FileCheck2,
  ListTodo,
  Terminal,
  RefreshCw,
  Sparkles,
  Zap,
  Play,
  Square,
  Flame,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { TrackedSubject, ActiveAlertLog } from '../../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionExecuted?: {
    type: string;
    payload?: string;
  };
  isAlertFeedback?: boolean;
}

interface SecurityChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  isLockdownActive: boolean;
  onToggleLockdown: () => void;
  subjects: TrackedSubject[];
  activeAlerts: ActiveAlertLog[];
  onSelectSubject?: (subject: TrackedSubject) => void;
  onOpenTasks?: () => void;
  onOpenCadDispatch?: (subject: TrackedSubject, alert?: ActiveAlertLog) => void;
  pendingAlertForFeedback?: ActiveAlertLog | null;
  onClearPendingAlertFeedback?: () => void;
}

export const SecurityChatbot: React.FC<SecurityChatbotProps> = ({
  isOpen,
  onClose,
  isLockdownActive,
  onToggleLockdown,
  subjects,
  activeAlerts,
  onSelectSubject,
  onOpenTasks,
  onOpenCadDispatch,
  pendingAlertForFeedback,
  onClearPendingAlertFeedback,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'AEGIS Sentinel Tactical Security Assistant initialized. Standing by for orbital surveillance commands, lockdown protocols, Merkle DAG integrity verification, and alert triage.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Handle incoming Alert Feedback requests from external triggers
  useEffect(() => {
    if (pendingAlertForFeedback && isOpen) {
      handleRequestAlertFeedback(pendingAlertForFeedback);
      if (onClearPendingAlertFeedback) {
        onClearPendingAlertFeedback();
      }
    }
  }, [pendingAlertForFeedback, isOpen]);

  // Setup Web Speech Recognition for voice input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
          soundFx.playClick();
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    soundFx.playClick();
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    }
  };

  // Speak bot response using speech synthesis
  const speakBotResponse = (text: string) => {
    if (!isVoiceEnabled) return;
    setIsSpeakingNow(true);
    soundFx.speakVoice(text, {
      onEnd: () => setIsSpeakingNow(false),
    });
  };

  const handleStopSpeaking = () => {
    soundFx.stopSpeaking();
    setIsSpeakingNow(false);
  };

  // Send message to server
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isLoading) return;

    soundFx.playClick();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/security-bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-8).map((m) => ({
            role: m.sender,
            content: m.text,
          })),
          systemState: {
            lockdown: isLockdownActive,
          },
          activeThreats: activeAlerts,
          trackedSubjects: subjects,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const botReply = data.reply || 'Directive acknowledged.';

      // Execute Security Action if returned by the Bot
      let actionExecuted: { type: string; payload?: string } | undefined = undefined;
      if (data.action) {
        actionExecuted = data.action;
        executeSecurityAction(data.action);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted,
      };

      setMessages((prev) => [...prev, botMsg]);
      soundFx.playDecrypt();

      // Intelligent Voice Talkback
      if (isVoiceEnabled && data.voiceText) {
        speakBotResponse(data.voiceText);
      }
    } catch (err: any) {
      console.error('Bot request failed:', err);
      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `Telemetry handshake timeout: ${err.message || 'Mesh relay unassisted'}. Local containment safeguards remain armed.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute recognized tactical actions
  const executeSecurityAction = (action: { type: string; payload?: any }) => {
    switch (action.type) {
      case 'LOCKDOWN':
        if (!isLockdownActive) {
          onToggleLockdown();
          soundFx.playAlarm();
        }
        break;
      case 'UNLOCK':
        if (isLockdownActive) {
          onToggleLockdown();
          soundFx.playClick();
        }
        break;
      case 'DISPATCH_POLICE':
        if (subjects.length > 0 && onOpenCadDispatch) {
          const highRisk = subjects.find((s) => s.threatLevel === 'CRITICAL') || subjects[0];
          onOpenCadDispatch(highRisk, activeAlerts[0]);
        }
        break;
      case 'OPEN_TASKS':
        if (onOpenTasks) {
          onOpenTasks();
        }
        break;
      case 'FOCUS_SUBJECT':
        if (action.payload && onSelectSubject) {
          const matched = subjects.find(
            (s) =>
              s.id.toLowerCase() === action.payload.toLowerCase() ||
              s.fullName.toLowerCase().includes(action.payload.toLowerCase()) ||
              s.alias.toLowerCase().includes(action.payload.toLowerCase())
          );
          if (matched) onSelectSubject(matched);
        }
        break;
      case 'VERIFY_AUDIT':
        soundFx.playDecrypt();
        break;
      default:
        break;
    }
  };

  // Immediate Tactical Feedback on a Specific Alert
  const handleRequestAlertFeedback = async (alertItem: ActiveAlertLog) => {
    setIsLoading(true);
    soundFx.playAlarm();

    const relatedSubj = subjects.find((s) => s.id === alertItem.subjectId);

    const userPromptMsg: ChatMessage = {
      id: `user-alert-${Date.now()}`,
      sender: 'user',
      text: `[TACTICAL QUERY] Analyze alert #${alertItem.id}: "${alertItem.title}" at ${alertItem.locationDetails || 'Perimeter'}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAlertFeedback: true,
    };
    setMessages((prev) => [...prev, userPromptMsg]);

    try {
      const res = await fetch('/api/security-bot/alert-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: alertItem,
          subject: relatedSubj,
        }),
      });

      const data = await res.json();
      const feedback = data.feedback || 'Alert registered. Standard tactical containment active.';

      const botMsg: ChatMessage = {
        id: `bot-alert-${Date.now()}`,
        sender: 'bot',
        text: feedback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAlertFeedback: true,
      };

      setMessages((prev) => [...prev, botMsg]);
      soundFx.playDecrypt();

      if (isVoiceEnabled && data.voiceNotice) {
        speakBotResponse(data.voiceNotice);
      }
    } catch (err: any) {
      console.warn('Alert feedback fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 font-mono transition-all duration-300 shadow-2xl ${
        isMinimized
          ? 'bottom-4 right-4 w-72 h-14'
          : 'bottom-4 right-4 w-[92vw] sm:w-[450px] md:w-[480px] h-[580px] max-h-[85vh]'
      }`}
    >
      <div className="flex flex-col h-full bg-slate-950 border border-purple-600/80 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden text-slate-200">
        {/* HEADER */}
        <div className="px-4 py-3 bg-gradient-to-r from-purple-950/90 via-slate-900 to-slate-950 border-b border-purple-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <Bot className="w-4 h-4" />
              </div>
              {isSpeakingNow && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                  AEGIS SENTINEL
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-300 border border-purple-700">
                    AI AGENT
                  </span>
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Voice Talkback Active // Security Hub
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {/* Voice Talkback Toggle */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                if (isVoiceEnabled && isSpeakingNow) {
                  handleStopSpeaking();
                }
                setIsVoiceEnabled(!isVoiceEnabled);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                isVoiceEnabled
                  ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={isVoiceEnabled ? 'Voice Talkback Enabled (Click to Mute)' : 'Voice Talkback Muted (Click to Enable)'}
            >
              {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Minimize */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsMinimized(!isMinimized);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                handleStopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Assistant"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* QUICK SECURITY FUNCTIONS BAR */}
            <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[10px]">
              <span className="text-slate-500 font-bold uppercase text-[9px] shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" /> Actions:
              </span>

              {/* Lockdown Function */}
              <button
                type="button"
                onClick={() => handleSendMessage(isLockdownActive ? 'Lift grid lockdown protocol' : 'Execute immediate sector lockdown')}
                className={`px-2 py-1 rounded-md border flex items-center gap-1 shrink-0 font-semibold cursor-pointer transition-all ${
                  isLockdownActive
                    ? 'bg-red-950/80 border-red-700 text-red-300 hover:bg-red-900'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-red-600 hover:text-red-300'
                }`}
              >
                {isLockdownActive ? <Unlock className="w-3 h-3 text-red-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                <span>{isLockdownActive ? 'Lift Lockdown' : 'Lockdown Grid'}</span>
              </button>

              {/* Police Dispatch Function */}
              <button
                type="button"
                onClick={() => handleSendMessage('Transmit priority 1 CAD dispatch to police')}
                className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-300 flex items-center gap-1 shrink-0 font-semibold cursor-pointer transition-all"
              >
                <Radio className="w-3 h-3 text-blue-400" />
                <span>Dispatch Police</span>
              </button>

              {/* Merkle Audit Function */}
              <button
                type="button"
                onClick={() => handleSendMessage('Verify Merkle DAG audit trail integrity')}
                className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 flex items-center gap-1 shrink-0 font-semibold cursor-pointer transition-all"
              >
                <FileCheck2 className="w-3 h-3 text-cyan-400" />
                <span>Verify DAG</span>
              </button>

              {/* Google Tasks Function */}
              <button
                type="button"
                onClick={() => handleSendMessage('Open tactical Google Tasks directives')}
                className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 flex items-center gap-1 shrink-0 font-semibold cursor-pointer transition-all"
              >
                <ListTodo className="w-3 h-3 text-emerald-400" />
                <span>Google Tasks</span>
              </button>

              {/* Triage Latest Alert */}
              {activeAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRequestAlertFeedback(activeAlerts[0])}
                  className="px-2 py-1 rounded-md bg-amber-950/70 border border-amber-600/80 text-amber-300 hover:bg-amber-900 flex items-center gap-1 shrink-0 font-semibold cursor-pointer transition-all animate-pulse"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Feedback on Alert #{activeAlerts[0].id}</span>
                </button>
              )}
            </div>

            {/* MESSAGES SCROLL AREA */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs bg-slate-950/90">
              {messages.map((m) => {
                const isBot = m.sender === 'bot';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>{isBot ? 'AEGIS SENTINEL' : 'TACTICAL OPERATOR'}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`relative max-w-[88%] p-3 rounded-2xl leading-relaxed ${
                        isBot
                          ? m.isAlertFeedback
                            ? 'bg-amber-950/40 border border-amber-700/80 text-amber-100 rounded-tl-sm shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
                          : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-tr-sm shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-line text-xs font-mono">{m.text}</p>

                      {/* Action Pill if an action was executed */}
                      {m.actionExecuted && (
                        <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[10px] text-cyan-300 font-bold">
                          <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                          <span>[EXECUTED: {m.actionExecuted.type}]</span>
                          {m.actionExecuted.payload && (
                            <span className="text-slate-400">({m.actionExecuted.payload})</span>
                          )}
                        </div>
                      )}

                      {/* Replay Voice Talkback Button */}
                      {isBot && isVoiceEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            speakBotResponse(m.text);
                          }}
                          className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer"
                          title="Read out loud with tactical voice"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Voice Readout</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-purple-400 p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/50 w-fit animate-pulse font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing tactical threat response...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* FOOTER INPUT & VOICE PUSH-TO-TALK */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2 shrink-0">
              {/* Voice Speaking Indicator Banner */}
              {isSpeakingNow && (
                <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800 text-[10px] text-cyan-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Intelligent Voice Talkback Active...</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopSpeaking}
                    className="text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Push-To-Talk Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-purple-300 hover:border-purple-600'
                  }`}
                  title={isListening ? 'Listening... (Click to stop)' : 'Voice Input (Click to speak)'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isListening ? 'Listening to voice command...' : 'Command Sentinel AI (or click mic to talk)...'}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
                  disabled={isLoading}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
                  title="Send command"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
