import { useEffect, useRef, useState, useCallback } from 'react';

export type EmotionType = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'disgusted' | 'fearful';

export interface EmotionScores {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  neutral: number;
  disgusted: number;
  fearful: number;
}

export function useEmotionDetection() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const faceapiRef = useRef<any>(null);

  // Load models on mount
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        console.log('[v0] Loading face-api models...');
        const faceapi = await import('@vladmandic/face-api');
        faceapiRef.current = faceapi;
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        
        if (isMounted) {
          console.log('[v0] Models loaded successfully');
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[v0] Model loading error:', err);
          setError('Failed to load ML models');
          setIsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const detectEmotionFromImage = useCallback(async (
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<{ emotion: EmotionType; confidence: number; expressions: EmotionScores; landmarks: any } | null> => {
    if (!faceapiRef.current) return null;

    try {
      const detection = await faceapiRef.current
        .detectSingleFace(imageElement, new faceapiRef.current.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detection?.expressions) {
        const expressions = detection.expressions as EmotionScores;

        const topEmotion = Object.entries(expressions).reduce((prev, current) =>
          current[1] > prev[1] ? current : prev
        ) as [EmotionType, number];

        return {
          emotion: topEmotion[0],
          confidence: Math.round(topEmotion[1] * 100),
          expressions: expressions,
          landmarks: detection.landmarks
        };
      }
    } catch (err) {
      console.error('[v0] Detection error:', err);
    }
    return null;
  }, []);

  return { detectEmotionFromImage, isLoading, error };
}
