# Multi-Agent Virtual Office: Product and Architecture Plan

## Summary

Evolve Codex Agent Office into a local-first virtual office for multiple coding agents, inspired by [AgentSystemLabs/Agent Office](https://github.com/AgentSystemLabs/agent-office). The first product milestone supports Codex and Claude as real providers, represented as workers in a 2D PixiJS office.

Each Git project is a floor. Users can add an existing local repository or clone any Git URL. They can assign tasks manually or delegate a request to a Project Manager (PM) agent. PM-generated plans require user approval before workers start. Every worker operates in its own Git worktree.

## Product Decisions

- **Audience and deployment:** One user on one local machine; bind to `127.0.0.1`. Team accounts, multiplayer, voice, and cloud deployment are later work.
- **Office interaction:** A PixiJS 2D office supports both character movement and direct desk clicks.
- **Initial providers:** Codex and Claude. Additional providers implement the same provider contract in later milestones.
- **Project onboarding:** Support both local Git directories and cloning SSH or HTTPS Git URLs with the user's existing Git credentials.
- **Worker interaction:** Structured prompts plus live terminal output. Raw terminal input is available only when a provider explicitly supports it.
- **Orchestration:** Users may assign tasks directly or delegate planning to a PM. PM plans are drafts until the user approves them.
- **Isolation:** Each worker gets a separate Git worktree and branch. Stopping a worker never deletes unmerged work.
- **Recovery:** Resume persisted sessions when the provider supports it; otherwise mark the worker interrupted and offer manual resume.
- **Default concurrency:** Four workers, configurable by the user.

## Architecture and Interfaces

### Provider-neutral agent core

Define a shared `AgentProvider` contract for provider detection, version and authentication status, capabilities, session start/resume, prompt submission, interruption, approvals, event streaming, and stop. Move the existing Codex integration behind a Codex provider and add a Claude provider. Report missing CLIs, authentication, and unsupported capabilities as unavailable; never simulate support.

Normalize provider output at the adapter boundary into domain events such as `worker.started`, `worker.output`, `worker.tool`, `worker.waiting_approval`, `worker.completed`, and `worker.failed`. Verify provider protocols against official documentation and installed CLI versions. Keep real CLI smoke tests separate from fake-process contract tests.

### API and persistence

Add provider discovery, project import and clone, worker lifecycle, prompt, plan approval/rejection, and terminal/event streaming APIs. Persist provider, model, project, desk, external session ID, worktree, branch, and worker state. Keep project as the floor identity and assign desks stable IDs and positions within a floor. Migrate existing Codex sessions to provider `codex` without losing project, task, or thread history.

### Projects and worktrees

Accept local projects only when they are valid Git repositories. Clone from SSH or HTTPS Git URLs without requiring GitHub CLI. Show clone progress and actionable credential errors. Create each worker's branch/worktree inside Agent Office's managed data area. Handle branch collisions and dirty worktrees safely; preserve changes on stop and require an explicit user action for cleanup.

### Tasks and PM delegation

Use the same task and workflow system for manual assignment and PM delegation. Settings provide the default PM provider/model, with an option to override them for each delegation. The PM creates a draft plan containing tasks, acceptance criteria, dependencies, roles, and proposed provider assignments. Users may edit, approve, or reject the plan. Start workers only after approval, then schedule dependency-ready tasks within the configured concurrency limit.

### Office UI

Provide a floor selector, project onboarding, and a PixiJS scene with desks, worker avatars, movement, and visible worker states. Clicking an empty desk starts hiring; clicking an occupied desk opens the worker panel. The panel shows task, prompt composer, approvals, and live output through xterm.js. Structured prompts remain the standard control path; expose raw terminal input only for providers that declare support.

## Milestones

1. **Redesign the requirements:** Rewrite `DESIGN.md`, architecture docs, and numbered tasks around provider-neutral workers, capabilities, events, local floors, security boundaries, and acceptance criteria.
2. **Provider foundation:** Introduce the provider contract, move Codex behind it, add provider discovery and capability reporting, and test lifecycle/event behavior with fake processes.
3. **Claude provider:** Implement and test the verified Claude CLI integration. Record a blocked real smoke test until Claude CLI and authentication are available; do not claim it passed based on mocks.
4. **Project floors and isolation:** Add local import, Git URL clone with progress, managed worktrees, branch collision handling, and safe stop/recovery behavior.
5. **Workers and Office UI:** Add worker APIs, normalized realtime events, PixiJS floor/desk interaction, prompt panel, terminal output, and approval alerts.
6. **Task assignment and PM:** Add manual assignment, PM draft plans, edit/approve/reject flow, dependency scheduling, and configurable concurrency.
7. **Hardening:** Add browser end-to-end flows, restart recovery, migration checks, security review, and operational documentation.

## Tests and Acceptance Criteria

- Provider contract tests cover detection, authentication, start/resume, prompt, interruption, approvals, event normalization, process failure, and reconnect.
- Real smoke tests use installed and authenticated Codex and Claude CLIs; skipped providers report the precise missing binary or login state.
- Project tests cover valid local repositories, invalid paths, URL validation, clone authentication failure, duplicate projects, and progress/error reporting.
- Worktree tests cover creation, branch collision, dirty state, parallel workers, stop preservation, and explicit cleanup.
- PM tests cover draft creation, user edits, approval/rejection, dependency scheduling, and concurrency limits.
- UI tests cover floor switching, hiring, worker status, prompt/output, approval alerts, and interrupted-session recovery.
- Playwright covers adding or cloning a project, hiring a worker, sending a prompt, viewing output, and stopping/resuming.
- Before adding native dependencies such as a PTY package, verify package metadata, registry integrity, lifecycle scripts, exact version pinning, and audit results. Install with scripts disabled and rebuild only approved packages.

## Explicitly Deferred

Additional providers, GitHub issue/PR boards, autonomous PM execution without approval, team accounts, multiplayer, voice, cloud deployment, and a 3D office are outside the initial milestones. Add each through a numbered task after the two-provider local workflow is stable.
