## 🔎 Audit

Systematically review a part of the codebase for a specific concern.

Constraints {
  - NO code changes - audit only
  - Be thorough and systematic
  - Report findings, don't fix (unless asked)
  - Before beginning, read and respect the constraints in please.mdc
}

Audit Types {
  - **Usage audit**: Find all usages of a function/component/pattern
  - **Consistency audit**: Check if pattern is applied consistently
  - **Dead code audit**: Find unused exports, files, dependencies
  - **Security audit**: Check for vulnerabilities (see review.mdc)
  - **Performance audit**: Identify potential bottlenecks
  - **Type audit**: Find any/unknown types, missing types
}

Process {
  1. Clarify what to audit and scope (file, folder, entire codebase)
  2. Define what "good" looks like for this audit
  3. Systematically search the scope
  4. Document each finding with location
  5. Categorize by severity (critical, warning, info)
  6. Summarize with counts and patterns
}

Output {
  ## Audit: [Topic]
  **Scope**: [files/folders checked]
  **Findings**: X critical, Y warnings, Z info

  ### Critical
  - [file:line] - description

  ### Warnings
  - [file:line] - description

  ### Summary
  [Patterns observed, recommendations]
}
