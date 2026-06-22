'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WatchVideoPlayerProps {
  title: string;
  episodeNumber: number;
  onEnded: () => void;
  lightsOff: boolean;
  setLightsOff: (val: boolean) => void;
}

export default function WatchVideoPlayer({ title, episodeNumber, onEnded, lightsOff, setLightsOff }: WatchVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [showNotice, setShowNotice] = useState(false);
  
  // Settings states
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoplay] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout>(null);

  // Video URL: A public high-quality MP4 file
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  useEffect(() => {
    // Reset video state when episode changes
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.pause();
      setIsPlaying(false);
      setShowNotice(false);
    }
  }, [episodeNumber]);

  // Handle Controls Visibility Timeout
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSettings(false);
        }
      }, 3000);
    };

    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('mousemove', handleMouseMove);
      currentRef.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setShowControls(false);
          setShowSettings(false);
        }
      });
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('mousemove', handleMouseMove);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying]);

  // Sync Playback Speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, episodeNumber]);

  // Auto Skip Intro Logic
  useEffect(() => {
    // Intro duration: 10s to 40s
    if (autoSkipIntro && currentTime >= 10 && currentTime < 40) {
      skipIntro();
    }
  }, [currentTime, autoSkipIntro]);

  const togglePlay = (e?: React.MouseEvent | any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setShowNotice(true);
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleRewind = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (videoRef.current) {
      videoRef.current.muted = newMute;
      videoRef.current.volume = newMute ? 0 : volume;
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  const togglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (videoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (autoNext) {
      onEnded();
    }
  };

  const skipIntro = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 40;
      setCurrentTime(40);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Simulated Closed Caption Overlay text
  const getSubtitles = () => {
    if (currentTime >= 0 && currentTime < 5) return "[Subtitles] Welcome to Anime Nation India Streaming!";
    if (currentTime >= 5 && currentTime < 10) return "Supported by our custom neon-pink glowing player.";
    if (currentTime >= 10 && currentTime < 15) return "This is the intro section of the episode.";
    if (currentTime >= 15 && currentTime < 22) return "You can toggle Auto Skip Intro or click the Skip button.";
    if (currentTime >= 22 && currentTime < 30) return "When this episode ends, it will trigger the next one automatically.";
    if (currentTime >= 30 && currentTime < 40) return "You can choose any speed, from slow to 2x speed.";
    if (currentTime >= 40 && currentTime < 55) return "Now playing the main content of Episode " + episodeNumber + ".";
    if (currentTime >= 55 && currentTime < 75) return "Thank you for streaming on Anime Nation India!";
    return "";
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col group cursor-pointer select-none transition-all ${
        lightsOff ? 'z-50 shadow-[0_0_50px_rgba(255,77,210,0.3)] border-[#ff4dd2]/30' : 'z-0'
      }`}
      onClick={togglePlay}
    >
      {/* Real HTML5 Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        playsInline
      />

      {/* Subtitles Overlay */}
      {ccEnabled && getSubtitles() && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-black/80 px-4 py-2 rounded-lg text-center max-w-xl border border-white/5 shadow-md pointer-events-none">
          <p className="text-white text-xs sm:text-sm font-semibold tracking-wide select-none drop-shadow-md">
            {getSubtitles()}
          </p>
        </div>
      )}

      {/* Skip Intro Floating Button */}
      {currentTime >= 10 && currentTime < 40 && !autoSkipIntro && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            skipIntro();
          }}
          className="absolute bottom-20 right-6 z-30 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold px-6 py-2.5 rounded-lg text-xs md:text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(255,77,210,0.5)] transition-all cursor-pointer hover:scale-105"
        >
          Skip Intro
        </button>
      )}

      {/* Dark Overlay inside Player when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/40 z-10 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* License Notice Overlay */}
      <AnimatePresence>
        {showNotice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0b0c20]/95 border border-[#ff4dd2]/50 shadow-[0_0_30px_rgba(255,77,210,0.25)] rounded-2xl p-6 md:p-8 max-w-lg text-center flex flex-col items-center gap-4 relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-full bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.2)] animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              
              <h3 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase drop-shadow-[0_0_8px_rgba(255,77,210,0.3)]">
                Streaming Notice
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed font-semibold">
                Anime Nation India does not currently hold the official streaming licenses required to broadcast this content. Consequently, video streaming is unavailable at this time.
              </p>
              
              <p className="text-xs text-[#ff4dd2] leading-relaxed font-black border-t border-white/5 pt-3">
                We are actively working to secure official distribution rights. With your continued support, we hope to offer official high-quality streaming on our platform in the future!
              </p>
              
              <button
                onClick={() => setShowNotice(false)}
                className="mt-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold px-8 py-2.5 rounded-xl text-xs md:text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(255,77,210,0.4)] transition-all cursor-pointer hover:scale-105"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/70 via-transparent to-black/90 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar: Title info */}
            <div className="flex justify-between items-center p-4 md:p-6 select-none pointer-events-none">
              <h3 className="text-white font-bold text-sm md:text-base tracking-wide flex items-center gap-2 drop-shadow-lg">
                <span className="text-[#ff4dd2] font-black">PLAYING</span> • {title} - Episode {episodeNumber}
              </h3>
            </div>

            {/* Big Play Button (Center) */}
            {!isPlaying && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                <button 
                  onClick={togglePlay}
                  className="bg-[#ff4dd2] text-black p-5 rounded-full hover:scale-110 transition-transform shadow-[0_0_25px_rgba(255,77,210,0.6)] cursor-pointer"
                >
                  <Play size={28} fill="currentColor" className="ml-1" />
                </button>
              </div>
            )}

            {/* Bottom Bar Controls */}
            <div className="p-4 md:p-6 w-full mt-auto flex flex-col gap-3">
              
              {/* Progress Slider Bar */}
              <div 
                onClick={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative group/progress transition-all hover:h-2"
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-[#ff4dd2] shadow-[0_0_8px_#ff4dd2]"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform border-2 border-[#ff4dd2]"
                  style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 7px)` }}
                />
              </div>

              {/* Controls Layout */}
              <div className="flex items-center justify-between text-white">
                
                {/* Left Controls */}
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button onClick={togglePlay} className="text-white hover:text-[#ff4dd2] transition-colors cursor-pointer">
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                  </button>

                  {/* Skip Backward 10s */}
                  <button onClick={handleRewind} className="text-white hover:text-[#ff4dd2] transition-colors cursor-pointer" title="Rewind 10s">
                    <RotateCcw size={18} />
                  </button>

                  {/* Skip Forward 10s */}
                  <button onClick={handleForward} className="text-white hover:text-[#ff4dd2] transition-colors cursor-pointer" title="Forward 10s">
                    <RotateCw size={18} />
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2 group/volume">
                    <button onClick={toggleMute} className="text-white hover:text-[#ff4dd2] transition-colors cursor-pointer">
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      onClick={(e) => e.stopPropagation()}
                      className="w-0 overflow-hidden group-hover/volume:w-16 transition-all duration-300 h-1 accent-[#ff4dd2] bg-white/20 rounded-lg outline-none cursor-pointer"
                    />
                  </div>

                  {/* Time info */}
                  <span className="text-gray-300 text-xs font-semibold ml-2 select-none tracking-wide">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4 relative">
                  
                  {/* CC (Subtitles) toggle */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCcEnabled(!ccEnabled);
                    }} 
                    className={`transition-colors cursor-pointer font-bold text-xs border rounded px-1.5 py-0.5 tracking-wider ${
                      ccEnabled ? 'text-[#ff4dd2] border-[#ff4dd2] bg-[#ff4dd2]/10 shadow-[0_0_8px_rgba(255,77,210,0.3)]' : 'text-gray-400 border-gray-400 hover:text-white hover:border-white'
                    }`}
                    title="Closed Captions (CC)"
                  >
                    CC
                  </button>

                  {/* Picture-in-Picture */}
                  <button 
                    onClick={togglePiP} 
                    className="text-white hover:text-[#ff4dd2] transition-colors cursor-pointer"
                    title="Picture in Picture"
                  >
                    <span className="font-bold text-[10px] border border-white/40 hover:border-[#ff4dd2] rounded px-1 py-0.5">PiP</span>
                  </button>

                  {/* Settings button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettings(!showSettings);
                    }} 
                    className={`transition-colors cursor-pointer ${showSettings ? 'text-[#ff4dd2] rotate-45' : 'text-white hover:text-[#ff4dd2]'} transition-transform duration-300`}
                    title="Settings"
                  >
                    <Settings size={20} />
                  </button>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="text-white hover:text-[#ff4dd2] transition-colors cursor-pointer" title="Fullscreen">
                    <Maximize size={20} />
                  </button>

                  {/* Custom Settings Popover Panel */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute right-0 bottom-12 w-64 bg-[#121216] border border-[#ff4dd2]/20 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-40 flex flex-col gap-3.5 cursor-default text-xs text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2 flex items-center gap-1.5">
                          <Settings size={14} className="text-[#ff4dd2]" /> Settings
                        </h4>

                        {/* Speed setting */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-gray-400">
                            <span>Playback Speed</span>
                            <span className="text-[#ff4dd2] font-bold">{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                          </div>
                          <div className="flex gap-1 bg-[#1a1a24] p-1 rounded-lg">
                            {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setPlaybackSpeed(s)}
                                className={`flex-1 text-center py-1 rounded font-bold cursor-pointer transition-all ${
                                  playbackSpeed === s ? 'bg-[#ff4dd2] text-black shadow-[0_0_8px_rgba(255,77,210,0.4)]' : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Setting Toggles */}
                        <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                          
                          {/* Autoplay toggle */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Autoplay Next Episode</span>
                            <button
                              type="button"
                              onClick={() => setAutoNext(!autoNext)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                autoNext ? 'bg-[#ff4dd2]' : 'bg-gray-700'
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                autoNext ? 'translate-x-4.5' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>

                          {/* Auto Skip Intro toggle */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Auto Skip Intro (10s-40s)</span>
                            <button
                              type="button"
                              onClick={() => setAutoSkipIntro(!autoSkipIntro)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                autoSkipIntro ? 'bg-[#ff4dd2]' : 'bg-gray-700'
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                autoSkipIntro ? 'translate-x-4.5' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>

                          {/* Lights Off toggle */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Cinema Mode (Lights Off)</span>
                            <button
                              type="button"
                              onClick={() => setLightsOff(!lightsOff)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                lightsOff ? 'bg-[#ff4dd2]' : 'bg-gray-700'
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                lightsOff ? 'translate-x-4.5' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
