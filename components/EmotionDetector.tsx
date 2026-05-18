'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { determineAdvancedEmoji, ExtendedEmojiType } from '@/lib/emotionEmoji';
import { Camera, RefreshCw, Loader2, AlertCircle, UserX } from 'lucide-react';

export function EmotionDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [detectedEmotion, setDetectedEmotion] = useState<ExtendedEmojiType | null>(null);
  const [emojiChar, setEmojiChar] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { detectEmotionFromImage, isLoading: isModelsLoading, error: modelsError } = useEmotionDetection();

  // Initialize webcam
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermission('granted');
        }
      } catch (err) {
        if (isMounted) {
          console.error('[v0] Webcam error:', err);
          setPermission('denied');
          setCameraError('Camera permission denied. Please enable it in your browser settings.');
        }
      }
    };

    startWebcam();

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Check if video is playing
  useEffect(() => {
    if (permission !== 'granted') return;

    const checkPlayback = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          setIsVideoPlaying(true);
        }
    }, 100);

    return () => clearInterval(checkPlayback);
  }, [permission]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setDetectedEmotion(null);
    setEmojiChar(null);
    setConfidence(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageUrl = canvas.toDataURL('image/png');
      setSnapshot(imageUrl);

      // Analyze the image element or canvas
      const img = new Image();
      img.src = imageUrl;

      img.onload = async () => {
        const result = await detectEmotionFromImage(img);

        if (result) {
          const advancedEmotion = determineAdvancedEmoji(result.expressions, result.landmarks, result.emotion);
          setDetectedEmotion(advancedEmotion.emojiType);
          setEmojiChar(advancedEmotion.emojiChar);
          setConfidence(result.confidence);
        }
        setIsProcessing(false);
      };
    }
  }, [detectEmotionFromImage]);

  const handleRetake = () => {
    setSnapshot(null);
    setDetectedEmotion(null);
    setEmojiChar(null);
    setConfidence(null);
  };

  if (permission === 'denied') {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-400">
        <div className="text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <p className="text-red-600 font-semibold">Camera Permission Required</p>
          <p className="text-slate-600 text-sm mt-2">{cameraError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {modelsError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 mr-2 inline-block"/> {modelsError}
        </div>
      )}

      {!isVideoPlaying && permission === 'granted' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
          Initializing camera...
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Live Camera View */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 text-center">Live Camera</h2>
          <div className="relative w-full aspect-video bg-black rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
            {isProcessing && !snapshot && (
               <div className="absolute inset-0 bg-white z-20 animate-flash pointer-events-none" />
            )}
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
            {isModelsLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-white w-8 h-8" />
                  <p className="text-white text-sm font-medium animate-pulse">Loading AI models...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCapture}
              disabled={!isVideoPlaying || isModelsLoading || isProcessing}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
              {isProcessing ? 'Analyzing...' : 'Take Snapshot'}
            </button>
          </div>
        </div>

        {/* Snapshot View */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 text-center">Snapshot Result</h2>
          <div className="relative w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg shadow-inner overflow-hidden flex items-center justify-center">
            {snapshot ? (
              <>
                <img src={snapshot} alt="Captured snapshot" className="w-full h-full object-cover" />
                {detectedEmotion ? (
                   <div
                     className="absolute top-4 right-4 text-5xl sm:text-7xl md:text-9xl drop-shadow-lg transition-transform duration-500 scale-in"
                     style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
                   >
                     {emojiChar}
                   </div>
                ) : !isProcessing ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-3">
                     <UserX className="w-12 h-12 text-white opacity-80" />
                     <p className="text-white bg-black/60 px-4 py-2 rounded-lg font-medium shadow-sm">No face detected</p>
                   </div>
                ) : null}
              </>
            ) : (
              <div className="text-slate-400 flex flex-col items-center gap-2">
                <Camera size={32} />
                <p className="text-sm font-medium">Capture a photo to see emoji</p>
              </div>
            )}
          </div>

          {/* Stats Display for Snapshot */}
          {snapshot && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200">
               {detectedEmotion ? (
                 <div className="space-y-3">
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Detected Emotion</p>
                       <p className="text-2xl font-bold capitalize text-slate-900 mt-1">
                         {detectedEmotion}
                       </p>
                     </div>
                     <button
                       onClick={handleRetake}
                       className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
                       title="Retake"
                     >
                       <RefreshCw size={18} />
                     </button>
                   </div>
                   <div>
                     <div className="flex justify-between mb-1">
                       <p className="text-xs font-semibold text-slate-600">Confidence</p>
                       <p className="text-xs font-bold text-slate-800">{confidence}%</p>
                     </div>
                     <div className="w-full bg-slate-200 rounded-full h-2">
                       <div
                         className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                         style={{ width: `${confidence || 0}%` }}
                       />
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="flex justify-between items-center h-full">
                    <p className="text-sm text-slate-600 font-medium">
                      {isProcessing ? 'Analyzing image...' : 'Could not detect any face.'}
                    </p>
                    {!isProcessing && (
                      <button
                        onClick={handleRetake}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes flash {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-flash {
          animation: flash 0.4s ease-out forwards;
        }
        .scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}
