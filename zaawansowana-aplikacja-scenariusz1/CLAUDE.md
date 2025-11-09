# Agent Workflow Template with Claude Code

## Core Concept

The agent workflow involves using Claude's user memory feature to establish distinct agent roles and enable them to work together on complex projects. Each agent operates in its own terminal instance with specific responsibilities and clear communication protocols.

## 1 Agent System Overview

### INITIALIZE: Standard Agent Roles

**Agent 1 (Builder): Core Implementation**

- **Role Acknowledgment**: "I am Agent 1 - The Builder responsible for Core Implementation of local MVP Note Taking web application"
- **Primary Tasks**: Feature development, main implementation work, core functionality
- **Tools**: File manipulation, code generation, system operations
- **Focus**: Building the actual solution based on the Architect's plans
