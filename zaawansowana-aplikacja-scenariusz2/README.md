# NoteNest - Local Note Taking Application

A powerful, local-first note-taking application built with vanilla JavaScript that works entirely offline with optional AI-powered features.

## Features

### Core Features
- **Rich Text Editing**: Create and edit notes with full text formatting
- **Notebook Organization**: Group notes into customizable notebooks
- **Search & Tagging**: Full-text search with tag-based organization
- **User Authentication**: Secure local user management
- **Export Options**: PDF export and email sharing

### Advanced Features
- **AI Summarization**: OpenAI-powered note summarization (requires internet)
- **OCR Support**: Local text extraction from images and PDFs
- **Markdown Support**: Import/export Markdown with metadata
- **Multiple Themes**: Light, dark, sepia, and high-contrast themes
- **Code Highlighting**: Syntax highlighting for code blocks
- **Diagram Support**: Mermaid.js integration for flowcharts and diagrams

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: IndexedDB for local data persistence
- **Rich Text**: Quill.js editor
- **OCR**: Tesseract.js for client-side text recognition
- **PDF Generation**: jsPDF for document export
- **Diagrams**: Mermaid.js for diagram rendering

## Project Structure

```
├── index.html              # Main application entry point
├── src/
│   ├── css/
│   │   ├── main.css        # Core styles and layout
│   │   └── themes.css      # Theme system and variations
│   ├── js/
│   │   ├── core/           # Core system modules
│   │   ├── features/       # Feature-specific modules
│   │   ├── ui/             # UI components and views
│   │   └── main.js         # Application bootstrap
│   └── assets/             # Static assets (icons, images)
├── docs/                   # Technical documentation
├── tests/                  # Test files
└── MULTI_AGENT_PLAN.md    # Development workflow plan
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notenest
   ```

2. **Open in browser**
   - Simply open `index.html` in a modern web browser
   - No build process or server required for basic functionality

3. **Optional: Serve locally**
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js
   npx serve .
   ```

## Development

### Multi-Agent Development Workflow

This project uses a two-agent development approach:

- **Agent 1 (Architect)**: System design, architecture planning, and documentation
- **Agent 2 (Builder)**: Feature implementation and core development

See [MULTI_AGENT_PLAN.md](MULTI_AGENT_PLAN.md) for detailed workflow information.

### Architecture

The application follows a modular architecture with clear separation of concerns:

- **Core Layer**: Database, authentication, and storage management
- **Feature Layer**: Note management, search, export, and AI integration
- **UI Layer**: Components, views, and user interface management

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed technical documentation.

### Database Schema

NoteNest uses IndexedDB with the following main entities:
- Users (authentication and preferences)
- Notebooks (note organization)
- Notes (content and metadata)
- Attachments (files and OCR data)
- Tags (categorization)

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete schema documentation.

## Browser Compatibility

**Supported Browsers:**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Required Browser Features:**
- IndexedDB
- Web Crypto API
- ES6+ JavaScript
- CSS Custom Properties

## Contributing

### Development Setup

1. Fork and clone the repository
2. Create a feature branch
3. Make your changes following the established patterns
4. Test in multiple browsers
5. Submit a pull request

### Code Style

- Use modern JavaScript (ES6+)
- Follow established naming conventions
- Maintain modular architecture
- Include JSDoc comments for public APIs
- Write semantic HTML and accessible CSS

## Security

- **Local-First**: All data stored locally by default
- **Secure Authentication**: Password hashing with Web Crypto API
- **Data Isolation**: User data completely separated
- **No Telemetry**: No data collection or external tracking

## License

MIT License - see LICENSE file for details

## Roadmap

### Phase 1: Foundation ✅
- [x] Project structure and architecture
- [x] Database schema design
- [x] Theme system implementation
- [ ] Core authentication system
- [ ] Basic note creation and editing

### Phase 2: Core Features
- [ ] Rich text editor integration
- [ ] Notebook management
- [ ] Search and tagging
- [ ] Export functionality

### Phase 3: Advanced Features
- [ ] AI summarization integration
- [ ] OCR for attachments
- [ ] Markdown import/export
- [ ] Calendar and Kanban views

### Phase 4: Polish & Optimization
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Cross-browser testing
- [ ] User documentation

## Support

For questions, issues, or feature requests, please open an issue on the project repository.

---

**NoteNest** - Organize your thoughts, locally and securely.