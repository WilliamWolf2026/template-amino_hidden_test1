Additional Improvement Areas

Items discovered during codebase review that aren't covered in the main roadmap scoping document. These supplement the 13 items already tracked in the roadmap scoping doc.

**Doc hygiene — stale references**
Around 8 docs still reference the pre-Amino structure. The architecture deep-dive, context map, extraction reports, testing strategy, shared-components guide, and newgame factory command all need updating to reflect the current three-tier layout.

**Testing infrastructure**
A testing strategy doc exists with vitest and Playwright blueprints, but nothing is wired up. No test runner config, no test files, no CI pipeline running tests. The doc is a plan that was never executed.

**Utility algorithm modules**
SeededRandom, Dijkstra, PriorityQueue, and XoroShiro128Plus are sitting in the CityLines archive. They're pure, zero-dependency algorithms that any procedural or grid-based game could use. Natural fit as shared logic modules.

**/newmodule factory command**
CLAUDE.md references a /newmodule command, but it doesn't exist in the factory index and there's no matching factory doc. The writing-a-module guide covers the process manually, but there's no automated workflow to scaffold the folder structure, defaults, tuning, and barrel export.

**Localization**
Acknowledged in the guides TODO list. No i18n infrastructure exists — no string tables, no locale detection, no RTL support. Relevant if games ship on multi-market publisher sites.

**CI/CD + release process**
Also acknowledged in the guides TODO. A sample GitHub Actions workflow exists in the testing strategy doc but it's a template, not something running. No versioning, changelog, or rollback process is defined.

**Ad unit / embed integration**
Games are embedded as ad units on publisher sites. Worth tracking whether the scaffold needs any embed-aware infrastructure — host-page communication, viewport constraints from the ad container, or analytics bridging between the game and the publisher's tracking.

**Companion system as a module**
The vision doc lists companion characters as shared infrastructure. Most components were extracted to modules, but useCompanionDialogue still lives in game code. The companion pattern — character introduces chapter, delivers clues, celebrates completion — could be elevated to a prefab or logic module.

**Tuning auto-discovery gap**
The module docs claim tuning auto-discovers with no manual registration. The tuning system docs describe a manual wired/unwired registry. These contradict each other. Either the docs need correcting or the auto-discovery promise needs to be implemented. Directly related to roadmap item #9.
