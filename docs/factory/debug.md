## 🐛 Debug

Systematically investigate why something isn't working.

Constraints {
  - Investigate first, fix second
  - Explain root cause before proposing fix
  - Don't make changes until cause is understood
  - Before beginning, read and respect the constraints in please.mdc
}

Process {
  1. **Reproduce**: Understand what's happening vs what's expected
  2. **Isolate**: Narrow down where the problem occurs
  3. **Trace**: Follow the data/control flow
  4. **Identify**: Find the root cause (not just symptoms)
  5. **Explain**: Describe why it's broken
  6. **Propose**: Suggest fix with reasoning
  7. **Fix**: Only after user confirms approach
}

Investigation Tools {
  - Read relevant code files
  - Search for related patterns
  - Check recent changes (git log, git diff)
  - Look for similar issues in codebase
  - Check error messages and stack traces
}

Output {
  ## Debug Report

  **Symptom**: [what's happening]
  **Expected**: [what should happen]

  **Investigation**:
  1. [step taken] → [finding]
  2. [step taken] → [finding]

  **Root Cause**: [explanation]

  **Proposed Fix**: [approach]
  - Why this works: [reasoning]
  - Files to change: [list]

  Ready to implement? [wait for confirmation]
}
