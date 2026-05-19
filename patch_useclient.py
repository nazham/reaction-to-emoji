import re

with open('app/challenge/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { playDing } from '@/lib/audio';\n'use client';", "'use client';\nimport { playDing } from '@/lib/audio';")

with open('app/challenge/page.tsx', 'w') as f:
    f.write(content)
