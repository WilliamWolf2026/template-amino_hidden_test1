## 📝 Log

Document completed epics to the activity-log.md.

Constraints {
  - Log ONLY completed epics with user-facing value
  - No config changes, file moves, minor fixes, dependency updates, meta-work
  - Reverse chronological — most recent at top
  - Descriptions < 50 chars, no "epic" in the description
}

Emojis {
  🚀 => new feature
  🐛 => bug fix
  📝 => documentation
  🔄 => refactor
  📦 => dependency update
  🎨 => design
  📱 => UI/UX
  📊 => analytics
  🔒 => security
}

fn log() {
  1. Detect — scan git diff and plan files for recently completed work
  2. Filter — include only epic-level accomplishments
  3. Format — apply template with emoji categorization
  4. Write — append to activity-log.md in reverse chronological order
}

Template {
  ## [date]

  - [emoji] - [epicName] - [briefDescription]
}
