# NoteNest Technical Architecture

## System Overview
NoteNest is a local-first web application built with vanilla JavaScript, designed to work offline with optional online features for AI summarization.

## Architecture Principles
- **Local-First**: All core functionality works offline
- **Progressive Enhancement**: Online features enhance but don't replace core functionality
- **Modular Design**: Clear separation of concerns across modules
- **Data Portability**: Easy export/import of user data

## Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern CSS with custom properties for theming
- **JavaScript ES6+**: Modular vanilla JavaScript architecture
- **IndexedDB**: Primary client-side database
- **LocalStorage**: Configuration and temporary data

### External Libraries (CDN)
- **Quill.js**: Rich text editor
- **Tesseract.js**: Client-side OCR
- **jsPDF**: PDF generation
- **Mermaid.js**: Diagram rendering

### Optional Online Services
- **OpenAI API**: Note summarization
- **Email JS**: Email functionality

## Data Architecture

### Database Schema (IndexedDB)

#### Users Store
```javascript
{
  id: string (UUID),
  username: string,
  email: string,
  passwordHash: string,
  settings: {
    theme: string,
    defaultNotebook: string,
    autoSave: boolean
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Notes Store
```javascript
{
  id: string (UUID),
  userId: string,
  notebookId: string,
  title: string,
  content: string (HTML/rich text),
  tags: string[],
  attachments: string[], // File IDs
  metadata: {
    created: timestamp,
    modified: timestamp,
    accessed: timestamp,
    wordCount: number,
    readingTime: number
  },
  searchIndex: string // Processed content for search
}
```

#### Notebooks Store
```javascript
{
  id: string (UUID),
  userId: string,
  name: string,
  description: string,
  color: string,
  isDefault: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Attachments Store
```javascript
{
  id: string (UUID),
  noteId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  blob: Blob,
  ocrText: string, // Extracted text
  createdAt: timestamp
}
```

## Module Structure

### Core Modules
- `core/database.js`: IndexedDB wrapper and data access layer
- `core/auth.js`: User authentication and session management
- `core/storage.js`: Data persistence and synchronization

### Feature Modules
- `features/notes.js`: Note CRUD operations and rich text handling
- `features/notebooks.js`: Notebook management and organization
- `features/search.js`: Full-text search and indexing
- `features/export.js`: Export functionality (PDF, Markdown, Email)
- `features/ai.js`: OpenAI integration for summarization
- `features/ocr.js`: OCR processing for attachments

### UI Modules
- `ui/components.js`: Reusable UI components
- `ui/editor.js`: Rich text editor integration
- `ui/views.js`: Application views and routing
- `ui/themes.js`: Theme management and customization

## Security Considerations

### Authentication
- Client-side password hashing using Web Crypto API
- Session management with secure tokens
- Protection against XSS and injection attacks

### Data Protection
- Local data encryption for sensitive content
- Secure attachment handling
- Privacy-first design (no telemetry)

## Performance Optimization

### Loading Strategy
- Lazy loading of non-critical modules
- Progressive loading of note content
- Efficient IndexedDB queries with indexes

### Memory Management
- Efficient DOM manipulation
- Proper cleanup of event listeners
- Optimized search indexing

### Storage Optimization
- Compression for large notes
- Efficient attachment storage
- Data pruning and cleanup utilities

## Scalability Considerations

### Large Note Collections
- Pagination for note lists
- Incremental search indexing
- Background processing for heavy operations

### Performance Monitoring
- Client-side performance metrics
- Storage usage monitoring
- Error tracking and logging

## Browser Compatibility
- **Primary Targets**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Fallbacks**: Graceful degradation for older browsers
- **Feature Detection**: Progressive enhancement based on capabilities

## Development Workflow
- **Agent 1 (Architect)**: Designs and documents system architecture
- **Agent 2 (Builder)**: Implements features based on architectural specifications
- **Collaborative Reviews**: Regular architecture and code reviews
- **Testing Strategy**: Unit tests for core modules, integration tests for features

## Future Extensibility
- Plugin architecture for custom features
- API design for potential backend integration
- Export formats for data migration
- Theme system for customization