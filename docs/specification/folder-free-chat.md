# Conversation before a project

## User requirement and current status

On September 30, the user requested ordinary saved chat without first opening a project folder: explore ideas, change topics, research and decide what to build before choosing or creating a workspace. This is an upcoming product requirement, not implemented behavior. The existing no-project empty state does not satisfy it: session creation currently requires a project and the UI disables New conversation without one.

Recommended sequence: finish the Research Kit offline consumer stage, then implement folder-free chat before the larger research-job and review interface. This document records intent and acceptance criteria; the implementation design must first inspect session persistence, inference policy and tool admission.

## Required experience

- Start and save a conversation without a folder. Restart restores its history. Ordinary questions and planning need no research artifact or project setup.
- Select a model and an explicit conversation-level local/cloud policy. Attaching a project reconciles its privacy policy before any further provider request; a chat setting cannot override a stricter project policy.
- Attach an existing project or create a new project when file work is needed, preserving the discussion as appropriate. Show the active folder and its access state. Never silently attach a folder based on model text.
- Support changing topics and moving between discussion, research and coding. General chat alone grants no filesystem or command access. Research tools become available through their own implemented provider, credential and permission boundaries.
- Switching project context is deliberate. Do not transfer a prior project's tool permissions, pending approvals or hidden file context to another project. Decide during design whether to branch the conversation or bind explicit context segments, including the treatment of earlier messages.
- Existing project conversations, edit review, Stop, Undo, context recovery and project privacy keep their guarantees. Avoid a second conversation store or agent loop.

## Acceptance evidence for that phase

Test first launch without a folder, saved/reopened chat, local and cloud policy enforcement, attaching and creating a workspace, project switching, absence of project tools before attachment, migration of existing saved conversations, and a real desktop journey from an idea to a reviewed file change. Clearly distinguish plain conversation from web research and tool capabilities that have not yet shipped.
