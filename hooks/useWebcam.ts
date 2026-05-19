import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = useCallback(async () => {
    if (!isCameraOn) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermission('granted');
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setPermission('denied');
      setCameraError('Camera permission denied. Please enable it in your browser settings.');
    }
  }, [isCameraOn]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoPlaying(false);
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isCameraOn) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isCameraOn, startWebcam, stopWebcam]);

  // Handle visibility change (tab focus/blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, stop camera to save resources
        stopWebcam();
      } else {
        // Tab is visible again, restart if camera is supposed to be on
        if (isCameraOn) {
          startWebcam();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCameraOn, startWebcam, stopWebcam]);

  // Check if video is playing
  useEffect(() => {
    if (permission !== 'granted' || !isCameraOn) return;

    const checkPlayback = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        setIsVideoPlaying(true);
      }
    }, 100);

    return () => clearInterval(checkPlayback);
  }, [permission, isCameraOn]);

  return {
    videoRef,
    permission,
    cameraError,
    isCameraOn,
    toggleCamera,
    isVideoPlaying,
  };
}
