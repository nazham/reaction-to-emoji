import { useEffect, useRef, useState } from 'react';

export type EmotionType = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'disgusted' | 'fearful';

interface EmotionScores {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  neutral: number;
  disgusted: number;
  fearful: number;
}

export function useEmotionDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [emotion, setEmotion] = useState<EmotionType>('neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const modelsLoadedRef = useRef<boolean>(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('[v0] Loading face-api models...');
        const faceapi = await import('@vladmandic/face-api');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        modelsLoadedRef.current = true;
        console.log('[v0] Models loaded successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('[v0] Model loading error:', err);
        setError('Failed to load ML models');
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Detect emotions from video
  useEffect(() => {
    if (!modelsLoadedRef.current || !videoRef.current) return;

    let isMounted = true;

    const detectEmotion = async () => {
      try {
        const faceapi = await import('@vladmandic/face-api');
        const detection = await faceapi
          .detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detection && detection.expressions && isMounted) {
          const expressions = detection.expressions as EmotionScores;
          
          // Find the emotion with highest confidence
          const topEmotion = Object.entries(expressions).reduce((prev, current) =>
            current[1] > prev[1] ? current : prev
          ) as [EmotionType, number];

          console.log('[v0] Detected emotion:', topEmotion[0], 'Confidence:', topEmotion[1]);
          setEmotion(topEmotion[0]);
          setConfidence(Math.round(topEmotion[1] * 100));
        }
      } catch (err) {
        console.error('[v0] Emotion detection error:', err);
      }
    };

    // Start detection loop
    detectionIntervalRef.current = setInterval(detectEmotion, 100);

    return () => {
      isMounted = false;
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [videoRef]);

  return { emotion, confidence, isLoading, error };
}
