---
description: Publish changes to main branch
agent: general
model: github-copilot/gpt-5-mini
---

Review the current git status and recent changes, then publish them to the main branch:

1. Show current git status to see all modified files:
   !`git status`

2. Show the diff of all changes:
   !`git diff --stat`

3. Create a meaningful commit message based on the changes made, following conventional commits format (feat:, fix:, refactor:, etc.)

4. Add all changes to staging:
   !`git add .`

5. Commit with the meaningful message

6. Push to main branch:
   !`git push origin main`

7. Verify the push was successful and show the last commit:
   !`git log -1 --oneline`

Make sure to:

- Use a descriptive commit message that explains what was changed and why
- Follow the project's commit message conventions
- Handle any merge conflicts that might arise
- Report the final status and confirm the changes are on main branch
