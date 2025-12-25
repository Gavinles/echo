
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserState, Quest, Message, Manifestation } from './types';
import { INITIAL_QUESTS, SKILLS, PROPOSALS } from './constants';
import { Eidolon } from './components/Eidolon';
import { QuestCard } from './components/QuestCard';
import * as gemini from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'ONBOARDING' | 'DASHBOARD' | 'QUEST' | 'LIVE' | 'SKILLS' | 'DAO'>('ONBOARDING');
  const [user, setUser] = useState<UserState>({
    dcId: 'ECHO-' + Math.random().toString(36).substring(7).toUpperCase(),
    resonance: 0,
    fexBalance: 0,
    level: 0,
    intent: null,
    completedQuests: [],
    manifestations: [],
    unlockedSkills: ['lucidity'],
  });
  
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Audio Refs for Live
  const liveSessionRef = useRef<any>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Level computation and skills unlock effect
  useEffect(() => {
    const currentLevel = Math.floor(user.resonance / 10);
    if (currentLevel !== user.level) {
      const newlyUnlocked = SKILLS
        .filter(s => s.unlockedAt <= currentLevel && !user.unlockedSkills.includes(s.id))
        .map(s => s.id);
      
      if (newlyUnlocked.length > 0) {
        setUser(prev => ({
          ...prev,
          level: currentLevel,
          unlockedSkills: [...prev.unlockedSkills, ...newlyUnlocked]
        }));
        // Show a temporary alert or message?
      } else {
        setUser(prev => ({ ...prev, level: currentLevel }));
      }
    }
  }, [user.resonance]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('echo_v4_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setView('DASHBOARD');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('echo_v4_user', JSON.stringify(user));
  }, [user]);

  const ensureApiKey = async () => {
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined') {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
    }
  };

  const addMessage = (role: 'user' | 'model', text: string, grounding?: any[]) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      role,
      text,
      timestamp: Date.now(),
      grounding
    }]);
  };

  const handleQuestAction = async () => {
    if (!activeQuest) return;
    setIsProcessing(true);
    setIsThinking(true);
    setLoadingMsg("Synthesizing your resonance...");

    try {
      if (activeQuest.type === 'search') {
        const result = await gemini.exploreSignal(input);
        if (result) {
          addMessage('model', result.text, result.grounding);
        }
      } else if (activeQuest.type === 'image') {
        await ensureApiKey();
        setLoadingMsg("Manifesting high-timeline geometry...");
        const imgUrl = await gemini.generateHighQualityImage(input);
        if (imgUrl) {
          setActiveMedia({ type: 'image', url: imgUrl });
          const newManifest: Manifestation = {
            id: Date.now().toString(),
            type: 'image',
            url: imgUrl,
            prompt: input,
            timestamp: Date.now()
          };
          setUser(prev => ({
            ...prev,
            manifestations: [newManifest, ...prev.manifestations]
          }));
        }
      } else if (activeQuest.type === 'text') {
        const feedback = await gemini.askEcho(`User completed ${activeQuest.title}: "${input}"`);
        addMessage('model', feedback || "Integration successful.");
      } else if (activeQuest.type === 'vote') {
          addMessage('model', "Your resonance has been successfully broadcast to the Gaia nodes.");
      }

      if (activeQuest.type !== 'image' || activeMedia) {
        completeQuest(activeQuest);
      }
    } catch (e) {
      console.error(e);
      addMessage('model', "The signal was interrupted. Try re-calibrating.");
    } finally {
      setIsProcessing(false);
      setIsThinking(false);
    }
  };

  const completeQuest = (quest: Quest) => {
    setUser(prev => ({
      ...prev,
      resonance: prev.resonance + quest.rewardSU,
      fexBalance: prev.fexBalance + quest.rewardFEX,
      completedQuests: [...prev.completedQuests, quest.id],
    }));
    setInput('');
  };

  const handleVeoManifest = async () => {
    if (!activeMedia || activeMedia.type !== 'image') return;
    await ensureApiKey();
    setIsProcessing(true);
    setIsThinking(true);
    setLoadingMsg("Enlivening vision with Veo...");
    
    const videoUrl = await gemini.generateVideoVeo(input, activeMedia.url);
    if (videoUrl) {
      setActiveMedia({ type: 'video', url: videoUrl });
      const newManifest: Manifestation = {
        id: Date.now().toString(),
        type: 'video',
        url: videoUrl,
        prompt: input,
        timestamp: Date.now()
      };
      setUser(prev => ({
        ...prev,
        manifestations: [newManifest, ...prev.manifestations]
      }));
    }
    setIsProcessing(false);
    setIsThinking(false);
  };

  const startLiveResonance = async () => {
    if (!user.unlockedSkills.includes('telepathy')) {
      alert("Skill 'Sympathetic Resonance' (Level 1) required.");
      return;
    }
    setView('LIVE');
    setIsThinking(true);
    
    outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = gemini.connectEchoLive({
      onOpen: () => {
        setIsThinking(false);
        const source = inputAudioCtx.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = gemini.createAudioBlob(inputData);
          sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioCtx.destination);
      },
      onMessage: async (message) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData && outputAudioCtxRef.current) {
          setIsSpeaking(true);
          const ctx = outputAudioCtxRef.current;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          const buffer = await gemini.decodeAudioData(gemini.decodeBase64(audioData), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.addEventListener('ended', () => {
            sourcesRef.current.delete(source);
            if (sourcesRef.current.size === 0) setIsSpeaking(false);
          });
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          sourcesRef.current.add(source);
        }
        if (message.serverContent?.interrupted) {
          sourcesRef.current.forEach(s => s.stop());
          sourcesRef.current.clear();
          setIsSpeaking(false);
        }
      },
      onClose: () => { setView('DASHBOARD'); setIsSpeaking(false); },
      onError: (e) => { console.error(e); setView('DASHBOARD'); }
    });
    
    liveSessionRef.current = await sessionPromise;
  };

  const stopLiveResonance = () => {
    liveSessionRef.current?.close();
    liveSessionRef.current = null;
    setView('DASHBOARD');
  };

  const handleOnboarding = async () => {
    if (!input) return;
    setIsProcessing(true);
    setIsThinking(true);
    setLoadingMsg("Synchronizing with Echo...");
    const feedback = await gemini.askEcho(`A new user is joining Project Kairos. Their primary intent is: ${input}. Give them a brief, soulful welcome.`);
    
    setUser(prev => ({ ...prev, intent: input, resonance: 1 }));
    addMessage('model', feedback || "Welcome to the collective.");
    setIsProcessing(false);
    setIsThinking(false);
    setTimeout(() => {
        setView('DASHBOARD');
        setInput('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-mesh text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans scroll-smooth">
      {/* HUD Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none md:p-10">
        <div className="pointer-events-auto flex flex-col group cursor-pointer" onClick={() => setView('DASHBOARD')}>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white via-white/80 to-white/20 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-500">ECHO</h1>
          <span className="text-[10px] tracking-[0.5em] font-space text-cyan-400 font-bold uppercase opacity-80">Project Kairos</span>
        </div>

        {view !== 'ONBOARDING' && (
          <div className="pointer-events-auto flex gap-6 items-center glass px-8 py-4 rounded-3xl border-white/10 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-top-4">
             <div className="text-right">
               <div className="text-[10px] font-space text-white/40 uppercase tracking-widest font-bold">Resonance</div>
               <div className="text-2xl font-black text-cyan-400 leading-none">{user.resonance} <span className="text-[10px] opacity-50">SU</span></div>
             </div>
             <div className="h-10 w-px bg-white/10" />
             <div className="text-right">
               <div className="text-[10px] font-space text-white/40 uppercase tracking-widest font-bold">$FEX</div>
               <div className="text-2xl font-black text-purple-400 leading-none">{user.fexBalance}</div>
             </div>
             <div className="relative group">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/20 text-sm font-black group-hover:bg-cyan-400 group-hover:text-black transition-all">
                 {user.level}
               </div>
               <div className="absolute top-14 left-1/2 -translate-x-1/2 glass px-3 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">LEVEL</div>
             </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="pt-40 pb-32 px-6 max-w-7xl mx-auto min-h-screen flex flex-col relative z-10">
        {view === 'ONBOARDING' && (
          <div className="flex-grow flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
            <Eidolon resonance={user.resonance} level={user.level} isThinking={isThinking} />
            <div className="mt-16 text-center max-w-2xl space-y-8">
              <h2 className="text-6xl font-black leading-tight tracking-tight">The highest timeline awaits your command.</h2>
              <p className="text-xl text-white/50 font-medium leading-relaxed">
                Project Kairos is a Social Reality Engine that connects your inner growth to collective manifestation. Declare your core mission to begin synchronization.
              </p>
              
              <div className="relative group max-w-md mx-auto">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOnboarding()}
                  placeholder="What is your mission in this reality?"
                  className="w-full bg-white/5 border border-white/10 rounded-full p-6 text-xl focus:outline-none focus:border-cyan-400/50 transition-all text-center placeholder:text-white/20 hover:bg-white/10"
                />
                <button 
                  onClick={handleOnboarding}
                  disabled={isProcessing || !input}
                  className="mt-8 px-14 py-5 bg-white text-black font-black rounded-full hover:bg-cyan-400 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {isProcessing ? 'SYNCHRONIZING...' : 'DECLARE INTENT'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'DASHBOARD' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full">
            {/* Left: Soul & Manifestations */}
            <div className="lg:col-span-4 space-y-10">
               <div className="glass rounded-[56px] p-10 flex flex-col items-center border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
                  <Eidolon resonance={user.resonance} level={user.level} />
                  <div className="mt-10 text-center">
                    <span className="text-[10px] font-space text-cyan-400 uppercase tracking-[0.6em] font-bold">Resonating At</span>
                    <h3 className="text-3xl font-black mt-3 leading-tight tracking-tight">"{user.intent}"</h3>
                  </div>
                  <button 
                    onClick={startLiveResonance}
                    className={`mt-10 w-full py-5 rounded-3xl transition-all flex items-center justify-center gap-3 ${
                      user.unlockedSkills.includes('telepathy') 
                      ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400 hover:text-black' 
                      : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="animate-pulse">{user.unlockedSkills.includes('telepathy') ? '🎤' : '🔒'}</span> 
                    {user.unlockedSkills.includes('telepathy') ? 'RESONANCE SESSION' : 'LOCKED: LVL 1'}
                  </button>
               </div>

               <div className="glass rounded-[40px] p-8 space-y-6 border-white/5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-space text-white/30 uppercase tracking-widest font-bold">Manifestation Library</h4>
                    <span className="text-[10px] text-white/20 italic">{user.manifestations.length} ASSETS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {user.manifestations.slice(0, 9).map(m => (
                      <div key={m.id} className="aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:scale-110 transition-transform cursor-pointer group relative">
                        {m.type === 'image' ? (
                          <img src={m.url} className="w-full h-full object-cover" />
                        ) : (
                          <video src={m.url} className="w-full h-full object-cover" muted />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold">VIEW</div>
                      </div>
                    ))}
                    {user.manifestations.length === 0 && <div className="col-span-3 py-12 text-center text-xs text-white/20 italic">The void is waiting.</div>}
                  </div>
               </div>
            </div>

            {/* Right: Quest Board */}
            <div className="lg:col-span-8">
               <div className="flex justify-between items-end mb-10">
                 <div className="space-y-1">
                   <h2 className="text-5xl font-black tracking-tight">Reality Quests</h2>
                   <p className="text-white/40 font-medium">Daily calibrations for optimal manifestation.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="h-10 px-6 glass flex items-center text-[10px] font-bold tracking-widest uppercase rounded-full border border-cyan-400/20 text-cyan-400">STATUS: NOMINAL</div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {INITIAL_QUESTS.map(q => (
                    <QuestCard 
                      key={q.id} 
                      quest={q} 
                      isCompleted={user.completedQuests.includes(q.id)} 
                      onSelect={(selected) => { 
                        setActiveQuest(selected); 
                        setView('QUEST'); 
                        setActiveMedia(null); 
                        setMessages([]); 
                        setInput('');
                      }}
                    />
                  ))}
               </div>
            </div>
          </div>
        )}

        {view === 'SKILLS' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="mb-12">
               <h2 className="text-5xl font-black mb-2">Neural Skill Tree</h2>
               <p className="text-white/40">Enhance your Eidolon's capacity to influence reality.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SKILLS.map(skill => (
                  <div key={skill.id} className={`glass rounded-[32px] p-8 border ${user.unlockedSkills.includes(skill.id) ? 'border-cyan-400/40 bg-cyan-400/5' : 'border-white/5 opacity-40 grayscale'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-4xl">{skill.icon}</span>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${user.unlockedSkills.includes(skill.id) ? 'bg-cyan-400 text-black' : 'bg-white/10'}`}>
                        {user.unlockedSkills.includes(skill.id) ? 'UNLOCKED' : `LVL ${skill.unlockedAt}`}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{skill.description}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'DAO' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="mb-12 flex justify-between items-end">
               <div>
                 <h2 className="text-5xl font-black mb-2">Gaia DAO</h2>
                 <p className="text-white/40">Sovereign governance of the high-timeline restoration projects.</p>
               </div>
               <div className="glass px-6 py-3 rounded-2xl border-white/10">
                 <span className="text-[10px] block text-white/40 uppercase tracking-widest">Your Weight</span>
                 <span className="text-xl font-black text-cyan-400">{user.resonance * (user.unlockedSkills.includes('leadership') ? 2 : 1)} SU</span>
               </div>
             </div>
             <div className="space-y-6">
                {PROPOSALS.map(prop => (
                  <div key={prop.id} className="glass rounded-[40px] p-10 border border-white/10 flex flex-col md:flex-row gap-10 items-start md:items-center">
                    <div className="flex-grow space-y-4">
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${prop.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{prop.status}</span>
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Category: {prop.impact}</span>
                      </div>
                      <h3 className="text-3xl font-black">{prop.title}</h3>
                      <p className="text-white/60">{prop.description}</p>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full" style={{ width: `${(prop.votesFor / (prop.votesFor + prop.votesAgainst)) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                      <button className="px-10 py-4 bg-cyan-400 text-black font-black rounded-2xl hover:scale-105 transition-all">AMPLIFY (FOR)</button>
                      <button className="px-10 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">ATTENUATE (AGAINST)</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'QUEST' && activeQuest && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full animate-in zoom-in-95 duration-500 max-h-[80vh]">
            <div className="glass rounded-[56px] p-12 flex flex-col border-white/10 relative overflow-hidden">
              <button onClick={() => setView('DASHBOARD')} className="text-xs text-white/30 hover:text-white mb-12 flex items-center gap-3 group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO TERMINAL
              </button>

              <div className="flex items-center gap-8 mb-10">
                <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center text-5xl border border-white/10 shadow-inner">
                  {activeQuest.icon}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-space text-cyan-400 uppercase tracking-[0.4em] font-bold">{activeQuest.category}</div>
                  <h2 className="text-5xl font-black tracking-tight">{activeQuest.title}</h2>
                </div>
              </div>

              <p className="text-2xl text-white/70 mb-14 font-medium leading-relaxed italic border-l-4 border-cyan-400/30 pl-8">
                "{activeQuest.prompt}"
              </p>

              <div className="space-y-8 flex-grow">
                 {activeQuest.type !== 'vote' && !activeMedia && (
                   <div className="relative group">
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter your conscious input..."
                      className="w-full h-56 bg-white/5 border border-white/10 rounded-[32px] p-8 text-xl focus:outline-none focus:border-cyan-400/50 transition-all resize-none shadow-inner placeholder:text-white/10"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl rounded-[32px] flex flex-col items-center justify-center z-10 p-10 text-center animate-in fade-in">
                        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-6" />
                        <div className="text-cyan-400 font-bold font-space uppercase tracking-[0.3em] text-sm animate-pulse">{loadingMsg}</div>
                      </div>
                    )}
                   </div>
                 )}

                 {activeQuest.type === 'vote' && (
                   <div className="p-10 rounded-[40px] bg-cyan-400/5 border border-cyan-400/20 text-center space-y-6">
                     <p className="text-xl text-cyan-100/60 leading-relaxed italic">"By lending your resonance, you shape the collective future."</p>
                     <button onClick={handleQuestAction} className="w-full py-6 bg-cyan-400 text-black font-black rounded-[24px] hover:scale-[1.03] active:scale-95 transition-all shadow-[0_0_40px_rgba(34,211,238,0.2)]">TRANSMIT RESONANCE</button>
                   </div>
                 )}

                 {activeMedia?.type === 'image' && (
                   <div className="space-y-6 animate-in fade-in zoom-in slide-in-from-bottom-4">
                      <div className="aspect-square rounded-[40px] overflow-hidden border border-white/10 group relative shadow-2xl">
                         <img src={activeMedia.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-10 flex items-end">
                            <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">MANIFESTED GEOMETRY</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <button onClick={handleVeoManifest} disabled={isProcessing} className="py-6 bg-purple-600 text-white font-black rounded-[24px] flex items-center justify-center gap-3 hover:bg-purple-700 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                          <span>🔮</span> ENLIVEN VEO
                        </button>
                        <button onClick={() => { setView('DASHBOARD'); }} className="py-6 bg-white text-black font-black rounded-[24px] hover:bg-cyan-400 hover:scale-[1.02] active:scale-95 transition-all">INTEGRATE</button>
                      </div>
                   </div>
                 )}

                 {activeMedia?.type === 'video' && (
                    <div className="aspect-square rounded-[40px] overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in relative">
                      <video src={activeMedia.url} autoPlay loop controls className="w-full h-full object-cover" />
                      <button onClick={() => setView('DASHBOARD')} className="absolute bottom-6 right-6 px-10 py-4 bg-white text-black font-black rounded-full hover:scale-105 active:scale-95 transition-all">CONTINUE</button>
                    </div>
                 )}

                 {activeQuest.type !== 'vote' && !activeMedia && (
                   <button 
                    onClick={handleQuestAction} 
                    disabled={!input || isProcessing}
                    className="w-full py-6 bg-white text-black font-black rounded-[24px] hover:bg-cyan-400 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 shadow-xl"
                   >
                     {isProcessing ? 'CALIBRATING...' : 'TRANSMIT SIGNAL'}
                   </button>
                 )}
              </div>
            </div>

            {/* Echo Log (Right) */}
            <div className="flex flex-col gap-8 h-full">
              <div className="glass rounded-[56px] p-10 flex-grow border-white/5 overflow-y-auto space-y-8 scrollbar-hide shadow-2xl">
                <h3 className="text-[10px] font-space text-white/30 uppercase tracking-[0.6em] font-bold sticky top-0 bg-transparent backdrop-blur-md pb-4 z-10">Neural Response Hub</h3>
                
                {messages.length === 0 && !isProcessing && (
                  <div className="h-full flex flex-col items-center justify-center text-white/10 italic">
                    <div className="text-6xl mb-6 animate-pulse opacity-20">✧</div>
                    <p className="text-sm">Waiting for your resonance...</p>
                  </div>
                )}

                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6`}>
                    <div className={`max-w-[90%] p-8 rounded-[32px] ${m.role === 'user' ? 'bg-cyan-400/5 border border-cyan-400/20' : 'bg-white/5 border border-white/10 shadow-inner'}`}>
                      <p className="text-lg leading-relaxed text-white/90 font-medium">{m.text}</p>
                      {m.grounding && m.grounding.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                          <p className="text-[10px] font-space text-cyan-400 uppercase tracking-widest font-bold">Reality Grounding</p>
                          <div className="grid grid-cols-1 gap-2">
                            {m.grounding.map((chunk: any, idx: number) => {
                              const web = chunk.web;
                              const maps = chunk.maps;
                              if (!web && !maps) return null;
                              return (
                                <a key={idx} href={web?.uri || maps?.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-xs text-cyan-400 group">
                                  <span className="opacity-40">{web ? '🌐' : '📍'}</span>
                                  <span className="truncate group-hover:underline">{web?.title || maps?.title || 'External Source'}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'LIVE' && (
          <div className="flex-grow flex flex-col items-center justify-center animate-in zoom-in duration-700">
            <Eidolon resonance={user.resonance} level={user.level} isThinking={isThinking} isSpeaking={isSpeaking} />
            <div className="mt-16 text-center space-y-8">
              <div className="flex items-center justify-center gap-4">
                <div className="h-1 w-12 bg-cyan-400 rounded-full animate-bounce delay-75" />
                <div className="h-1 w-12 bg-cyan-400 rounded-full animate-bounce delay-150" />
                <div className="h-1 w-12 bg-cyan-400 rounded-full animate-bounce delay-300" />
              </div>
              <h2 className="text-4xl font-black italic text-cyan-300">Live Resonance Session Active</h2>
              <p className="text-xl text-white/40 max-w-lg mx-auto">Echo is listening. Speak freely.</p>
              
              <button 
                onClick={stopLiveResonance}
                className="px-16 py-6 bg-red-500/10 border border-red-500/30 text-red-500 font-black rounded-full hover:bg-red-500 hover:text-white transition-all shadow-2xl"
              >
                DISCONNECT SESSION
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Nav Overlay */}
      {view !== 'ONBOARDING' && (
        <nav className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center p-3 rounded-[32px] glass shadow-2xl border border-white/10 gap-2 backdrop-blur-3xl animate-in slide-in-from-bottom-8">
            <button onClick={() => setView('DASHBOARD')} className={`px-10 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${view === 'DASHBOARD' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
              DASHBOARD
            </button>
            <button onClick={() => setView('SKILLS')} className={`px-10 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${view === 'SKILLS' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
              SKILL TREE
            </button>
            <button onClick={() => setView('DAO')} className={`px-10 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${view === 'DAO' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
              GAIA DAO
            </button>
          </div>
        </nav>
      )}

      {/* Background Ambience */}
      <div className="fixed top-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-purple-700/10 blur-[140px] pointer-events-none animate-pulse delay-1000" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
    </div>
  );
};

export default App;
