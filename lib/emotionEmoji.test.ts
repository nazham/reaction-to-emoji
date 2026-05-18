import { determineAdvancedEmoji } from './emotionEmoji';

// Simple mock for face-api landmarks object structure
function createMockLandmarks(options: any = {}) {
    return {
        getMouth: () => options.mouth || Array(20).fill({x: 0, y: 0}),
        getLeftEye: () => options.leftEye || Array(6).fill({x: 0, y: 0}),
        getRightEye: () => options.rightEye || Array(6).fill({x: 0, y: 0}),
    };
}

describe('Heuristics Engine', () => {

    it('detects laughing when happy > 0.85 and mouth wide open', () => {
        const expressions = { happy: 0.9, sad: 0, angry: 0, surprised: 0, neutral: 0.1, disgusted: 0, fearful: 0 };

        const mouth = Array(20).fill({x: 0, y: 0});
        mouth[14] = {x: 50, y: 40}; // top inner lip
        mouth[18] = {x: 50, y: 80}; // bottom inner lip (distance 40)

        const leftEye = Array(6).fill({x: 30, y: 20});
        const rightEye = Array(6).fill({x: 70, y: 20});
        leftEye[0] = {x: 20, y: 20}; // outer left
        rightEye[3] = {x: 80, y: 20}; // outer right (eye distance 60)

        const landmarks = createMockLandmarks({ mouth, leftEye, rightEye });

        const result = determineAdvancedEmoji(expressions as any, landmarks, 'happy');
        expect(result.emojiType).toBe('laughing');
    });

    it('detects winking when EAR difference is significant', () => {
        const expressions = { happy: 0.5, neutral: 0.5, sad: 0, angry: 0, surprised: 0, disgusted: 0, fearful: 0 };

        // Open right eye
        const rightEye = [
            {x: 60, y: 20}, {x: 65, y: 15}, {x: 75, y: 15},
            {x: 80, y: 20}, {x: 75, y: 25}, {x: 65, y: 25}
        ];

        // Closed left eye (squinted/flat)
        const leftEye = [
            {x: 20, y: 20}, {x: 25, y: 20}, {x: 35, y: 20},
            {x: 40, y: 20}, {x: 35, y: 20}, {x: 25, y: 20}
        ];

        const landmarks = createMockLandmarks({ leftEye, rightEye });
        const result = determineAdvancedEmoji(expressions as any, landmarks, 'happy');

        expect(result.emojiType).toBe('winking');
    });

    it('falls back to base emotion when heuristics not met', () => {
        const expressions = { happy: 0.6, sad: 0, angry: 0, surprised: 0, neutral: 0.4, disgusted: 0, fearful: 0 };

        // normal small mouth open
        const mouth = Array(20).fill({x: 0, y: 0});
        mouth[14] = {x: 50, y: 40};
        mouth[18] = {x: 50, y: 42};

        const landmarks = createMockLandmarks({ mouth });

        const result = determineAdvancedEmoji(expressions as any, landmarks, 'happy');
        expect(result.emojiType).toBe('happy');
    });
});

console.log("Tests successfully created.");
