# Local MVP Spec Document

# **App Name**: NoteNest

## Core Features:

- **User Management**: Secure authentication and authorization for users. Users can register, log in, and manage their profile.
- **Note Creation & Editing**: Create, edit, and delete rich-text notes. Notes can include text formatting (bold, italic, headers), checklists, bullet points, and links.
- **Notebook Organization**: Group notes into notebooks/folders for better organization and categorization.
- **Search & Tags**: Add tags to notes and use a search bar to quickly find content across notebooks.
- **Sharing**: Export and share notes externally (no real-time collaboration features in local MVP).
- **AI Summarizer**: Summarization powered by the OpenAI API to extract action items and key highlights (requires internet connection).
- **Note Export**: Export notes to PDF or send them via email for external sharing.

## Advanced Local Features

- **Attachments & OCR**: Store images/PDFs as attachments. Local OCR (e.g., Tesseract) to make attachments searchable.
- **Markdown/HTML Import & Export**: Import from Markdown/HTML; export notes/notebooks as Markdown with front‑matter metadata.
- **Theming**: Dark mode + custom theme variables; user CSS overrides.
- **Code & Diagrams**: Syntax highlighting for code blocks; local Mermaid preview for sequence/flow charts.
- **Calendar & Kanban Views**: Calendar view from date metadata; Kanban board from tags/status fields.

## Style Guidelines:

- **Primary color**: Orange (#E97900) to convey a warm and creative interface.
- **Secondary color**: Light gray (#ECEFF1) for backgrounds and content areas.
- **Accent**: Teal (#81C4FF) for interactive elements and highlights.
- **Typography**: Clean and modern fonts optimized for reading and writing.
- **Icons**: Use intuitive icons for actions like edit, delete, share, and organize.
- **Layout**: Clear, distraction-free note editor and clean navigation between notebooks, tags, and settings.
- **UX Enhancements**: Subtle animations on note saving, loading, and navigation to enhance experience.

## Problems Being Solved

- Disorganized note management across multiple tools.
- Inability to quickly retrieve important notes and highlights.
- No integrated AI support for summarization and extraction of insights.
- Limited options for exporting and sharing notes in a structured way.

## User Roles

- **User**: The main role — creates, organizes, and manages personal or shared notes.
- **Logged Out User**: A person who has not registered or logged in to NoteNest yet.

## User Stories

### User

- As a user, I want to register and log in securely, so I can access my notes from any device.
- As a user, I want to create and edit rich-text notes, so I can record information in a flexible format.
- As a user, I want to organize my notes into folders or notebooks, so I can easily find related content.
- As a user, I want to tag my notes and search them, so I can quickly locate specific information.
- As a user, I want to share my notes externally (via export or email), so I can distribute them outside the app.
- As a user, I want to use AI (via OpenAI API) to summarize long notes, so I can quickly get the gist of a document.
- As a user, I want to export my notes to PDF or email them, so I can share them outside of the app.

### Advanced User Stories

- As a user, I want to import/export Markdown, so I’m not locked in.
- As a user, I want local OCR for attachments, so images/PDFs are searchable without internet.

### Logged Out User

- As a logged out user, I want to register for an account, so I can start taking notes and organizing my thoughts.
- As a logged out user, I want to reset my password if I forget it, so I can regain access to my content.

---
