# Conversation before a project

## User requirement and current status

On September 30, the user requested ordinary saved chat without first opening a project folder: explore ideas, change topics, research and decide what to build before choosing or creating a workspace. Implemented on `feat/folder-free-chat` for the 0.7 development milestone. The first screen accepts ordinary Ask/Plan messages without a folder. General chats persist in SQLite and remain available under General chats after restart. They expose no file, command or web research tools.

## Implemented behavior

General chats default to local-only inference. Review cloud access explicitly changes the conversation policy, preserving the draft and sending nothing. Project conversations enforce both conversation and project policy. Policy updates invalidate active runs. Build requires a trusted workspace. A refused run leaves its draft intact. Context recovery branches with the original privacy restriction and prepares the prior request as an unsent draft.

Attach workspace / Switch workspace opens a review dialog and creates a new conversation. The original remains saved. General-chat discussion is offered as editable text when it fits the 65,536-character limit; project-origin transitions start with an empty handoff. Only the exact text approved by the user crosses the boundary. The effective source privacy restriction is preserved; destination project restrictions also apply. No tool messages, runs, approvals or provider continuation state transfer. Ordinary navigation transfers nothing and clears the unsent draft.

Choose an existing registered workspace, select another through the native folder picker, or create a new folder through a native location dialog and explicitly trust it. Cancelling trust leaves a newly created empty directory on disk but grants no project access. Model output cannot choose or create workspaces. Switching is disabled during active runs; Stop remains available.

Schema v2 migrates existing histories transactionally. The [design](../superpowers/specs/2026-10-01-folder-free-chat-design.md) explains nullable identities, privacy revisions and SQLite integrity. The [plan](../superpowers/plans/2026-10-01-folder-free-chat.md) tracks acceptance evidence. Plain chat does not imply web research support; research jobs and review UI remain the next separate stage.

## Required experience

- Start and save a conversation without a folder. Restart restores its history. Ordinary questions and planning need no research artifact or project setup.
- Select a model and an explicit conversation-level local/cloud policy. Attaching a project reconciles its privacy policy before any further provider request; a chat setting cannot override a stricter project policy.
- Attach an existing project or create a new project when file work is needed, preserving the discussion as appropriate. Show the active folder and its access state. Never silently attach a folder based on model text.
- Support changing topics and moving between discussion, research and coding. General chat alone grants no filesystem or command access. Research tools become available through their own implemented provider, credential and permission boundaries.
- Switching project context is deliberate. Do not transfer a prior project's tool permissions, pending approvals or hidden file context to another project. Workspace changes branch with reviewed text; earlier histories stay in their original conversations.
- Existing project conversations, edit review, Stop, Undo, context recovery and project privacy keep their guarantees. Avoid a second conversation store or agent loop.

## Acceptance evidence for that phase

Test first launch without a folder, saved/reopened chat, local and cloud policy enforcement, attaching and creating a workspace, project switching, absence of project tools before attachment, migration of existing saved conversations, and a real desktop journey from an idea to a reviewed file change. Clearly distinguish plain conversation from web research and tool capabilities that have not yet shipped.
