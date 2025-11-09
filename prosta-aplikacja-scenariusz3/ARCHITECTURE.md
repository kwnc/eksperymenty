# Technical Architecture Document
## Local MVP Note Taking Application

### System Overview
A client-side web application for note-taking that operates entirely in the browser without external dependencies. The application prioritizes simplicity, performance, and offline functionality.

## Architecture Decisions

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript
- **Storage**: localStorage with indexedDB fallback
- **Build Process**: None (direct file serving)
- **Testing**: Browser-native testing with simple test runner

### Design Principles
1. **Zero Dependencies**: No external libraries or frameworks
2. **Offline First**: All functionality works without internet
3. **Progressive Enhancement**: Graceful degradation for older browsers
4. **Mobile Responsive**: Touch-friendly interface
5. **Performance**: Fast load times and smooth interactions

## Data Models

### Note Object
```javascript
{
  id: string,           // UUID v4
  title: string,        // Max 200 characters
  content: string,      // No limit (localStorage permitting)
  createdAt: timestamp, // ISO 8601 string
  updatedAt: timestamp, // ISO 8601 string
  tags: string[]        // Optional, for future enhancement
}
```

### Application State
```javascript
{
  notes: Note[],
  currentNoteId: string | null,
  searchQuery: string,
  filteredNotes: Note[],
  isEditing: boolean
}
```

## Component Architecture

### Core Components
1. **App Controller** (`js/app.js`)
   - Main application logic
   - State management
   - Event delegation
   - Component coordination

2. **Storage Manager** (`js/storage.js`)
   - localStorage abstraction
   - Data persistence
   - Error handling
   - Migration support

3. **Notes List** (`js/components/notesList.js`)
   - Render notes sidebar
   - Handle note selection
   - Search filtering
   - Virtual scrolling (future)

4. **Note Editor** (`js/components/noteEditor.js`)
   - Rich text editing
   - Auto-save functionality
   - Validation
   - Keyboard shortcuts

5. **Utilities** (`js/utils.js`)
   - Helper functions
   - Date formatting
   - Text processing
   - DOM utilities

## Storage Strategy

### Primary: localStorage
- Synchronous API
- ~10MB storage limit
- Simple key-value storage
- Automatic JSON serialization

### Fallback: indexedDB
- Asynchronous API
- Larger storage capacity
- More complex but robust
- Better performance for large datasets

### Data Structure
```
localStorage keys:
- 'notes_app_version': string (for migration)
- 'notes_data': serialized notes array
- 'notes_settings': user preferences
```

## Security Considerations
- XSS prevention through proper DOM manipulation
- Input sanitization for note content
- No external script loading
- Content Security Policy compatible

## Performance Optimizations
- Debounced search and auto-save
- Virtual scrolling for large note lists
- Lazy loading of note content
- CSS animations over JavaScript
- Event delegation for better memory usage

## Browser Support
- **Target**: Modern browsers (ES6+ support)
- **Minimum**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Graceful degradation**: Basic functionality in older browsers

## File Organization
```
/
├── index.html              # Application entry point
├── css/
│   ├── styles.css          # Global styles and layout
│   └── components.css      # Component-specific styles
├── js/
│   ├── app.js              # Main application controller
│   ├── storage.js          # Data persistence layer
│   ├── utils.js            # Utility functions
│   └── components/
│       ├── notesList.js    # Notes sidebar component
│       └── noteEditor.js   # Note editing component
├── assets/
│   └── icons/              # SVG icons and images
└── tests/
    ├── unit/               # Unit tests
    └── integration/        # Integration tests
```

## API Design (Internal)

### Storage API
```javascript
Storage.saveNote(note)
Storage.deleteNote(id)
Storage.getAllNotes()
Storage.searchNotes(query)
Storage.exportData()
Storage.importData(data)
```

### Component API
```javascript
NotesList.render(notes, activeId)
NotesList.filter(query)
NoteEditor.loadNote(note)
NoteEditor.saveNote()
NoteEditor.clear()
```

## Future Enhancements (Post-MVP)
- Rich text formatting (bold, italic, lists)
- Note categorization with tags
- Export to various formats (markdown, PDF)
- Keyboard shortcuts
- Dark mode theme
- Note templates
- Collaborative editing (with backend)

## Testing Strategy
- Unit tests for utility functions
- Component testing for UI interactions
- Integration tests for storage operations
- Manual testing across browsers
- Performance testing with large datasets

## Deployment
- Static file hosting (no build process required)
- Can be served from any web server
- Works with file:// protocol for local usage
- Progressive Web App (PWA) ready

## Error Handling
- Graceful degradation for storage failures
- User-friendly error messages
- Automatic data recovery attempts
- Fallback to in-memory storage if needed

## Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support