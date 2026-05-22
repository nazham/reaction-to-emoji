'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const lastCheckRef = useRef<number>(0);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const animationFrameRef = useRef<number>();

  // Throttled detection loop
  const analyzeFrame = useCallback(async () => {
    if (gameState !== 'playing' || !isVideoPlaying || !isCameraOn || !videoRef.current) return;

    const now = Date.now();
    // Throttle to roughly every 300ms (approx 3 FPS)
    if (now - lastCheckRef.current >= 300) {
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

    // Draw Score Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.fillText('I scored', canvas.width / 2, canvas.height / 2 - 150);

    ctx.font = 'bold 280px sans-serif';
    ctx.fillText(`${score}`, canvas.width / 2, canvas.height / 2 + 50);

    ctx.font = 'bold 80px sans-serif';
    ctx.fillText('in React2Emoji Challenge!', canvas.width / 2, canvas.height / 2 + 250);

    // Draw URL at bottom
    ctx.font = '40px sans-serif';
    ctx.shadowColor = 'transparent';
    ctx.fillText('react2emoji.vercel.app', canvas.width / 2, canvas.height - 100);

    // Trigger download
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const link = document.createElement('a');
    link.download = `react2emoji-score-${score}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
           <video
             ref={videoRef}
             autoPlay
             playsInline
             muted
             onLoadedMetadata={() => {
               videoRef.current?.play().catch(() => {});
             }}
             className="w-full h-full object-cover"
           />
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
                 className="p-4 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md hover:bg-black/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                 aria-label={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                 title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                >
                 {isCameraOn ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
            </div>
          </>
        )}

        {gameState === 'game_over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-30 p-6 backdrop-blur-md animate-in fade-in duration-500">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 uppercase tracking-tight text-center">Time's Up!</h2>

            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-lg flex flex-col items-center my-8 w-full max-w-sm">
              <span className="text-slate-300 font-medium uppercase tracking-widest mb-2">Final Score</span>
              <span className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 drop-shadow-sm">
                {score}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <button
                onClick={handleDownloadScore}
                className="flex-1 bg-white hover:bg-slate-200 text-slate-900 font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Score
              </button>

              <button
                onClick={resetGame}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                Play Again
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
