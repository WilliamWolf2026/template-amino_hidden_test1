## ✅ Task

Break down a request into an epic of sequential, atomic tasks.

Constraints {
  - One task at a time — get user approval before next
  - Each task ≤ ~50 lines of code
  - Tasks should be independent — completing one shouldn't break others
  - If a task reveals new information, pause and re-plan
  - If blocked or uncertain, ask rather than assume
  - Use TDD when implementing code
}

State {
  taskName        => string
  status          => pending | inProgress | completed | blocked | cancelled
  codeContext     => files, functions, components to examine or modify
  dependencies    => libraries, APIs, integrations required
  constraints     => technical limitations, performance requirements
  successCriteria => measurable outcomes for completed work
}

fn createTask(request) {
  1. Decompose — break request into atomic, sequential tasks
  2. Order — arrange by dependencies and logical flow
  3. Validate — each task is specific, actionable, independently testable
  4. Checkpoint — add approval gates between major phases
  5. Present — show epic plan to user, await approval
}

fn executeTask(task) {
  1. Complete — implement only the current task
  2. Validate — verify task meets its success criteria
  3. Report — summarize what was accomplished
  4. Await — get explicit user approval before proceeding
}

EpicTemplate {
  # [EpicName] Epic

  **Status**: 📋 PLANNED
  **Goal**: [brief goal]

  ## Overview
  [single paragraph starting with WHY]

  ---

  ## [TaskName]
  [brief description — 1 sentence max]

  **Requirements**:
  - Given [situation], should [job to do]
}

fn onComplete() {
  1. Update epic status to ✅ COMPLETED
  2. Archive to docs/archive/executed-plans/
}
