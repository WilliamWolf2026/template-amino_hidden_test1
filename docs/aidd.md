Skip to content
paralleldrive
aidd
Repository navigation
Code
Issues
7
(7)
Pull requests
10
(10)
Discussions
Actions
Projects
Security
Insights
Owner avatar
aidd
Public
paralleldrive/aidd
Go to file
t
Name
ericelliott
ericelliott
Improve clarity of AIDD benefits in README (#82)
4425f40
·
3 days ago
.github
ci: add GitHub Actions workflow for automated testing
3 months ago
.husky
fix: Move User Testing section and automate ToC generation (#66)
3 weeks ago
ai
Create SudoLang syntax cheat sheet
last week
bin
feat: Add /user-test command for AI agent user testing (#65)
3 weeks ago
docs
Add new setup guide for Next.js with ShadCN (#69)
2 weeks ago
lib
feat: Add AGENTS.md installer and --index command (#58)
last month
plan
feat(docs): add Parallel Drive User Testing integration (#67)
3 weeks ago
src/server
Merge pull request #54 from paralleldrive/copilot/add-js-rules-error-…
last month
tasks
feat(docs): add Parallel Drive User Testing integration (#67)
3 weeks ago
utils
feat(utils): add composition utilities barrel
2 months ago
.cursor
feat(ai): comprehensive metaprogram system enhancement
4 months ago
.gitignore
Rename SudoLang AIDD to AIDD Framework (#60)
last month
.release-it.json
feat: epics and releases
4 months ago
AGENTS.md
feat: Add AGENTS.md installer and --index command (#58)
last month
CHANGELOG.md
feat(docs): add Parallel Drive User Testing integration (#67)
3 weeks ago
CONTRIBUTING.md
Update CONTRIBUTING.md
2 months ago
LICENSE
Initial commit
7 months ago
README.md
Improve clarity of AIDD benefits in README (#82)
3 days ago
activity-log.md
Rename SudoLang AIDD to AIDD Framework (#60)
last month
eslint.config.mjs
Update eslint.config.mjs
4 months ago
package-lock.json
chore(release): v2.5.0
3 weeks ago
package.json
chore(release): v2.5.0
3 weeks ago
plan.md
Rename SudoLang AIDD to AIDD Framework (#60)
last month
release.js
Fix lint
4 months ago
tsconfig.json
feat: add tree-shakeable asyncPipe export
2 months ago
vitest.config.js
refactor: enable parallel test execution and remove analysis doc
2 months ago
Repository files navigation
README
Contributing
MIT license
Security
AIDD Framework
AIDD FrameworkParallel Drive

The standard framework for AI Driven Development

AI agents like Claude Code ship features fast. aidd Framework keeps them working, secure, and maintainable.

AI agents generate code that runs but fails at scale. GitClear tracked 211 million lines from 2020 to 2024 and found 8x more code duplication as AI adoption increased. Google's DORA report shows AI adoption correlates with 9% higher bug rates and degraded stability. Agents skip tests, couple modules, duplicate logic, and miss vulnerabilities.

AIDD provides the architecture, test workflows, and specification system that turn AI speed into sustainable velocity so you can ship secure, production-ready, maintainable software, quickly.

Includes:

AIDD CLI – project bootstrap and automation
Agent Runtime – workflows from product discovery to commit and release
SudoLang Prompt Language – typed pseudocode for AI orchestration
Server Framework – composable backend for Node and Next.js
Utilities & Component Library – common patterns and reusable recipes to accelerate your app development
Table of Contents
About AIDD Framework
🚀 Quick Start with AIDD CLI
📋 Requirements
Detailed Installation Instructions
Development Workflow
🧪 User Testing
Why SudoLang?
What's Included
🚀 AIDD Server Framework
Authentication Middleware
🛠️ AIDD CLI Reference
Installation & Usage
Command Options
Examples
📁 AI System Structure
Key Components
🎯 AI Integration
📋 Vision Document
Why You Need a Vision Document
Creating Your Vision Document
How Agents Use the Vision Document
AGENTS.md File
🔧 Cursor Editor Setup
Automatic Setup (Recommended)
When to Use --cursor
When NOT to Use --cursor
Manual Integration
Troubleshooting
📄 License
🤝 Contributing
About AIDD Framework
AI-Driven Development (AIDD) is a methodology where AI systems take primary responsibility for generating, testing, and documenting code, automating most of the software creation process so humans can focus on the big picture and 10× their productivity.

AIDD Framework is a collection of reusable metaprograms, agent orchestration systems, and prompt modules that put high-quality software engineering processes on autopilot rails. It implements time-tested workflows including specification-driven development, systematic task planning with Test Driven Development (TDD), and automated code review with best practices enforcement.

SudoLang is a pseudocode language for prompting large language models with clear structure, strong typing, and explicit control flow.

AI Workflow Commands - Use these in your AI assistant chat (Cursor, ChatGPT, Claude, etc.):

/discover - what to build
/task - plan a task epic to implement a user story from the discovery
/execute - task epics with TDD
/review - the results
/log - log the changes to the activity log
/commit - commit the changes to the repository
/user-test - generate user testing scripts for post-deploy validation
🚀 Quick Start with AIDD CLI
npx aidd --help
To install for Cursor:

# In your project folder

npx aidd --cursor
Install without Cursor integration:

# You can also specify a project folder:

npx aidd my-project
📋 Requirements
Node.js: 16.0.0+ (requires ESM support)
Environment: Unix/Linux shell (bash, zsh) or Windows with WSL
Editors: Works with any editor; optimized for Cursor
LLM: Works with any sufficiently advanced LLM. As of this writing, we recommend Claude 4.5 Sonnet.
Agents: You can ask most agent systems to use this system.
Detailed Installation Instructions
Install SudoLang syntax highlighting: Visit the SudoLang Github Repository and install syntax highlighting for your editor.

Clone the AI system:

# Recommended: Creates ai/ folder + .cursor symlink for automatic integration

npx aidd --cursor my-project

# Alternative: Just the ai/ folder (manual integration required)

npx aidd my-project
Create a Vision Document (important!):

Create a vision.md file in your project root. This document serves as the source of truth for AI agents. See Vision Document for details.

Explore the structure:

cd my-project
ls ai/ # See available components
cat ai/rules/please.mdc # Read the main orchestrator
Start using AI workflows:

Reference ai/rules/ in AI prompts for better context
Use ai/commands/ as workflow templates
Customize rules for your specific project needs
This gives you immediate access to:

🤖 Agent orchestration rules (ai/rules/)
⚙️ AI workflow commands (ai/commands/)
📋 Development best practices (JavaScript, TDD, UI/UX)
🎯 Product management tools (user stories, journey mapping)
Development Workflow
For features or bug fixes spanning more than a few lines:

Create a branch: git checkout -b your-branch-name
Discover what to build with /discover: Set up your project profile and discover key user journeys to create a user story map (saved to plan/story-map/)
Plan execution with /task: Create a structured epic with clear requirements
Review with /review: Eliminate duplication, simplify without losing requirements
Execute with /execute: Implement using TDD, one requirement at a time
Push and PR: git push origin your-branch-name then open a Pull Request
Note: We use this process to build the aidd framework. See CONTRIBUTING.md for details.

🧪 User Testing
Validate features with real users and AI agents. AIDD generates dual testing scripts from user journeys:

Human scripts - Think-aloud protocol with video recording for manual testing
AI agent scripts - Executable tests with screenshots and persona-based behavior
Research from the Nielsen Norman Group shows that testing with just 3-5 users reveals 65-85% of usability problems. Iterate quickly by testing small, fixing issues, and testing again.

Quick start:

/discover # Create user journey (saved to plan/story-map/)
/user-test journey.yaml # Generate testing scripts (saved to plan/)
/run-test agent-script # Execute AI agent test
📖 Read the complete User Testing Guide →

Why SudoLang?
For most simple prompts, natural language is better. Use it. But if you need the AI to follow a program, obey constraints, keep track of complex state, or implement complex algorithms, SudoLang can be extremely useful.

Because of the natural language emphasis, SudoLang is easier to learn than programming languages like JavaScript or Python.
Pseudocode can improve reasoning performance vs natural language prompts, and create shorthands for many prompting styles, such as chain-of-thought reasoning, decision trees, etc.
SudoLang is a declarative, constraint-based, interface-oriented programming language, which makes it one of the most expressive and compact programming languages in the world. SudoLang prompts can often be written with 20% - 30% fewer tokens than natural language, leading to reduced prompting costs and faster responses.
Structured pseudocode provides scope blocks, indentation, and visual encapsulation which makes it easier to navigate and maintain complex prompts than natural language.
Structured templates and queries using predefined types and interfaces can reduce the probability of malformed responses and dramatically reduce the number of tokens required to interact with the language model, particularly when requesting data in yaml or csv formats.
Please read the SudoLang documentation for more information about the language.

What's Included
Modules include:

🧠 Metaprograms for LLMs (programs that build programs)
🧭 Product discovery and story mapping
🤖 Agent behaviors and workflows
🧪 Test generators
🛠️ Development process automation scripts
🚀 Optional composable server framework (lightweight Express alternative)
Coming soon:

🎨 UI sketch prompts
📄 Documentation generators
🔌 API design
🚀 AIDD Server Framework
A lightweight alternative to Express, built for function composition and type-safe development.

Why AIDD Server?

Function composition - Clean asyncPipe patterns instead of middleware chains
Type-safe - Complete TypeScript definitions included
Secure by default - Sanitized logging, explicit CORS, fail-fast configuration
Production-ready - Comprehensive test coverage, battle-tested patterns
Quick Example:

import {
createRoute,
withRequestId,
createWithConfig,
loadConfigFromEnv,
} from "aidd/server";

// Load API keys from environment with fail-fast validation
const withConfig = createWithConfig(() =>
loadConfigFromEnv(["OPENAI_API_KEY", "DATABASE_URL"])
);

export default createRoute(
withRequestId,
withConfig,
async ({ request, response }) => {
// Throws immediately if OPENAI_API_KEY is missing
const apiKey = response.locals.config.get("OPENAI_API_KEY");

    response.status(200).json({
      message: "Config loaded securely",
      requestId: response.locals.requestId,
    });

}
);
Core Features:

createRoute - Compose middleware with automatic error handling
createWithConfig - Fail-fast configuration with config.get()
withRequestId - CUID2 request tracking for logging
createWithCors - Explicit origin validation (secure by default)
withServerError - Standardized error responses
createWithAuth / createWithOptionalAuth - Session validation with better-auth
Authentication Middleware
AIDD Server includes optional auth middleware that wraps better-auth for session validation.

1. Install better-auth:

npm install better-auth 2. Configure better-auth (see better-auth docs):

// lib/auth.server.js
import { betterAuth } from "better-auth";

export const auth = betterAuth({
database: yourDatabaseAdapter,
emailAndPassword: { enabled: true },
}); 3. Create auth API route (framework-specific):

// Next.js: app/api/auth/[...all]/route.js
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth.server";

export const { GET, POST } = toNextJsHandler(auth); 4. Use AIDD auth middleware in protected routes:

import { createRoute, withRequestId, createWithAuth } from "aidd/server";
import { auth } from "@/lib/auth.server";

const withAuth = createWithAuth({ auth });

// Protected route - returns 401 if not authenticated
export default createRoute(withRequestId, withAuth, async ({ response }) => {
const { user } = response.locals.auth;
response.json({ email: user.email });
});
Optional auth for public routes that benefit from user context:

import { createWithOptionalAuth } from "aidd/server";

const withOptionalAuth = createWithOptionalAuth({ auth });

// Public route - user attached if logged in, null otherwise
export default createRoute(withOptionalAuth, async ({ response }) => {
const user = response.locals.auth?.user;
response.json({
greeting: user ? `Hello, ${user.name}` : "Hello, guest",
});
});
Passkey authentication (passwordless):

npm install @better-auth/passkey
// lib/auth.server.js
import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";

export const auth = betterAuth({
database: yourDatabaseAdapter,
plugins: [passkey()],
});
// API route: Register passkey (requires authentication)
import { createRoute, createWithAuth } from "aidd/server";
import { auth } from "@/lib/auth.server";

const withAuth = createWithAuth({ auth });

export default createRoute(withAuth, async ({ request, response }) => {
const { user } = response.locals.auth;

// User is authenticated, register their passkey
const result = await auth.api.addPasskey({
body: { name: `${user.email}'s passkey` },
headers: request.headers,
});

response.json(result);
});
// API route: List user's passkeys
export default createRoute(withAuth, async ({ request, response }) => {
const passkeys = await auth.api.listPasskeys({
headers: request.headers,
});
response.json({ passkeys });
});
📖 See complete Server Framework documentation →

🛠️ AIDD CLI Reference
The AI Driven Development (AIDD) CLI tool clones the complete AI agent orchestration system to any directory.

Installation & Usage

# Recommended: Use npx (no installation required)

npx aidd [target-directory] [options]

# Alternative: Global installation

npm install -g aidd
aidd [target-directory] [options]
Command Options
Option Description
target-directory Directory to create ai/ folder in (defaults to current)
-f, --force Overwrite existing ai/ folder
-d, --dry-run Show what would be copied without copying
-v, --verbose Provide detailed output
-c, --cursor Create .cursor symlink for Cursor editor integration
-i, --index Generate index.md files from frontmatter in ai/ subfolders
-h, --help Display help information
--version Show version number
Examples

# Basic usage

npx aidd # Current directory
npx aidd my-project # Specific directory

# Preview and force options

npx aidd --dry-run # See what would be copied
npx aidd --force --verbose # Overwrite with details

# Cursor editor integration

npx aidd --cursor # Create .cursor symlink
npx aidd my-project --cursor --verbose

# Generate index files

npx aidd --index # Regenerate ai/ index.md files
npx aidd --index --verbose # Show all generated files

# Multiple projects

npx aidd frontend-app
npx aidd backend-api
📁 AI System Structure
After running the CLI, you'll have a complete ai/ folder:

your-project/
├── ai/
│ ├── commands/ # Workflow commands
│ │ ├── help.md # List available commands
│ │ ├── plan.md # Project planning
│ │ ├── review.md # Code reviews
│ │ ├── task.md # Task management
│ │ └── ...
│ ├── rules/ # Agent orchestration rules
│ │ ├── agent-orchestrator.mdc
│ │ ├── javascript/ # JS/TS best practices
│ │ ├── frameworks/ # Redux, TDD patterns
│ │ ├── productmanager.mdc
│ │ ├── tdd.mdc
│ │ ├── ui.mdc
│ │ └── ...
│ └── ...
├── plan/ # Product discovery artifacts
│ ├── story-map/ # User journeys & personas (YAML)
│ ├── _-human-test.md # Human test scripts
│ └── _-agent-test.md # AI agent test scripts
└── your-code/
Key Components
Agent Orchestrator (ai/rules/agent-orchestrator.mdc) - Coordinates multiple AI agents
Development Rules (ai/rules/javascript/, ai/rules/tdd.mdc) - Best practices and patterns
Workflow Commands (ai/commands/) - Structured AI interaction templates
Product Management (ai/rules/productmanager.mdc) - User stories and journey mapping
Product Discovery Artifacts (plan/story-map/) - User journeys, personas, and story maps (YAML format)
User Testing Scripts (plan/) - Human and AI agent test scripts generated from journeys
UI/UX Guidelines (ai/rules/ui.mdc) - Design and user experience standards
🎯 AI Integration
This system is designed to work with AI coding assistants:

Cursor - AI-first code editor
GitHub Copilot - AI pair programmer
ChatGPT - General AI assistance
Claude - Advanced reasoning and code review
The rules provide context and structure for more effective AI interactions.

📋 Vision Document
The vision document (vision.md) is a critical component of AIDD that serves as the source of truth for AI agents working on your project.

Why You Need a Vision Document
AI agents are powerful but need context to make good decisions. Without a clear vision:

Agents may make architectural choices that conflict with your goals
Features might be implemented in ways that don't align with your product direction
Different agents working on the same project may take inconsistent approaches
Creating Your Vision Document
Create a vision.md file in your project root with the following sections:

# Project Vision

## Overview

Brief description of what this project does and who it's for.

## Goals

- Primary goal 1
- Primary goal 2
- ...

## Non-Goals (Out of Scope)

Things this project explicitly will NOT do.

## Key Constraints

- Technical constraints (e.g., must use specific frameworks)
- Business constraints (e.g., must be GDPR compliant)
- Performance requirements

## Architectural Decisions

Major technical decisions and their rationale.

## User Experience Principles

How the product should feel to users.

## Success Criteria

How we measure if the project is successful.
How Agents Use the Vision Document
The AIDD system instructs agents to:

Read the vision first - Before creating or running any task, agents read vision.md to understand project context
Check for conflicts - When given a task, agents compare it against the vision to identify potential conflicts
Ask for clarification - If a task conflicts with the vision, agents will stop and ask you how to resolve the conflict rather than proceeding blindly
This ensures that all AI-generated code and decisions align with your project's goals.

AGENTS.md File
When you run the AIDD installer, it automatically creates (or updates) an AGENTS.md file in your project root. This file contains directives that help AI agents:

Navigate the ai/ directory structure efficiently
Use index.md files to understand folder contents without reading every file
Practice progressive discovery (only reading folders relevant to the current task)
Respect the vision document as the source of truth
Handle conflicts appropriately
🔧 Cursor Editor Setup
The AIDD CLI can automatically set up the AI agent system for Cursor editor users.

Automatic Setup (Recommended)

# Creates both ai/ folder AND .cursor symlink

npx aidd --cursor

# This creates:

# ai/ <- The complete AI system

# .cursor -> ai <- Symlink for Cursor integration

When to Use --cursor
✅ New projects: No existing .cursor configuration
✅ Cursor editor users: Want automatic agent orchestration
✅ Quick setup: Want everything working immediately
When NOT to Use --cursor
❌ Existing .cursor folder: You already have Cursor rules
❌ Custom setup: You want to manually integrate with existing rules
❌ Non-Cursor editors: Using VS Code, Vim, etc.
Manual Integration
If you already have a .cursor folder or use a different editor:

# 1. Clone without symlink

npx aidd my-project
For Cursor users with existing rules:

Reference the rules in your prompts or add to .cursor/rules:

See ai/rules/javascript/javascript.mdc for JavaScript best practices
See ai/rules/tdd.mdc for test-driven development
See ai/rules/productmanager.mdc for product management
For other editors (VS Code, Vim, etc.):

Reference rules directly in your AI assistant prompts:

Please follow the guidelines in ai/rules/javascript/javascript.mdc
Use the workflow from ai/commands/task.md
Troubleshooting
Verify Installation

# Check that ai/ folder was created

ls ai/

# Verify key files exist

ls ai/rules/please.mdc
ls ai/commands/
Common Issues

# If .cursor already exists, use --force

npx aidd --cursor --force

# Preview what --cursor will do

npx aidd --cursor --dry-run --verbose

# Clear npx cache if installation fails

npx clear-npx-cache
npx aidd --cursor

# Check Node version (requires 16.0.0+)

node --version
Updating

# Simply run aidd again to get latest version

npx aidd --force
Uninstalling

# Remove the ai/ folder

rm -rf ai/

# Remove .cursor symlink if it exists

rm .cursor
📄 License
MIT © ParallelDrive

🤝 Contributing
We welcome contributions! Follow the Development Workflow above, and see CONTRIBUTING.md for details.

Start building with AI orchestration today:

npx aidd --cursor
About
The standard framework for AI Driven Development
