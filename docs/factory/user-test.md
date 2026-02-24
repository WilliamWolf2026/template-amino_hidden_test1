## 🧪 User Test

Generate human and AI agent test scripts from user journeys.

Constraints {
  - Read-only — generates scripts, doesn't execute them
  - Both scripts must validate identical success criteria
  - Save scripts to plan/ folder
  - Persona traits drive behavior (patience → retries, techLevel → strategy)
}

Types {
  UserTestPersona {
    ...Persona
    role       => string
    techLevel  => novice | intermediate | expert
    patience   => 1..10
    goals      => string[]
  }

  UserTestStep {
    action     => what the user does
    intent     => what they're trying to accomplish
    success    => how to verify it worked
    checkpoint => boolean (screenshot on failure)
  }
}

fn generateScripts(journey) {
  1. Load — read journey from plan/story-map/[journey].yaml
  2. Extend personas — infer role, techLevel, patience, goals from journey context
  3. Map steps — convert journey steps to UserTestSteps with success criteria
  4. Generate human script — think-aloud protocol, video recorded
  5. Generate agent script — executable with screenshots, persona-driven behavior
  6. Save — write to plan/[journey]-human-test.md and plan/[journey]-agent-test.md
}

HumanScriptTemplate {
  # Test: [journey name]
  **Persona**: [name] — [role]

  ## Pre-test
  - Start screen recording
  - Clear state (cookies, cache)

  ## Steps
  For each step:
  - Goal: [intent]
  - Do: [action]
  - Think aloud: What do you see? Any friction?
  - Success: [success criteria]

  ## Post-test
  - What was confusing? What worked well?
}

AgentScriptTemplate {
  # Agent Test: [journey name]
  **Persona behavior**: patience=[N]/10, retry=[strategy]

  ## Steps
  For each step:
  1. Interact: [action]
  2. Narrate: express confusion, expectations
  3. Validate: [success criteria]
  4. Screenshot: if checkpoint or failure
  5. Record: difficulty, duration, unclear elements
}
