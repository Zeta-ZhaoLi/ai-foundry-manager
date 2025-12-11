# OpenSpec Workflow Guide

This document describes how to work with AI assistants using the OpenSpec workflow for this project.

## Overview

OpenSpec is a structured approach for planning and implementing changes with AI assistance. It helps ensure:

- Clear communication of requirements
- Well-documented change proposals
- Reviewable implementation plans
- Traceable modifications

## Workflow

### 1. Change Proposal Creation

When you want to implement a new feature or make significant changes:

1. **Describe the change** - Explain what you want to accomplish
2. **AI creates a proposal** - A markdown file in `openspec/changes/` documenting:
   - Summary of the change
   - Files to be modified/created
   - Implementation approach
   - Potential risks or considerations

### 2. Proposal Review

Before implementation:

1. **Review the proposal** - Check if the approach aligns with your expectations
2. **Request modifications** - Ask for changes if needed
3. **Approve** - Give the go-ahead to implement

### 3. Implementation

After approval:

1. **AI implements the changes** - Following the proposal
2. **Incremental updates** - Progress is shown as work proceeds
3. **Testing** - Run tests to verify changes work

### 4. Completion

After implementation:

1. **Review changes** - Verify the implementation
2. **Archive or update** - Mark the proposal as completed

## Directory Structure

```
openspec/
├── AGENTS.md          # This file - workflow documentation
├── project.md         # Project context and conventions
└── changes/           # Change proposals
    └── NNNN-feature-name.md
```

## Change Proposal Format

```markdown
# [Short Title]

## Summary
Brief description of what this change accomplishes.

## Motivation
Why this change is needed.

## Files Affected
- `src/path/to/file.ts` - Description of changes
- `src/path/to/new-file.ts` - New file for X

## Implementation Plan
1. Step one
2. Step two
3. ...

## Testing
How to verify the change works.

## Risks/Considerations
Any potential issues or trade-offs.
```

## Best Practices

### For Users

- **Be specific** - Provide clear requirements
- **Share context** - Mention related features or constraints
- **Review carefully** - Check proposals before approving
- **Test thoroughly** - Verify implementations work as expected

### For AI Assistants

- **Read project.md first** - Understand project conventions
- **Follow existing patterns** - Match the codebase style
- **Document thoroughly** - Create clear proposals
- **Implement incrementally** - Make reviewable changes
- **Run tests** - Verify changes don't break existing functionality

## Commands

Common requests you can make:

- "Create a change proposal for [feature]"
- "Review the proposal and suggest improvements"
- "Implement the approved changes"
- "Update project.md with new conventions"
- "List all pending change proposals"

## Project-Specific Notes

### This Project (AI Foundry Manager)

- **Language**: Code comments in Chinese, documentation in English
- **Testing**: Run `npm run test` before completing changes
- **Linting**: Run `npm run lint` to check style
- **Build**: Verify with `npm run build` for production readiness
