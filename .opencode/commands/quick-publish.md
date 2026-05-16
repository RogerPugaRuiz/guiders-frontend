---
description: Quick publish to main (commit and push)
agent: general
model: github-copilot/gpt-5-mini
---

Quickly commit and push changes to main branch:

1. Review current changes:
   !`git status --short`

2. Stage all changes:
   !`git add .`

3. Create a concise commit message and commit (use conventional commits format)

4. Push to main:
   !`git push origin main`

5. Show confirmation:
   !`git log -1 --oneline`

Focus on speed and clarity - create a short, meaningful commit message that summarizes the changes.
