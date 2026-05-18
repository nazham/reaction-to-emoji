import type { EmotionType, EmotionScores } from '@/hooks/useEmotionDetection';

// Extended type including heuristic states
export type ExtendedEmojiType =
  | EmotionType
  | 'laughing'
  | 'winking'
  | 'smirking'
  | 'screaming'
  | 'sleepy'
  | 'unamused';

export const extendedEmotionEmojiMap: Record<ExtendedEmojiType, string> = {
  happy: '😄',
  sad: '😢',
  angry: '😠',
  surprised: '😲',
  neutral: '😐',
  disgusted: '🤢',
  fearful: '😨',
  laughing: '😂',
  winking: '😉',
  smirking: '😏',
  screaming: '😱',
  sleepy: '😴',
  unamused: '😒',
};

/**
 * @deprecated Use `determineAdvancedEmoji` instead.
 */
export function getEmojiForEmotion(emotion: EmotionType): string {
  return extendedEmotionEmojiMap[emotion];
}

// Geometric helpers for landmarks
function euclideanDistance(pt1: { x: number; y: number }, pt2: { x: number; y: number }) {
  return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}

function calculateEAR(eyePoints: { x: number; y: number }[]) {
  // Eye Aspect Ratio: https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf
  // eyePoints is an array of 6 points (0 to 5)
  if (!eyePoints || eyePoints.length !== 6) return 1.0;

  const p2_p6 = euclideanDistance(eyePoints[1], eyePoints[5]);
  const p3_p5 = euclideanDistance(eyePoints[2], eyePoints[4]);
  const p1_p4 = euclideanDistance(eyePoints[0], eyePoints[3]);

  return (p2_p6 + p3_p5) / (2.0 * p1_p4);
}

export function determineAdvancedEmoji(
  expressions: EmotionScores,
  landmarks: any,
  topEmotion: EmotionType
): { emojiType: ExtendedEmojiType; emojiChar: string } {
  // Fallback if landmarks fail
  if (!landmarks) {
    return { emojiType: topEmotion, emojiChar: extendedEmotionEmojiMap[topEmotion] };
  }

  try {
    const mouth = landmarks.getMouth(); // Array of 20 points
    const leftEye = landmarks.getLeftEye(); // Array of 6 points
    const rightEye = landmarks.getRightEye(); // Array of 6 points

    // Heuristic 1: Laughing (😂)
    // High happy score + mouth wide open
    if (expressions.happy > 0.85) {
      // Points 13,14,15 are lower lip inner, 61,62,63 are upper lip inner in 68-point models
      // face-api returns points differently: 14 & 18 (top/bottom inner mouth in the 20-point array)
      const topLipInner = mouth[14]; // approx
      const bottomLipInner = mouth[18]; // approx
      if (topLipInner && bottomLipInner) {
        const mouthOpenness = euclideanDistance(topLipInner, bottomLipInner);
        // Normalize mouth openness relative to face scale or eye distance.
        // For simplicity, checking raw distance (approximate threshold)
        const eyeDist = euclideanDistance(leftEye[0], rightEye[3]);
        if (mouthOpenness > eyeDist * 0.2) {
          return { emojiType: 'laughing', emojiChar: extendedEmotionEmojiMap.laughing };
        }
      }
    }

    // Heuristic 2: Screaming (😱)
    // High fearful or surprised + mouth wide open
    if (expressions.fearful > 0.5 || expressions.surprised > 0.8) {
      const topLipInner = mouth[14];
      const bottomLipInner = mouth[18];
      if (topLipInner && bottomLipInner) {
        const mouthOpenness = euclideanDistance(topLipInner, bottomLipInner);
        const eyeDist = euclideanDistance(leftEye[0], rightEye[3]);
        if (mouthOpenness > eyeDist * 0.25) {
          return { emojiType: 'screaming', emojiChar: extendedEmotionEmojiMap.screaming };
        }
      }
    }

    // Heuristic 3: Winking (😉)
    // EAR of one eye is significantly smaller than the other
    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);
    const earDiff = Math.abs(leftEAR - rightEAR);

    // threshold for wink difference
    if (earDiff > 0.08 && Math.min(leftEAR, rightEAR) < 0.2) {
      return { emojiType: 'winking', emojiChar: extendedEmotionEmojiMap.winking };
    }

    // Heuristic 4: Sleepy (😴)
    // Both eyes closed (low EAR)
    if (leftEAR < 0.18 && rightEAR < 0.18) {
        return { emojiType: 'sleepy', emojiChar: extendedEmotionEmojiMap.sleepy };
    }

    // Heuristic 5: Smirking (😏)
    // Neutral or slightly happy, mouth corners asymmetrical
    if (expressions.neutral > 0.4 || (expressions.happy > 0.2 && expressions.happy < 0.6)) {
      const leftCorner = mouth[0]; // left outer mouth
      const rightCorner = mouth[6]; // right outer mouth
      // Compare y-coordinates (assuming head is relatively upright)
      // Usually smaller y means higher on the screen (pixel coordinates)
      const yDiff = Math.abs(leftCorner.y - rightCorner.y);
      const mouthWidth = euclideanDistance(leftCorner, rightCorner);

      if (yDiff > mouthWidth * 0.15) {
        return { emojiType: 'smirking', emojiChar: extendedEmotionEmojiMap.smirking };
      }
    }

    // Heuristic 6: Unamused (😒)
    // Neutral/angry mix
    if (expressions.neutral > 0.4 && expressions.angry > 0.2) {
        return { emojiType: 'unamused', emojiChar: extendedEmotionEmojiMap.unamused };
    }

  } catch (err) {
    console.error('Error in heuristic calculation:', err);
  }

  // Fallback to base emotion
  return { emojiType: topEmotion, emojiChar: extendedEmotionEmojiMap[topEmotion] };
}
