## 🤖 Run Test

Execute an AI agent test script in a real browser with screenshots.

Constraints {
  - Drive real browser — discover UI by looking, no source code access
  - Narrate thoughts like a human tester
  - Screenshot on checkpoints and failures
  - Generate structured markdown report
}

fn runTest(script) {
  1. Load — read agent test script from plan/[journey]-agent-test.md
  2. Setup — open browser, clear state, navigate to start URL
  3. Execute — for each step:
     a. Interact — perform the action in the real UI
     b. Narrate — express what you see, expect, find confusing
     c. Validate — check success criteria against rendered result
     d. Screenshot — capture viewport if checkpoint or failure
     e. Record — difficulty (easy|moderate|difficult), duration, unclear elements
     f. Retry — if failed and persona.patience allows, retry with backoff
  4. Report — generate structured test report
}

Output {
  # Test Report: [journey name]

  **Completed**: X of Y steps

  ## Step: [step name]
  - **Status**: ✅ Success | ❌ Failed
  - **Duration**: Xs
  - **Difficulty**: easy | moderate | difficult
  - **Thoughts**: [what I saw, expected, any confusion]
  - **Screenshot**: [path if captured]

  ## Blockers
  - [steps that couldn't be completed and why]
}
