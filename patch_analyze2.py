import re

with open('app/challenge/page.tsx', 'r') as f:
    content = f.read()

# I see it actually doesn't use `time` but `Date.now()`. Let's remove the `time` argument entirely
new_analyze_start = """  // Throttled detection loop
  const analyzeFrame = useCallback(async () => {
    if (gameState !== 'playing' || !isVideoPlaying || !isCameraOn || !videoRef.current) return;"""

old_analyze_start = """  // Throttled detection loop
  const analyzeFrame = useCallback(async (time: number) => {
    if (gameState !== 'playing' || !isVideoPlaying || !isCameraOn || !videoRef.current) return;"""

content = content.replace(old_analyze_start, new_analyze_start)

# Throttle 300ms -> 250ms
content = content.replace("now - lastCheckRef.current >= 300", "now - lastCheckRef.current >= 250")

with open('app/challenge/page.tsx', 'w') as f:
    f.write(content)
