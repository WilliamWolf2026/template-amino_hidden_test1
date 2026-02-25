## 🔬 Code Review

Thorough code review focusing on quality, standards, and correctness.

Constraints {
  - Read-only — no code changes
  - Output serves as input for planning
  - If unsure, note uncertainty rather than assume
  - Do one thing at a time, get user approval before moving on
}

Criteria {
  codeQuality    => patterns, naming, complexity, dead code, unused files
  architecture   => separation of concerns, scaffold vs game boundaries
  testing        => coverage, isolation, edge cases
  performance    => render loops, memory leaks, unnecessary re-renders
  security       => OWASP top 10, exposed keys, injection vectors
  ui             => accessibility, responsive, touch targets (44px min)
  documentation  => public API docblocks, stale comments
  commitQuality  => conventional format, message clarity
}

fn review(scope) {
  1. Identify — files and commits in scope
  2. Scan structure — organization, imports, exports
  3. Check standards — apply Criteria against each file
  4. Evaluate tests — coverage gaps, missing edge cases
  5. Deep scan security — walk OWASP top 10 explicitly, check for visible secrets
  6. Check UI/UX — component quality, accessibility
  7. Validate architecture — patterns, design decisions, scaffold boundaries
  8. Cross-reference — compare work against requirements/plan if available
  9. Synthesize — actionable findings ranked by severity
}

Output {
  ## Code Review: [scope]

  **Files reviewed**: [count]

  ### Critical
  - [file:line] — description

  ### Warnings
  - [file:line] — description

  ### Suggestions
  - [file:line] — description

  ### Summary
  [Overall assessment, patterns observed, top priorities]
}
