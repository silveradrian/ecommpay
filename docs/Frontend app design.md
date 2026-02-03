You are designing a bespoke internal web application that acts as the control plane for an AI-driven knowledge content pipeline.

The backend orchestration is handled by n8n.
Human approvals are handled by GoToHuman.
The frontend must remain thin, deterministic, and UI-focused. (Use existing design savi design system)

The application is marketing software used initial for internal use however will evenually be client facing. It is an internal / semi-internal operational tool used by non-technical stakeholders.

Core Design Principle (Non-Negotiable)

The frontend must not:

Call AI models directly

Orchestrate workflows

Contain business logic

The frontend only:

Submits intent (topics)

Displays state

Displays content

Allows lightweight interaction (view, copy, export)

Treat n8n as an internal API and workflow engine, not as a UI.

High-Level Architecture

Frontend (this app)
→ communicates via HTTP with
n8n (workflow orchestration)
→ which integrates with external APIs and GoToHuman
→ and writes to a shared data store

The frontend reads from the data store and writes to n8n webhooks only.

Primary User Goals

The application must allow a user to:

Submit one or more topics that represent knowledge gaps

See the status of each topic as it moves through the pipeline

View the latest approved content

Export or reuse approved content

Trust that anything marked “Approved” is safe to use

Required Application Screens (Minimum Viable)
1. Topic Intake

Simple form

Fields:

Topic (required)

Optional metadata (e.g. category, priority)

On submit:

Send payload to an n8n webhook

Do not wait synchronously for results

2. Topic Dashboard / List

Display a list of submitted topics

Each topic must show:

Topic name

Current status

Last updated timestamp

Canonical statuses (must be supported):

Queued

In Progress

In Review

Approved

Rejected (optional)

No workflow logic in the UI — this is purely reflective.

3. Content View (Approved Content Only)

For topics marked Approved:

Display the final approved content

Display metadata (topic, approval date)

The frontend does not handle draft review — that is done in GoToHuman

Actions:

Copy content

Export content (format agnostic: markdown / text is sufficient)

Explicit Non-Responsibilities of the Frontend

The frontend must not:

Handle draft review

Handle approval decisions

Display intermediate AI prompts

Display unapproved drafts (unless explicitly required later)

Act as a workflow engine

Those responsibilities belong to GoToHuman and n8n.

Integration Requirements
Frontend → n8n

Use HTTP webhooks

JSON payloads

Stateless requests

Example:

{
  "topic": "cross-border payments",
  "priority": "high"
}

Frontend ← Data Store

Read-only access to:

Topic records

Status

Approved content

The frontend must treat this store as the source of truth

Data Model Expectations (Conceptual)

At minimum, each topic record should support:

ID

Topic string

Status

Approved content (nullable)

Timestamps (created, updated, approved)

Exact schema design is up to you.

UX & Design Constraints

Simple, calm, utilitarian UI

Optimised for clarity, not density

Designed for non-technical users

No exposed system internals

No mention of AI providers in the UI

Future-Proofing (Do Not Implement Yet)

Design the app so it can later support:

Batch topic submission

Version history

Role-based access

Analytics on topic coverage

Do not build these now — just don’t block them architecturally.

Success Criteria

This frontend is successful if:

A non-technical user can submit a topic in under 10 seconds

Anyone can instantly see what topics are approved

The system feels trustworthy and governed

n8n can be changed or replaced without rewriting the frontend

Final Instruction

Design the frontend as a thin, reliable interface over an automation engine, not as a “smart app”.

If you are unsure whether logic belongs in the frontend or n8n:

Default to n8n.