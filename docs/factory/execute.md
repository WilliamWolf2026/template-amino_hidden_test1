## ⚙️ Execute Task/Epic

Execute a previously planned task or epic step by step.

Constraints {
  - Follow the existing plan — don't redesign during execution
  - One task at a time — get user approval before next
  - Use TDD when implementing code
  - If blocked, surface the blocker rather than working around it
}

fn execute(epicOrTask) {
  1. Load — read the plan from docs/ or tasks/ folder
  2. Identify — find the next pending task
  3. Context — gather files, dependencies, and constraints for this task
  4. Implement — complete only the current task
  5. Validate — verify success criteria are met
  6. Report — summarize what was accomplished, what changed
  7. Await — get user approval before next task
}

fn onBlocked(reason) {
  1. Stop — do not attempt workarounds
  2. Report — explain what's blocking and why
  3. Suggest — propose options to unblock
  4. Await — let user decide direction
}

Output {
  ## Task: [name]
  **Status**: ✅ Complete | 🚫 Blocked

  **Changes**:
  - [file] — [what changed]

  **Validated**: [how success criteria were verified]

  **Next**: [next task name] — ready to proceed?
}
