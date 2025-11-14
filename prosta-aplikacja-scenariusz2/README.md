# SimpleNote Local - MVP Note-Taking Application

A lightweight, privacy-focused note-taking application that stores all your notes locally in your browser. No server, no tracking, just your notes.

## Features

- **Create Notes**: Simple text-based notes with titles and content
- **Edit Notes**: Click any note to edit it
- **Delete Notes**: Remove notes you no longer need
- **Search Notes**: Find notes by searching title or content
- **Auto-Save**: Your notes are automatically saved as you type
- **100% Local**: All data stored in your browser's LocalStorage
- **No Internet Required**: Works completely offline
- **Private**: No data sent to any server

## Quick Start

1. Open `index.html` in any modern web browser
2. Start creating notes!

No installation, no build process, no dependencies required.

## Usage

### Creating a Note
1. Click the "+ New Note" button
2. Enter a title and content
3. Click "Save" or let auto-save do it for you

### Editing a Note
1. Click on any note in the sidebar
2. Make your changes
3. Changes are automatically saved

### Deleting a Note
1. Open the note you want to delete
2. Click the "Delete" button
3. Confirm deletion

### Searching Notes
1. Type in the search box at the top
2. Notes are filtered in real-time
3. Search works on both title and content

## Technical Details

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Storage**: Browser LocalStorage API
- **UI**: Custom CSS with responsive design
- **No Dependencies**: Pure HTML, CSS, and JavaScript

### Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Any modern browser with LocalStorage support

### Storage Limits
- LocalStorage typically provides 5-10MB of storage
- This is sufficient for thousands of text notes
- For reference: 5MB can store approximately 2,500,000 characters

### Data Structure
Notes are stored as JSON objects with the following structure:
```javascript
{
  id: "unique_identifier",
  title: "Note Title",
  content: "Note content...",
  createdAt: 1699814400000,  // Unix timestamp
  updatedAt: 1699814400000,  // Unix timestamp
  tags: []                   // Reserved for future use
}
```

## File Structure

```
prosta-aplikacja-scenariusz2/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Application styles
├── js/
│   ├── app.js              # Main application logic
│   ├── storage.js          # LocalStorage management
│   ├── ui.js               # UI rendering and interactions
│   └── utils.js            # Utility functions
├── CLAUDE.md               # Development instructions
├── MULTI_AGENT_PLAN.md     # Development plan
└── README.md               # This file
```

## Privacy & Security

- **No Tracking**: This application does not track you in any way
- **No Network Requests**: All functionality works offline
- **Local-Only Storage**: Your notes never leave your device
- **XSS Protection**: HTML is properly escaped to prevent injection attacks

## Limitations

- Notes are stored per browser (not synced across devices)
- Clearing browser data will delete your notes
- No export/import functionality (yet)
- No markdown formatting (yet)
- No attachments or images (yet)

## Backup Your Notes

To backup your notes:
1. Open browser DevTools (F12)
2. Go to Console
3. Run: `console.log(localStorage.getItem('simplenote_notes'))`
4. Copy the output and save to a text file

To restore:
1. Open browser DevTools (F12)
2. Go to Console
3. Run: `localStorage.setItem('simplenote_notes', 'YOUR_BACKUP_DATA')`
4. Refresh the page

## Development Status

This is an MVP (Minimum Viable Product) created using a multi-agent development approach.

Current Status: **Phase 1 Complete - Architecture & Setup**

See `MULTI_AGENT_PLAN.md` for detailed development roadmap.

## Future Enhancements

Planned features for future versions:
- Markdown support
- Export/Import functionality (JSON, TXT, MD)
- Categories and tags
- Dark mode
- Rich text formatting
- Keyboard shortcuts
- Note templates
- IndexedDB migration for larger storage

## License

This is a demonstration project created for educational purposes.

## Contributing

This project follows a multi-agent development workflow. See `CLAUDE.md` and `MULTI_AGENT_PLAN.md` for contribution guidelines.

## Support

For issues or questions, please refer to the project documentation in `MULTI_AGENT_PLAN.md`.

---

**Version**: 1.0.0-alpha
**Last Updated**: 2025-11-12
**Status**: In Development
