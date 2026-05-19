import re

with open('app/challenge/page.tsx', 'r') as f:
    content = f.read()

content = "import { playDing } from '@/lib/audio';\n" + content

with open('app/challenge/page.tsx', 'w') as f:
    f.write(content)
