import type { EmotionType } from '@/hooks/useEmotionDetection';

export const emotionEmojiMap: Record<EmotionType, string> = {
  happy: '😄',
  sad: '😢',
  angry: '😠',
  surprised: '😲',
  neutral: '😐',
  disgusted: '🤢',
  fearful: '😨',
};

export function getEmojiForEmotion(emotion: EmotionType): string {
  return emotionEmojiMap[emotion];
}
