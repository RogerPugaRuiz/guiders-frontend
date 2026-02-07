---
name: create-skill
description: Guide for creating new OpenCode agent skills with proper structure and validation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: skill-creation
---

# Create Skill - OpenCode Skill Creator

## What I do

I help you create new OpenCode agent skills following best practices and official documentation guidelines.

### My responsibilities:

- Guide you through skill creation process
- Validate skill names according to OpenCode requirements
- Generate proper YAML frontmatter with required fields
- Ensure description length is within limits (1-1024 characters)
- Create the correct directory structure
- Provide examples and templates

## When to use me

Use this skill when you want to:

- Create a new OpenCode agent skill from scratch
- Understand skill structure and requirements
- Validate existing skill definitions
- Learn about skill naming conventions
- Set up skill permissions

## Skill Requirements

### File Structure

Skills must be placed in one of these locations:

- **Project**: `.opencode/skills/<name>/SKILL.md`
- **Global**: `~/.config/opencode/skills/<name>/SKILL.md`
- **Claude-compatible**: `.claude/skills/<name>/SKILL.md` (project or `~/.claude/` global)
- **Agents-compatible**: `.agents/skills/<name>/SKILL.md` (project or `~/.agents/` global)

### Name Validation Rules

Skill names MUST:

- Be 1-64 characters long
- Use lowercase alphanumeric characters only
- Use single hyphens as separators (no consecutive `--`)
- Not start or end with `-`
- Match the directory name containing `SKILL.md`
- Match regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

✅ **Valid examples:**

- `git-release`
- `dark-mode-setup`
- `pr-review`
- `typescript-refactor`

❌ **Invalid examples:**

- `Git-Release` (uppercase)
- `git--release` (consecutive hyphens)
- `-git-release` (starts with hyphen)
- `git_release` (underscore)
- `git.release` (dot)

### Frontmatter Fields

**Required:**

- `name`: Skill identifier (must follow naming rules)
- `description`: Clear description (1-1024 characters)

**Optional:**

- `license`: License identifier (e.g., MIT, Apache-2.0)
- `compatibility`: Target system (e.g., opencode, claude)
- `metadata`: String-to-string map for custom metadata

### Description Guidelines

- Must be 1-1024 characters
- Should be specific enough for agents to understand when to use it
- Focus on what problem it solves
- Use clear, concise language

## Template Structure

```markdown
---
name: skill-name-here
description: Clear one-line description of what this skill does
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: workflow-name
---

# Skill Title

## What I do

Detailed explanation of the skill's purpose and capabilities.

### My responsibilities:

- Bullet point 1
- Bullet point 2
- Bullet point 3

## When to use me

Clear guidance on when agents should load this skill:

- Scenario 1
- Scenario 2
- Scenario 3

## How to use me

Step-by-step instructions or examples:

1. First step
2. Second step
3. Third step

## Examples

Provide concrete examples of the skill in action.

## Tips and Best Practices

Additional guidance for optimal use.
```

## Creation Workflow

When someone asks me to create a skill, I will:

1. **Ask clarifying questions:**

   - What is the skill's purpose?
   - What problem does it solve?
   - When should agents use it?
   - What location do you prefer? (project `.claude/skills/` or global `~/.claude/skills/`)

2. **Validate the name:**

   - Check against naming rules
   - Suggest corrections if invalid
   - Ensure it matches the directory name

3. **Validate the description:**

   - Check length (1-1024 characters)
   - Ensure clarity and specificity
   - Suggest improvements if needed

4. **Create the structure:**

   - Create the directory: `.claude/skills/<name>/`
   - Generate the `SKILL.md` file with proper frontmatter
   - Include clear sections: What I do, When to use me, Examples

5. **Verify the result:**
   - Confirm file was created
   - Validate frontmatter syntax
   - Check that name matches directory

## Permissions Configuration

Skills can be controlled via permissions in `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

**Permission levels:**

- `allow`: Load immediately
- `deny`: Hidden from agent, access rejected
- `ask`: Prompt user before loading

**Per-agent overrides:**

In custom agent frontmatter:

```yaml
---
permission:
  skill:
    'documents-*': 'allow'
---
```

In `opencode.json` for built-in agents:

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

## Troubleshooting

If a skill doesn't load:

1. ✅ Verify `SKILL.md` is in ALL CAPS
2. ✅ Check frontmatter has `name` and `description`
3. ✅ Ensure skill names are unique across all locations
4. ✅ Verify permissions (skills with `deny` are hidden)
5. ✅ Validate name follows regex: `^[a-z0-9]+(-[a-z0-9]+)*$`
6. ✅ Check description length (1-1024 characters)

## How agents discover me

OpenCode lists available skills in the `skill` tool description:

```xml
<available_skills>
  <skill>
    <name>create-skill</name>
    <description>Guide for creating new OpenCode agent skills</description>
  </skill>
</available_skills>
```

Agents load me by calling:

```javascript
skill({ name: 'create-skill' });
```

## Remember

- Skills are discovered from both project and global locations
- OpenCode walks up from CWD to git worktree for project skills
- Unknown frontmatter fields are ignored (not an error)
- Directory name MUST match the `name` field in frontmatter
- Keep descriptions concise but specific enough for agents to choose correctly
