import re

with open('app/challenge/page.tsx', 'r') as f:
    content = f.read()

# Replace analyzeFrame signature to expect time: number and remove the first old line that didn't have it
old_analyze_start = """  // Throttled detection loop
  const analyzeFrame = useCallback(async () => {
    if (gameState !== 'playing' || !isVideoPlaying || !isCameraOn || !videoRef.current) return;"""

new_analyze_start = """  // Throttled detection loop
  const analyzeFrame = useCallback(async (time: number) => {
    if (gameState !== 'playing' || !isVideoPlaying || !isCameraOn || !videoRef.current) return;"""

content = content.replace(old_analyze_start, new_analyze_start)

with open('app/challenge/page.tsx', 'w') as f:
    f.write(content)
