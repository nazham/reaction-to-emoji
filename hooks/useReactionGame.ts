import { useState, useCallback, useRef } from 'react';
import { ExtendedEmojiType, extendedEmotionEmojiMap } from '@/lib/emotionEmoji';

export type GameState = 'idle' | 'playing' | 'game_over';

const easyEmotions: ExtendedEmojiType[] = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'disgusted', 'fearful'];
const hardEmotions: ExtendedEmojiType[] = ['laughing', 'winking', 'smirking', 'screaming', 'sleepy', 'unamused'];
const allEmotions = [...easyEmotions, ...hardEmotions];

export function useReactionGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetEmotion, setTargetEmotion] = useState<ExtendedEmojiType | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomEmotion = useCallback((currentScore: number) => {
    // Introduce harder emotions as score increases
    const availableEmotions = currentScore > 5 ? allEmotions : easyEmotions;
    const randomIndex = Math.floor(Math.random() * availableEmotions.length);
    return availableEmotions[randomIndex];
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setTargetEmotion(getRandomEmotion(0));
    setGameState('playing');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState('game_over');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [getRandomEmotion]);

  const handleMatch = useCallback(() => {
    if (gameState !== 'playing') return;

    setScore((prevScore) => {
      const newScore = prevScore + 1;
      setTargetEmotion(getRandomEmotion(newScore));
      return newScore;
    });
  }, [gameState, getRandomEmotion]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setScore(0);
    setTimeLeft(30);
    setTargetEmotion(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  return {
    gameState,
    score,
    timeLeft,
    targetEmotion,
    startGame,
    handleMatch,
    resetGame,
    targetEmojiChar: targetEmotion ? extendedEmotionEmojiMap[targetEmotion] : null,
  };
}
