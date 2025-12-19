import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Heart, ThumbsDown, 
  Search, Grid, Camera, Radio, Filter, Volume2, Music, Clock,
  Sparkles, Zap, Trash2, ArrowRight, VolumeX, Shuffle, List
} from 'lucide-react';
import { AppView, BGMStyle, BGMType, Track, UserPreferences } from './types';
import { TRACKS } from './mockData';
import { analyzeVisualMood, smartSearchHelp } from './services/gemini';

// --- Shared Components ---

const TrackCard: React.FC<{ 
  track: Track, 
  isActive: boolean,
  isPlaying: boolean, 
  onToggle: () => void,
  compact?: boolean // Note: compact now just means "extra small" strip
}> = ({ track, isActive, isPlaying, onToggle, compact }) => (
  <div 
    onClick={onToggle}
    className={`group relative w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-lg overflow-hidden border cursor-pointer
    ${isActive ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5 hover:border-white/10'}
    ${compact ? 'p-2' : 'p-3'}`}
  >
    {/* Cover Image */}
    <div className={`relative flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-16 h-16'} rounded-md overflow-hidden bg-black/20`}>
      <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${isActive || 'group-hover:opacity-100 opacity-0'}`}>
        {(isPlaying && isActive) ? 
          <Pause size={compact ? 16 : 24} fill="white" className="text-white drop-shadow-md" /> : 
          <Play size={compact ? 16 : 24} fill="white" className="text-white drop-shadow-md" />
        }
      </div>
    </div>

    {/* Metadata Info */}
    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
      <div className="flex items-center gap-2">
         <h3 className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'} ${isActive ? 'text-blue-400' : 'text-white'}`}>
           {track.title}
         </h3>
         {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
      </div>
      <div className="flex items-center gap-2 text-white/40 text-xs">
        <span className="truncate max-w-[120px]">{track.artist}</span>
        <span>•</span>
        <span className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-wider">{track.style}</span>
      </div>
    </div>

    {/* Right Side Info (Duration/Type) - Hidden on very small screens if needed */}
    <div className="hidden sm:flex items-center gap-6 pr-4">
      <div className="text-right">
        <span className={`block text-[10px] uppercase font-bold tracking-widest ${track.type === BGMType.FULL ? 'text-emerald-400/70' : 'text-purple-400/70'}`}>
          {track.type === BGMType.FULL ? 'Full' : 'Hook'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-white/30 text-xs font-mono w-12 justify-end">
        <Clock size={12} />
        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
      </div>
    </div>
  </div>
);

const Sidebar: React.FC<{ activeView: AppView, setView: (v: AppView) => void }> = ({ activeView, setView }) => {
  const items = [
    { id: 'discovery' as AppView, icon: Radio, label: '推荐 / Discovery' },
    { id: 'styles' as AppView, icon: List, label: '分类 / Categories' },
    { id: 'visual' as AppView, icon: Camera, label: '画面匹配 / Visual' },
    { id: 'search' as AppView, icon: Search, label: '搜索 / Search' },
  ];

  return (
    <nav className="w-20 md:w-64 bg-[#050505] border-r border-white/5 h-screen sticky top-0 flex flex-col p-4 z-50">
      <div className="mb-10 px-4">
        <div className="flex items-center gap-2 text-blue-500 mb-1">
          <Music size={28} />
          <span className="hidden md:block font-serif italic text-2xl font-bold text-white tracking-tight">MuseFlow</span>
        </div>
        <p className="hidden md:block text-[9px] text-white/30 uppercase tracking-[0.3em] font-medium">Professional Library</p>
      </div>

      <div className="space-y-2 flex-1">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
              activeView === id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={22} strokeWidth={activeView === id ? 2.5 : 2} />
            <span className="hidden md:block font-medium text-sm">{label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 hidden md:block">
        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
          <p className="text-[11px] text-white/50 leading-relaxed font-light">
            "每一个镜头都有它的心跳，让我们找到那段旋律。"
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 w-6 bg-blue-500 rounded-full" />
            <div className="h-1 w-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('discovery');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('museflow_prefs');
    return saved ? JSON.parse(saved) : { likedIds: [], dislikedIds: [], preferredStyles: [] };
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync Preferences
  useEffect(() => {
    localStorage.setItem('museflow_prefs', JSON.stringify(prefs));
  }, [prefs]);

  // Audio Playback Lifecycle
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.onended = () => {
        if (activeView === 'discovery') handleNextDiscovery();
        else setIsPlaying(false);
      };
      
      audioRef.current.onerror = (e) => {
        // Correctly handle MediaError object attached to the target
        if (typeof e === 'string') {
          console.error(`Audio Playback Error: ${e}`);
        } else {
          const target = e.target as HTMLAudioElement;
          const error = target?.error;
          if (error) {
            console.error(`Audio Playback Error. Code: ${error.code}, Message: ${error.message}`);
            // Code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
          } else {
            console.error("Unknown Audio Error occurred", e);
          }
        }
        setIsPlaying(false);
      };
    }
    
    if (currentTrack) {
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
        audioRef.current.load(); // Explicitly load the new source
      }
      audioRef.current.volume = volume;
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn("Playback prevented by browser or error:", e);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrack, isPlaying, volume]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [durationFilter, setDurationFilter] = useState<[number, number]>([0, 9999]);
  const [visualResult, setVisualResult] = useState<{ mood: string, styles: BGMStyle[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [discoveryTrack, setDiscoveryTrack] = useState<Track | null>(null);

  // --- Recommendation Engine ---
  const getNextRecommendedTrack = (excludeId?: string): Track => {
    // Only pick from first 50 to avoid performance hitch in this simple implementation if array is huge,
    // but here we filter first. 
    // Optimization: Pick a random subset to sort instead of sorting 1000 items every time.
    let pool = TRACKS.filter(t => !prefs.dislikedIds.includes(t.id) && t.id !== excludeId);
    
    // Random sample of 100 items to score
    if (pool.length > 100) {
      pool = pool.sort(() => 0.5 - Math.random()).slice(0, 100);
    }
    
    if (pool.length === 0) return TRACKS[0];

    const weighted = pool.map(track => {
      let weight = 1.0;
      if (prefs.preferredStyles.includes(track.style)) weight += 2.0;
      if (prefs.likedIds.includes(track.id)) weight += 0.5;
      weight += Math.random() * 2.0; 
      return { track, weight };
    });

    weighted.sort((a, b) => b.weight - a.weight);
    return weighted[0].track;
  };

  useEffect(() => {
    if (!discoveryTrack) {
      setDiscoveryTrack(getNextRecommendedTrack());
    }
  }, []);

  const handleNextDiscovery = () => {
    setDiscoveryTrack(getNextRecommendedTrack(discoveryTrack?.id));
  };

  const handleLike = () => {
    if (!discoveryTrack) return;
    setPrefs(prev => ({
      ...prev,
      likedIds: Array.from(new Set([...prev.likedIds, discoveryTrack.id])),
      preferredStyles: Array.from(new Set([...prev.preferredStyles, discoveryTrack.style]))
    }));
    handleNextDiscovery();
  };

  const handleDislike = () => {
    if (!discoveryTrack) return;
    setPrefs(prev => ({
      ...prev,
      dislikedIds: Array.from(new Set([...prev.dislikedIds, discoveryTrack.id]))
    }));
    handleNextDiscovery();
  };

  const handleVisualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await analyzeVisualMood(base64);
      setVisualResult(result);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        const suggestions = await smartSearchHelp(searchQuery);
        setSmartSuggestions(suggestions);
      } else {
        setSmartSuggestions([]);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    // Optimization: limit search results to 50 max to prevent rendering lag with 1000 items
    let matches = TRACKS.filter(t => {
      const query = searchQuery.toLowerCase();
      const matchesText = t.title.toLowerCase().includes(query) || 
                          t.artist.toLowerCase().includes(query) ||
                          t.style.toLowerCase().includes(query) ||
                          t.description.toLowerCase().includes(query);
      const matchesDuration = t.duration >= durationFilter[0] && t.duration <= durationFilter[1];
      return matchesText && matchesDuration;
    });
    return matches.slice(0, 50);
  }, [searchQuery, durationFilter]);

  const togglePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar activeView={activeView} setView={setActiveView} />
      
      <main className="flex-1 pb-40 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          
          {/* 1. Discovery View */}
          {activeView === 'discovery' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-5xl font-serif italic mb-3 tracking-tight">灵感发现 / Discovery</h1>
                  <p className="text-white/40 text-lg font-light tracking-wide">编曲家为您精心挑选的多元化背景素材</p>
                </div>
                <button onClick={handleNextDiscovery} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group">
                  <Shuffle size={18} className="text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-sm">换一个 / Next</span>
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
                <div className="lg:col-span-3">
                  {discoveryTrack ? (
                    <div className="relative group perspective-1000">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                      <div className="relative bg-[#0f0f0f] p-8 rounded-[2.2rem] border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden">
                        
                        <div className="relative aspect-square md:aspect-[16/10] mb-10 rounded-2xl overflow-hidden shadow-2xl">
                          <img src={discoveryTrack.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                             <div className="flex items-center gap-2 mb-2">
                               <Sparkles size={14} className="text-blue-400" />
                               <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Match: {Math.floor(Math.random() * 15 + 85)}%</span>
                             </div>
                             <h2 className="text-3xl md:text-4xl font-bold mb-1 text-white">{discoveryTrack.title}</h2>
                             <p className="text-white/60 text-sm tracking-widest uppercase">{discoveryTrack.artist} • {discoveryTrack.style}</p>
                          </div>
                        </div>

                        <div className="text-center mb-10 space-y-4">
                          <p className="text-white/50 text-base leading-relaxed max-w-md mx-auto italic font-light">"{discoveryTrack.description}"</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-white/40 border border-white/10 uppercase tracking-widest">{discoveryTrack.type}</span>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-white/40 border border-white/10 uppercase tracking-widest">{Math.floor(discoveryTrack.duration/60)}:{(discoveryTrack.duration%60).toString().padStart(2,'0')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-8">
                          <button 
                            onClick={handleDislike}
                            title="Unlike"
                            className="p-5 rounded-full bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/20"
                          >
                            <ThumbsDown size={28} />
                          </button>
                          <button 
                            onClick={() => togglePlay(discoveryTrack)}
                            className="p-10 rounded-full bg-white text-black hover:bg-blue-500 hover:text-white transition-all shadow-2xl hover:scale-110 active:scale-95"
                          >
                            {(isPlaying && currentTrack?.id === discoveryTrack.id) ? <Pause size={44} fill="currentColor" /> : <Play size={44} fill="currentColor" />}
                          </button>
                          <button 
                            onClick={handleLike}
                            title="Like"
                            className="p-5 rounded-full bg-white/5 hover:bg-emerald-500/10 text-white/30 hover:text-emerald-500 transition-all border border-white/5 hover:border-emerald-500/20"
                          >
                            <Heart size={28} className={prefs.likedIds.includes(discoveryTrack.id) ? 'fill-emerald-500 text-emerald-500' : ''} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-[500px] text-white/20">
                      <p>正在生成推荐列表...</p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white/[0.03] p-8 rounded-3xl border border-white/5 backdrop-blur-md">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Zap size={22} className="text-blue-500" />
                      为您准备 / For You
                    </h3>
                    <div className="flex flex-col gap-3">
                      {/* Show items that match preferences but aren't the current main track */}
                      {TRACKS
                        .filter(t => prefs.likedIds.includes(t.id) || prefs.preferredStyles.includes(t.style))
                        .filter(t => t.id !== discoveryTrack?.id)
                        .slice(0, 6)
                        .map(t => (
                        <TrackCard 
                          key={t.id} 
                          track={t} 
                          compact 
                          isActive={currentTrack?.id === t.id}
                          isPlaying={isPlaying} 
                          onToggle={() => togglePlay(t)} 
                        />
                      ))}
                      {prefs.likedIds.length === 0 && (
                         <div className="text-center py-6 text-white/20 text-sm">
                           <p>点击“喜欢”来训练您的AI编曲师</p>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Categories View */}
          {activeView === 'styles' && (
            <div className="space-y-16 animate-in fade-in duration-500">
               <header>
                <h1 className="text-5xl font-serif italic mb-3">专业分类 / Categories</h1>
                <p className="text-white/40 text-lg font-light">满足不同剪辑阶段的音乐需求</p>
              </header>

              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> 完整配乐集 / Full Tracks
                  </h2>
                  <span className="text-white/20 text-xs font-mono uppercase tracking-widest">Master</span>
                </div>
                {/* Changed to 2 columns of lists for better density */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TRACKS.filter(t => t.type === BGMType.FULL).slice(0, 20).map(t => (
                    <TrackCard 
                      key={t.id} 
                      track={t} 
                      isActive={currentTrack?.id === t.id}
                      isPlaying={isPlaying} 
                      onToggle={() => togglePlay(t)} 
                    />
                  ))}
                </div>
                {/* Simple pagination mock */}
                <div className="mt-4 text-center text-xs text-white/20 uppercase tracking-widest">Showing top 20 of {TRACKS.filter(t => t.type === BGMType.FULL).length}</div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-purple-500 rounded-full" /> 情绪高潮与间奏 / Highlights
                  </h2>
                  <span className="text-white/20 text-xs font-mono uppercase tracking-widest">Hooks</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TRACKS.filter(t => t.type === BGMType.HIGHLIGHT).slice(0, 20).map(t => (
                    <TrackCard 
                      key={t.id} 
                      track={t} 
                      isActive={currentTrack?.id === t.id}
                      isPlaying={isPlaying} 
                      onToggle={() => togglePlay(t)} 
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* 3. Visual Sync View */}
          {activeView === 'visual' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <header>
                <h1 className="text-5xl font-serif italic mb-3">画面配乐 / Visual Sync</h1>
                <p className="text-white/40 text-lg font-light">上传视频帧，由编曲师为您进行画面情绪匹配</p>
              </header>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative flex flex-col items-center justify-center min-h-[350px] border-2 border-dashed border-white/10 rounded-[2rem] bg-white/[0.02] p-12 hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden group/box">
                  <input type="file" onChange={handleVisualUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                  <div className="text-center space-y-6 relative z-0">
                    <div className="p-10 bg-blue-500/10 rounded-full inline-block group-hover/box:scale-110 transition-transform duration-500">
                      <Camera size={64} className="text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-medium">点击或拖拽画面至此</p>
                      <p className="text-white/30 text-base font-light">AI 将分析构图、色彩与光影，给出最佳音乐建议</p>
                    </div>
                  </div>
                  
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" />
                      </div>
                      <p className="text-blue-400 font-mono tracking-[0.3em] uppercase animate-pulse">正在捕捉画面灵魂...</p>
                    </div>
                  )}
                </div>
              </div>

              {visualResult && (
                <div className="space-y-10 animate-in slide-in-from-top-8 duration-700">
                  <div className="bg-gradient-to-br from-blue-600/20 via-blue-600/5 to-transparent p-10 rounded-[2rem] border border-blue-500/20 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-blue-400 fill-blue-400" />
                          <h3 className="text-xs text-blue-400 uppercase tracking-widest font-bold">Analysis Report</h3>
                        </div>
                        <p className="text-4xl font-serif italic text-white/90">"{visualResult.mood}"</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {visualResult.styles.map(s => (
                            <span key={s} className="px-4 py-1.5 bg-blue-500/10 text-blue-300 rounded-full text-xs font-medium border border-blue-500/20">{s}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => setVisualResult(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* List View Results */}
                  <div className="flex flex-col gap-4">
                    {TRACKS.filter(t => visualResult.styles.some(s => t.style === s)).slice(0, 10).map(t => (
                      <TrackCard 
                        key={t.id} 
                        track={t} 
                        isActive={currentTrack?.id === t.id}
                        isPlaying={isPlaying} 
                        onToggle={() => togglePlay(t)} 
                      />
                    ))}
                    {TRACKS.filter(t => visualResult.styles.some(s => t.style === s)).length === 0 && (
                      <div className="text-center py-10 text-white/30">
                        暂无精确匹配的曲目，建议查看“灵感发现”页面。
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Search View */}
          {activeView === 'search' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <header>
                <h1 className="text-5xl font-serif italic mb-3">素材库搜索 / Search</h1>
                <p className="text-white/40 text-lg font-light">按情绪、场景或时长进行多维度检索</p>
              </header>

              <div className="bg-white/[0.03] p-10 rounded-[2.5rem] border border-white/10 space-y-10 shadow-2xl backdrop-blur-sm">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-white/20 group-focus-within:text-blue-500 transition-colors">
                    <Search size={28} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="输入想法: '深夜街道的烟火气', '史诗壮阔的转场'..." 
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-2xl font-light placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-6 flex items-center text-white/20 hover:text-white">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mr-2 flex items-center gap-2">
                      <Filter size={14}/> 时长 / Duration:
                    </span>
                    <button 
                      onClick={() => setDurationFilter(durationFilter[1] === 60 ? [0, 9999] : [0, 60])}
                      className={`px-5 py-2.5 rounded-xl text-xs font-medium transition-all ${durationFilter[1] === 60 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/5'}`}
                    >
                      短视频 (&lt; 1min)
                    </button>
                    <button 
                      onClick={() => setDurationFilter(durationFilter[0] === 60 && durationFilter[1] === 180 ? [0, 9999] : [60, 180])}
                      className={`px-5 py-2.5 rounded-xl text-xs font-medium transition-all ${durationFilter[0] === 60 && durationFilter[1] === 180 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/5'}`}
                    >
                      常规 (1 - 3min)
                    </button>
                    <button 
                      onClick={() => setDurationFilter(durationFilter[0] === 180 ? [0, 9999] : [180, 9999])}
                      className={`px-5 py-2.5 rounded-xl text-xs font-medium transition-all ${durationFilter[0] === 180 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/5'}`}
                    >
                      纪录片 (&gt; 3min)
                    </button>
                  </div>

                  {smartSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-3 items-center animate-in slide-in-from-left-4 duration-500">
                      <span className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-bold mr-2 flex items-center gap-2">
                        <Sparkles size={14}/> AI Suggestions:
                      </span>
                      {smartSuggestions.map(tag => (
                        <button 
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="px-4 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 text-blue-300 rounded-full text-[11px] border border-blue-500/10 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* List View Results */}
              <div className="flex flex-col gap-4">
                {searchResults.map(t => (
                  <TrackCard 
                    key={t.id} 
                    track={t} 
                    isActive={currentTrack?.id === t.id}
                    isPlaying={isPlaying} 
                    onToggle={() => togglePlay(t)} 
                  />
                ))}
              </div>
              {searchResults.length === 0 && (
                <div className="text-center py-32 space-y-4 opacity-20">
                  <div className="inline-block p-10 bg-white/5 rounded-full mb-4">
                    <Music size={80} strokeWidth={1} />
                  </div>
                  <p className="text-2xl font-light">未找到相关素材</p>
                  <p className="text-sm">尝试更换关键词或清除筛选条件</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Persistent Audio Player */}
      {currentTrack && (
        <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/70 backdrop-blur-3xl border-t border-white/5 p-5 z-[100] animate-in slide-in-from-bottom-full duration-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-10">
            <div className="flex items-center gap-5 w-1/4">
              <div className="relative group/cover flex-shrink-0">
                <img src={currentTrack.cover} className="w-16 h-16 rounded-xl object-cover shadow-2xl group-hover:scale-105 transition-transform" />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-[#0a0a0a] ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white truncate text-lg tracking-tight">{currentTrack.title}</h4>
                <p className="text-xs text-white/40 truncate font-mono uppercase tracking-widest">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 flex-1 max-w-2xl">
              <div className="flex items-center gap-10">
                <button className="text-white/30 hover:text-white transition-colors" title="上一个"><SkipBack size={24} /></button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-4 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                <button className="text-white/30 hover:text-white transition-colors" onClick={handleNextDiscovery} title="下一个 (换一批)"><SkipForward size={24} /></button>
              </div>
              <div className="w-full flex items-center gap-4 group">
                <span className="text-[10px] font-mono text-white/20">PROGRESS</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full relative cursor-pointer overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full animate-[shimmer_2s_infinite]"
                    style={{ width: isPlaying ? '100%' : '0%', transition: 'width 245s linear' }}
                  />
                  {/* Note: In a real app, this width would be bound to audio.currentTime */}
                </div>
                <span className="text-[10px] font-mono text-white/20">
                  {Math.floor(currentTrack.duration/60)}:{(currentTrack.duration%60).toString().padStart(2,'0')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-8 w-1/4">
              <div className="flex items-center gap-3 text-white/20 hover:text-white/60 transition-colors group">
                <button onClick={() => setVolume(v => v === 0 ? 0.8 : 0)}>
                  {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
                />
              </div>
              <button 
                onClick={() => setPrefs(p => ({ ...p, likedIds: p.likedIds.includes(currentTrack.id) ? p.likedIds.filter(id => id !== currentTrack.id) : [...p.likedIds, currentTrack.id] }))} 
                className={`transition-all duration-300 hover:scale-110 ${prefs.likedIds.includes(currentTrack.id) ? 'text-emerald-500' : 'text-white/20 hover:text-emerald-500'}`}
              >
                <Heart size={24} className={prefs.likedIds.includes(currentTrack.id) ? 'fill-emerald-500' : ''} />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}