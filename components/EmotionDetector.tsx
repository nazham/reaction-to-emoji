'use client';

import { useRef, useState, useEffect } from 'react';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { getEmojiForEmotion } from '@/lib/emotionEmoji';

export function EmotionDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { emotion, confidence, isLoading, error } = useEmotionDetection(videoRef);
  const emoji = getEmojiForEmotion(emotion);

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
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!isVideoPlaying && permission === 'granted' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
          Initializing camera...
        </div>
      )}

      <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-lg shadow-lg overflow-hidden">
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

        {/* Emoji Overlay */}
        {isVideoPlaying && (
          <div
            className="absolute top-4 right-4 text-8xl drop-shadow-lg transition-transform duration-300 ease-out"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
              animation: 'pulse 0.6s ease-in-out infinite',
            }}
          >
            {emoji}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <div className="text-white text-center">
              <p className="text-sm font-semibold">Loading models...</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Display */}
      {isVideoPlaying && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200 max-w-md mx-auto w-full">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Current Emotion</p>
              <p className="text-3xl font-bold capitalize text-slate-900">
                {emotion}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Confidence</p>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-1">{confidence}%</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
