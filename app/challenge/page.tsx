'use client';
import { playDing } from '@/lib/audio';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useWebcam } from '@/hooks/useWebcam';
import { useReactionGame } from '@/hooks/useReactionGame';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { determineAdvancedEmoji } from '@/lib/emotionEmoji';
import { Video, VideoOff, Download, Play, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ChallengePage() {
  const {
    videoRef,
    permission,
    cameraError,
    isCameraOn,
    toggleCamera,
    isVideoPlaying,
  } = useWebcam();

  const {
    gameState,
    score,
    timeLeft,
    targetEmotion,
    startGame,
    handleMatch,
    resetGame,
    targetEmojiChar,
  } = useReactionGame();

  const { detectEmotionFromImage, isLoading: isModelsLoading, error: modelsError } = useEmotionDetection();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{member: string, score: number}>>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitScore = async () => {
    if (!username.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), score })
      });
      if (res.ok) {
        setHasSubmitted(true);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  // Check if current score qualifies for top 10
  const qualifiesForLeaderboard = useMemo(() => {
    if (score === 0) return false;
    if (leaderboard.length < 10) return true;

    const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
    const lowestScore = sorted[sorted.length - 1].score;

    return score > lowestScore;
  }, [score, leaderboard]);

  useEffect(() => {
    if (gameState === 'game_over') {
      fetchLeaderboard();
      // Small delay to ensure we get a clean final frame
      setTimeout(() => {
        handleDownloadScore();
        if (isCameraOn) {
            toggleCamera(); // turn off camera
        }
      }, 500);
    } else if (gameState === 'playing' && !isCameraOn) {
        setHasSubmitted(false);
        setUsername('');
        toggleCamera();
    }
  }, [gameState]);

  const lastCheckRef = useRef<number>(0);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const animationFrameRef = useRef<number>(0);

  // Throttled detection loop
  const analyzeFrame = useCallback(async () => {
    if (gameState !== 'playing' || !isVideoPlaying || !isCameraOn || !videoRef.current) return;

    const now = Date.now();
    // Throttle to roughly every 300ms (approx 3 FPS)
    if (now - lastCheckRef.current >= 250) {
      lastCheckRef.current = now;

      const video = videoRef.current;

      // Use existing function. It accepts video element directly!
      const result = await detectEmotionFromImage(video);

      if (result && targetEmotion) {
        const advancedEmotion = determineAdvancedEmoji(result.expressions, result.landmarks, result.emotion);

        if (advancedEmotion.emojiType === targetEmotion) {
          // It's a match!
          setIsSuccessFlash(true);
          setTimeout(() => setIsSuccessFlash(false), 300);
          playDing();
          handleMatch();
        }
      }
    }

    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
    }
  }, [gameState, isVideoPlaying, isCameraOn, detectEmotionFromImage, targetEmotion, handleMatch]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, analyzeFrame]);

  const handleDownloadScore = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate random vibrant gradient
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 40 + Math.floor(Math.random() * 80)) % 360;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${hue1}, 80%, 60%)`);
    gradient.addColorStop(1, `hsl(${hue2}, 80%, 50%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 100 + 20,
            0, Math.PI * 2
        );
        ctx.fill();
    }

    // Draw Overlays at top and bottom to keep face clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, 180);
    ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(`React2Emoji Challenge`, canvas.width / 2, 60);

    ctx.font = 'bold 60px sans-serif';
    ctx.fillStyle = '#fbbf24'; // amber-400
    ctx.fillText(`Score: ${score}`, canvas.width / 2, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = '40px sans-serif';
    ctx.shadowColor = 'transparent';
    ctx.fillText('🔒 100% Private - react2emoji.vercel.app', canvas.width / 2, canvas.height - 60);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
  };

  return (
    <main className={`min-h-screen ${gameState === 'playing' ? 'overflow-hidden fixed inset-0' : 'bg-slate-900'} w-full flex flex-col items-center justify-center`}>
      {/* Header / Nav - hide while playing */}
      {gameState !== 'playing' && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/" className="text-white hover:text-slate-300 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm transition-colors">
            <Home size={20} />
            <span className="font-medium hidden sm:inline">Back to Booth</span>
          </Link>
        </div>
      )}

      {/* Main Game Container */}
      <div className={`relative w-full ${gameState === 'playing' ? 'h-full' : 'max-w-md aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl'} bg-black`}>

        {/* Video Feed */}
        {isCameraOn ? (
           <>
             <video
               ref={videoRef}
               autoPlay
               playsInline
               muted
               onLoadedMetadata={() => {
                 videoRef.current?.play().catch(() => {});
               }}
               className="w-full h-full object-cover -scale-x-100"
             />
             <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm sm:text-base px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 z-20 shadow-lg whitespace-nowrap">
               <span role="img" aria-label="locked">🔒</span> 100% Private. Runs locally.
             </div>
           </>
        ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-400">
             <VideoOff size={64} className="mb-4 opacity-50" />
             <p className="font-medium text-lg">Camera is Off</p>
           </div>
        )}

        {/* Success Flash Overlay */}
        <div className={`absolute inset-0 border-8 transition-colors duration-200 pointer-events-none z-10 ${isSuccessFlash ? 'border-green-500 bg-green-500/20' : 'border-transparent'}`} />

        {/* Models Loading Overlay */}
        {isModelsLoading && gameState === 'idle' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
             <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-white text-lg font-semibold animate-pulse">Loading AI models...</p>
           </div>
        )}

        {/* Error Overlay */}
        {(modelsError || permission === 'denied') && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-6 text-center">
             <div className="bg-red-500/20 p-4 rounded-2xl border border-red-500">
               <p className="text-red-400 font-bold text-xl mb-2">Error</p>
               <p className="text-white">{modelsError || cameraError || 'Camera permission required.'}</p>
             </div>
           </div>
        )}

        {/* --- GAME UI STATES --- */}

        {gameState === 'idle' && !isModelsLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 p-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 text-center drop-shadow-lg">Reaction Challenge</h1>
            <p className="text-slate-300 text-center mb-8 max-w-sm drop-shadow-md">
              Match the target emoji with your face as fast as you can. You have 30 seconds!
            </p>
            <button
              onClick={startGame}
              disabled={!isCameraOn}
              className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 rounded-full text-xl shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play fill="currentColor" />
              START GAME
            </button>
            <button
               onClick={toggleCamera}
               className="mt-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
            >
               {isCameraOn ? <VideoOff size={18} /> : <Video size={18} />}
               {isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Top Bar: Target & Stats */}
            <div className="absolute top-0 inset-x-0 p-6 sm:p-8 flex justify-between items-start z-20">
               <div className="flex flex-col">
                 <span className="text-white/80 font-bold uppercase tracking-wider text-sm sm:text-base drop-shadow-md">Time</span>
                 <span className={`text-4xl sm:text-6xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                   0:{timeLeft.toString().padStart(2, '0')}
                 </span>
               </div>

               <div className="flex flex-col items-end">
                 <span className="text-white/80 font-bold uppercase tracking-wider text-sm sm:text-base drop-shadow-md">Score</span>
                 <span className="text-4xl sm:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                   {score}
                 </span>
               </div>
            </div>

            {/* Center: Target Emoji */}
            <div className="absolute top-32 sm:top-40 inset-x-0 flex flex-col items-center justify-center z-20 pointer-events-none">
              <span className="text-white/90 font-bold bg-black/40 px-4 py-1 rounded-full mb-4 backdrop-blur-sm text-sm sm:text-base border border-white/20">
                Match this expression:
              </span>
              <div className="text-[120px] sm:text-[160px] leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] animate-bounce">
                {targetEmojiChar}
              </div>
              <span className="text-white/80 font-semibold uppercase tracking-widest mt-4 drop-shadow-md bg-black/40 px-3 py-1 rounded-lg backdrop-blur-md">
                {targetEmotion}
              </span>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 right-8 z-20">
                <button
                 onClick={toggleCamera}
                 className="p-4 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
                >
                 {isCameraOn ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
            </div>
          </>
        )}

        {gameState === 'game_over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
            <div className="w-full max-w-md flex flex-col items-center pb-12 pt-8">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 uppercase tracking-tight text-center">Time's Up!</h2>

              {previewUrl ? (
                <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl mb-8 relative">
                   <img src={previewUrl} alt="Scorecard Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl mb-8 bg-slate-800 flex items-center justify-center">
                   <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 w-full mb-8">
                <button
                  onClick={() => {
                    if (!previewUrl) return;
                    const link = document.createElement('a');
                    link.download = `react2emoji-score-${score}.jpg`;
                    link.href = previewUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  disabled={!previewUrl}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={20} />
                  Download & Share
                </button>

                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    resetGame();
                    if (!isCameraOn) toggleCamera();
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  Play Again
                </button>
              </div>

              {/* Leaderboard Section */}
              <div className="w-full bg-slate-800/80 rounded-2xl border border-white/10 p-6 backdrop-blur-md">
                <h3 className="text-xl font-bold text-white mb-4 text-center">🏆 Top 10 Players</h3>

                {!hasSubmitted && score > 0 && qualifiesForLeaderboard ? (
                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={15}
                      className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={submitScore}
                      disabled={!username.trim() || isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      {isSubmitting ? '...' : 'Submit'}
                    </button>
                  </div>
                ) : hasSubmitted ? (
                  <div className="text-center text-green-400 font-medium mb-6 bg-green-500/10 py-2 rounded-lg">
                    Score submitted successfully!
                  </div>
                ) : null}

                <div className="space-y-2">
                  {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                    <div key={idx} className={`flex justify-between items-center p-3 rounded-lg ${idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300' : idx === 1 ? 'bg-slate-300/10 text-slate-300' : idx === 2 ? 'bg-orange-500/10 text-orange-300' : 'bg-black/20 text-white/80'}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-bold w-6">{idx + 1}.</span>
                        <span className="font-medium truncate max-w-[120px]">{entry.member}</span>
                      </div>
                      <span className="font-bold">{entry.score} pts</span>
                    </div>
                  )) : (
                    <div className="text-center text-white/50 py-4">No scores yet. Be the first!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
