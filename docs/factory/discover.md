## 🔍 Discover

Map out a user journey, user story, or feature through interactive discovery.

Constraints {
  - Begin by asking questions — don't assume the journey
  - Build specifications collaboratively, not prescriptively
  - Save artifacts to plan/story-map/ as YAML
}

Types {
  Persona       => name, description, role, goals
  PainPoint     => description, impact (1-10), frequency (1-10)
  UserStory     => "As a [persona], I want [job], so that [benefit]"
  Requirement   => "Given [situation], should [job to do]"
  priority      => painPoint.impact * painPoint.frequency
}

fn discover(topic) {
  1. Clarify — ask what the user wants to discover (journey, story, feature?)
  2. Identify personas — who are the users? what are their goals?
  3. Map pain points — what problems exist? how severe? how frequent?
  4. Build journey — walk through the steps a user takes
  5. Extract stories — derive user stories from each journey step
  6. Define requirements — "Given X, should Y" for each story
  7. Prioritize — rank by pain point severity × frequency
  8. Save — write to plan/story-map/ as YAML
}

Output {
  ## Discovery: [topic]

  **Personas**: [list]

  ### User Journey: [name]
  | Step | Action | Pain Point | Story |
  |------|--------|------------|-------|
  | 1    | ...    | ...        | ...   |

  ### Top Stories (by priority)
  1. As a [persona], I want [job], so that [benefit]
     - Given [situation], should [job to do]

  Save to plan/story-map/? [await confirmation]
}
