# MULTI_AGENT_PLAN.md

## Project: NoteNest - Local MVP Note Taking Web Application

### Overview
NoteNest is a lightweight, local-first note-taking application with tagging capabilities. The application runs entirely in the browser with no backend requirements, providing a distraction-free environment for quick note-taking.

---

## Agent Roles & Responsibilities

### Agent 1 (Architect) - Research & Planning
- System exploration and requirements analysis
- Architecture design and documentation
- Directory structure initialization
- Design system specification
- API/Module interface definitions

### Agent 2 (Builder) - Core Implementation
- HTML structure implementation
- CSS styling per design specifications
- JavaScript functionality implementation
- Local storage integration
- Feature development and testing

---

## Technical Architecture

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser LocalStorage API
- **Dependencies**: None (pure vanilla implementation)

### Design Specifications
- **Primary Color**: Orange (#E97900) - buttons, highlights, active states
- **Secondary Color**: Light Gray (#ECEFF1) - background
- **Typography**: System sans-serif fonts (Arial, Helvetica, sans-serif)
- **Layout**: Single-column, mobile-first responsive design

---

## Project Structure

```
srednia-aplikacja-scenariusz2/
├── index.html              # Main application entry point
├── css/
│   ├── styles.css         # Main stylesheet
│   ├── components.css     # Component-specific styles
│   └── variables.css      # CSS custom properties (colors, spacing)
├── js/
│   ├── app.js            # Main application controller
│   ├── storage.js        # LocalStorage management
│   ├── notes.js          # Note CRUD operations
│   └── tags.js           # Tag management and filtering
├── note_app_spec.md      # Product specification
├── CLAUDE.md             # Multi-agent workflow instructions
└── MULTI_AGENT_PLAN.md   # This file - architecture & plan
```

---

## Core Modules & Interfaces

### 1. Storage Module (storage.js)
**Purpose**: Handle all LocalStorage interactions

**Interface**:
```javascript
// Initialize storage
function initStorage()

// Save notes array to storage
function saveNotes(notes)

// Load notes from storage
function loadNotes()

// Clear all data
function clearStorage()
```

### 2. Notes Module (notes.js)
**Purpose**: Manage note CRUD operations

**Data Structure**:
```javascript
{
  id: String,           // Unique identifier (timestamp-based)
  title: String,        // Note title
  content: String,      // Note body content
  tags: Array<String>,  // Array of tag strings
  createdAt: Date,      // Creation timestamp
  updatedAt: Date       // Last modification timestamp
}
```

**Interface**:
```javascript
// Create a new note
function createNote(title, content, tags)

// Get note by ID
function getNoteById(id)

// Update existing note
function updateNote(id, title, content, tags)

// Delete note
function deleteNote(id)

// Get all notes
function getAllNotes()

// Filter notes by tag
function getNotesByTag(tag)
```

### 3. Tags Module (tags.js)
**Purpose**: Manage tag operations and filtering

**Interface**:
```javascript
// Get all unique tags from all notes
function getAllTags()

// Add tag to note
function addTagToNote(noteId, tag)

// Remove tag from note
function removeTagFromNote(noteId, tag)

// Filter notes by tag
function filterByTag(tag)
```

### 4. App Controller (app.js)
**Purpose**: Coordinate UI interactions and module communication

**Responsibilities**:
- Initialize the application
- Handle UI event listeners
- Coordinate between storage, notes, and tags modules
- Update DOM based on data changes
- Manage application state

---

## User Interface Components

### 1. Note Editor Section
- Title input field
- Content textarea (multiline)
- Tags input (comma-separated or chip-based)
- Save button (Orange #E97900)
- Cancel/Clear button

### 2. Notes List Section
- Display all notes in chronological order (newest first)
- Each note card shows:
  - Title
  - Content preview (truncated)
  - Tags (as colored chips/badges)
  - Edit button
  - Delete button

### 3. Tag Filter Section
- Display all unique tags
- Clickable tag chips for filtering
- "Show All" option to clear filters
- Active tag highlight

### 4. Feedback Mechanisms
- Toast notifications for actions (saved, deleted, etc.)
- Subtle animations on create/edit
- Visual feedback on interactions

---

## Implementation Phases

### Phase 1: Foundation (Agent 1)
- [x] Create MULTI_AGENT_PLAN.md
- [ ] Initialize directory structure
- [ ] Create base HTML structure template
- [ ] Create CSS variables file
- [ ] Document handoff to Agent 2

### Phase 2: Core Implementation (Agent 2)
- [ ] Implement storage.js module
- [ ] Implement notes.js module
- [ ] Implement tags.js module
- [ ] Build complete HTML structure
- [ ] Implement CSS styling
- [ ] Implement app.js controller
- [ ] Add toast notifications
- [ ] Add animations and transitions

### Phase 3: Testing & Refinement (Agent 2)
- [ ] Test all CRUD operations
- [ ] Test tag filtering
- [ ] Test data persistence across sessions
- [ ] Verify responsive design
- [ ] Browser compatibility check
- [ ] Performance optimization

---

## User Flow

1. **Initial Load**
   - App loads existing notes from LocalStorage
   - Displays notes list
   - Shows available tags

2. **Create Note**
   - User fills title, content, and tags
   - Clicks Save button
   - Note is saved to LocalStorage
   - Toast notification confirms save
   - Note appears in list
   - Form clears for next note

3. **Edit Note**
   - User clicks Edit on a note card
   - Form populates with existing data
   - User modifies and saves
   - Changes persist to LocalStorage
   - Toast confirms update

4. **Delete Note**
   - User clicks Delete on a note card
   - Confirmation prompt (optional)
   - Note removed from LocalStorage
   - Toast confirms deletion
   - UI updates

5. **Filter by Tag**
   - User clicks a tag chip
   - Notes list filters to show only matching notes
   - Active tag highlighted
   - Click "Show All" to clear filter

---

## Data Persistence Strategy

- Use LocalStorage for all data persistence
- Store notes as JSON array under key: `notenest_notes`
- Auto-save on every create/update/delete operation
- No explicit "sync" needed - immediate persistence
- Handle LocalStorage quota limits gracefully

---

## Design System

### Colors
```css
--primary-orange: #E97900;
--primary-orange-hover: #D06D00;
--background-gray: #ECEFF1;
--text-dark: #212121;
--text-light: #757575;
--border-gray: #BDBDBD;
--white: #FFFFFF;
--success-green: #4CAF50;
--error-red: #F44336;
```

### Spacing Scale
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

### Typography
```css
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

---

## Success Criteria

- [ ] Users can create notes with title, content, and tags
- [ ] Users can edit existing notes
- [ ] Users can delete notes
- [ ] Users can filter notes by tags
- [ ] Notes persist across browser sessions
- [ ] UI matches design specifications (colors, typography)
- [ ] Responsive design works on mobile and desktop
- [ ] Toast notifications provide feedback
- [ ] Smooth animations enhance UX
- [ ] No console errors or warnings
- [ ] Works in modern browsers (Chrome, Firefox, Safari, Edge)

---

## Handoff Notes

### For Agent 2 (Builder)
After Agent 1 completes Phase 1:
1. Review this MULTI_AGENT_PLAN.md thoroughly
2. Check directory structure is created
3. Use the module interfaces defined above
4. Follow the design system specifications
5. Implement phases 2 and 3 sequentially
6. Test each module independently before integration
7. Ensure all success criteria are met

### Communication Protocol
- Agent 1 will create foundation and document decisions
- Agent 2 will implement based on this plan
- Any architectural changes should be documented here
- Keep CLAUDE.md updated with workflow insights

---

## Future Enhancements (Out of Scope for MVP)
- Note search functionality
- Rich text editing
- Note export (JSON, Markdown)
- Cloud sync
- Multiple note views (list, grid, timeline)
- Dark mode
- Note sharing
- Nested tags/categories

---

**Document Status**: Draft - Phase 1 in progress
**Last Updated**: 2025-11-13
**Primary Architect**: Agent 1
