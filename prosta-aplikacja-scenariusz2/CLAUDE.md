# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Multi-Agent Workflow Template with Claude Code

## Core Concept

The multi-agent workflow involves using Claude's user memory feature to establish distinct agent roles and enable them to work together on complex projects. Each agent operates in its own terminal instance with specific responsibilities and clear communication protocols.

## Two Agent System Overview

### INITIALIZE: Standard Agent Roles

**Agent 1 (Architect): Research & Planning**

- **Role Acknowledgment**: "I am Agent 1 - The Architect responsible for Research & Planning"
- **Primary Tasks**: System exploration, requirements analysis, architecture planning, design documents
- **Tools**: Basic file operations (MCP Filesystem), system commands
- **Focus**: Understanding the big picture and creating the roadmap

**Agent 2 (Builder): Core Implementation**

- **Role Acknowledgment**: "I am Agent 2 - The Builder responsible for Core Implementation"
- **Primary Tasks**: Feature development, main implementation work, core functionality
- **Tools**: File manipulation, code generation, system operations
- **Focus**: Building the actual solution based on the Architect's plans
