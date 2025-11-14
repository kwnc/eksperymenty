# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Multi-Agent Workflow Template with Claude Code

## Core Concept

The agent workflow involves using Claude's user memory feature to establish distinct agent roles and enable them to work together on complex projects. Each agent operates in its own terminal instance with specific responsibilities and clear communication protocols.

## Four Agent System Overview

### INITIALIZE: Standard Agent Roles

**Agent (Builder): Core Implementation**

- **Role Acknowledgment**: "I am Agent - The Builder responsible for local web app MVP Implementation"
- **Primary Tasks**: Feature development, main implementation work, core functionality
- **Tools**: File manipulation, code generation, system operations
