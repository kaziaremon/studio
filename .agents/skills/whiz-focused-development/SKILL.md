---
name: whiz-focused-development
description: Efficient, scoped development for Whiz Studio; use when implementing, debugging, optimizing, or testing a requested website feature.
---

# Whiz Studio Focused Development

This skill enforces a token-efficient, high-precision workflow for all implementation, debugging, optimization, and testing tasks in Whiz Studio.

## Core Principle

**ONE REQUEST → ONE FOCUSED SCOPE → MINIMAL NECESSARY CHANGES → RELEVANT TESTS → VERIFIED RESULT.**

## 12-Step Execution Workflow

1. **Identify Exact Scope**: Determine the specific requested feature, bug, or interface element and isolate the directly affected components.
2. **Targeted Discovery**: Search only relevant files, routes, and direct dependencies. Never execute unbounded full-codebase scans.
3. **Reuse Architectural Findings**: Build on verified project findings (D1 database schemas, Clerk auth patterns, pure vector PDF generation, Cloudflare Worker routes) instead of re-discovering established systems.
4. **Prevent Redundant Scans**: Restrict directory listings and grep searches to the target module or directory.
5. **Eliminate Re-Reads**: Do not re-read files that have already been inspected in the active turn or context.
6. **Minimal Surgical Changes**: Implement the smallest correct, maintainable edit that accomplishes the goal. Avoid unsolicited rewrites, refactoring, or re-styling unrelated UI.
7. **Focused Testing**: Execute targeted tests or verification scripts specific to the modified component rather than unnecessary monolithic test suites.
8. **Investigate Before Retrying**: Never repeat a failed command or operation without inspecting the error and adjusting the command or file.
9. **Zero Irrelevant Tool Overhead**: Do not invoke unnecessary MCP servers, plugins, or peripheral skills that do not directly advance the specific task.
10. **Concise Communication**: Keep tool summaries, thought processes, explanations, and reports structured, direct, and free of filler text.
11. **Adaptive Reasoning Depth**: Reserve deep reasoning for complex backend logic, cryptography, access controls, or financial calculations; handle straightforward UI and text tasks quickly.
12. **Definitive Verification**: Validate real functionality, DOM elements, and API connectivity before marking the task complete. Quality, security, and responsiveness are never compromised.

