'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useEmotionDetection, type EmotionType } from '@/hooks/useEmotionDetection';
import { getEmojiForEmotion } from '@/lib/emotionEmoji';
import { Camera, RefreshCw } from 'lucide-react';

export function EmotionDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [detectedEmotion, setDetectedEmotion] = useState<EmotionType | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { detectEmotionFromImage, isLoading: isModelsLoading, error: modelsError } = useEmotionDetection();

  // Initialize webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermission('granted');
        }
      } catch (err) {
        console.error('[v0] Webcam error:', err);
        setPermission('denied');
        setCameraError('Camera permission denied. Please enable it in your browser settings.');
      }
    };

    if (permission === 'idle') {
      startWebcam();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [permission]);

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
          setDetectedEmotion(result.emotion);
          setConfidence(result.confidence);
        }
        setIsProcessing(false);
      };
    }
  }, [detectEmotionFromImage]);

  const handleRetake = () => {
    setSnapshot(null);
    setDetectedEmotion(null);
    setConfidence(null);
  };

  if (permission === 'denied') {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-400">
        <div className="text-center">
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
          {modelsError}
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-sm font-semibold animate-pulse">Loading AI models...</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCapture}
              disabled={!isVideoPlaying || isModelsLoading || isProcessing}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={20} />
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
                     className="absolute top-4 right-4 text-6xl md:text-8xl drop-shadow-lg transition-transform duration-500 scale-in"
                     style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
                   >
                     {getEmojiForEmotion(detectedEmotion)}
                   </div>
                ) : !isProcessing ? (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                     <p className="text-white bg-black/60 px-4 py-2 rounded-lg font-medium">No face detected</p>
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
        .scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}
