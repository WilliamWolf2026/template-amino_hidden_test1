## 💾 Commit

Commit changes using conventional commit format. Non-interactive only.

Constraints {
  - Non-interactive mode only — no interactive rebase, no editors
  - First line ≤ 50 characters
  - Don't log about logging in commit messages
  - Don't modify CHANGELOG.md
  - Use multiple -m flags for multi-line messages
}

Format {
  "$type[($scope)][!]: $description"

  where:
    []   => optional
    !    => breaking change
}

Types {
  fix      => bug fix
  feat     => new feature
  chore    => maintenance
  docs     => documentation
  refactor => restructuring without behavior change
  test     => adding or updating tests
  perf     => performance improvement
  build    => build system changes
  ci       => CI/CD changes
  style    => formatting, whitespace
  revert   => reverting a previous commit
}

fn commit() {
  1. Scan — review staged changes and recent work
  2. Classify — determine type and scope from changes
  3. Draft — write message following Format, first line ≤ 50 chars
  4. Execute — `git commit -m "$type($scope): $description"`
  5. Confirm — show commit hash and summary
}
