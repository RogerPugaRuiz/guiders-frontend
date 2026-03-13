---
description: Quick publish to develop (commit and push)
agent: general
model: github-copilot/claude-haiku-4.5
---

Quickly commit and push changes to develop branch:

1. Review current changes:
   !`git status --short`

2. Stage all changes:
   !`git add .`

3. Create a concise commit message and commit (use conventional commits format)

4. Push to develop:
   !`git push origin develop`

5. Show confirmation:
   !`git log -1 --oneline`

Focus on speed and clarity - create a short, meaningful commit message that summarizes the changes.
