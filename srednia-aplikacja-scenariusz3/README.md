# NoteNest 📝

A clean, minimalist local note-taking web application that stores all your notes securely in your browser.

![NoteNest Preview](assets/preview.png)

## ✨ Features

- **📝 Create & Edit Notes**: Rich note creation with titles, content, and tags
- **🏷️ Tag Management**: Organize notes with tags and filter by multiple tags
- **🔍 Real-time Search**: Search across note titles, content, and tags instantly
- **💾 Local Storage**: All data stays in your browser - completely private
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🎨 Beautiful UI**: Clean orange and gray theme with smooth animations
- **⚡ Fast Performance**: Instant loading with no external dependencies

## 🚀 Quick Start

1. **Download or Clone**: Get the NoteNest files to your computer
2. **Open**: Double-click `index.html` or open it in your browser
3. **Start Writing**: Click "+ New Note" to create your first note!

No installation, no setup, no internet required!

## 📖 How to Use

### Creating Your First Note

1. Click the **"+ New Note"** button in the header
2. Add a **title** for your note
3. Write your **content** in the text area
4. Add **tags** (optional) separated by commas (e.g., `work, ideas, important`)
5. Click **"Save Note"**

### Managing Notes

- **Edit**: Click on any note card to edit it
- **Delete**: In the note editor, there's a delete option
- **Search**: Use the search box to find notes by title, content, or tags
- **Filter by Tags**: Click on tag buttons in the sidebar to filter notes

### Organization Tips

- Use **tags** to categorize your notes (e.g., `work`, `personal`, `ideas`)
- **Search** works instantly as you type
- **Combine** search and tag filters for precise note finding
- Notes are automatically sorted by last modified date

## 🎯 Use Cases

- **Daily Journaling**: Keep a personal diary
- **Work Notes**: Meeting notes, project ideas, todos
- **Research**: Collect and organize information
- **Creative Writing**: Story ideas, character notes, plot outlines
- **Study Notes**: Course notes, reference materials
- **Quick Thoughts**: Capture ideas on the go

## 🔧 Technical Details

### Technology Stack
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with Flexbox/Grid
- **Vanilla JavaScript**: No frameworks, pure performance
- **localStorage**: Client-side data persistence

### Browser Compatibility
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Data Storage
- All notes are stored locally in your browser
- Data persists between sessions
- No data is sent to any server
- Export/backup via browser tools if needed

## 🎨 Design Guidelines

NoteNest follows a clean, minimalist design:
- **Primary Color**: Orange (#E97900) for actions and highlights
- **Secondary Color**: Light Gray (#ECEFF1) for the sidebar
- **Layout**: Single-column design for focused writing
- **Typography**: System fonts for optimal readability

## 📱 Responsive Features

- **Desktop**: Full sidebar with tag filters and search
- **Tablet**: Optimized layout for touch interaction
- **Mobile**: Stacked layout with sidebar below content

## ⚡ Performance

- **Instant Loading**: No external dependencies
- **Fast Search**: Real-time search with no delay
- **Smooth Animations**: CSS-only animations for better performance
- **Efficient Storage**: Optimized JSON data structure

## 🔒 Privacy & Security

- **100% Local**: All data stays on your device
- **No Tracking**: No analytics or external requests
- **Secure**: XSS protection and input sanitization
- **Private**: Only you have access to your notes

## 💡 Tips & Shortcuts

- **Quick Save**: Use `Ctrl+S` (or `Cmd+S` on Mac) in the note editor
- **Close Modal**: Press `Escape` key to close the note editor
- **Focus Search**: Click the search box and start typing
- **Tag Filtering**: Click multiple tags to filter with AND logic
- **Clear Filters**: Use the "Clear Filters" button to reset

## 🤝 Contributing

NoteNest is a complete local application. To contribute:

1. Fork or download the project
2. Make your improvements
3. Test thoroughly across browsers
4. Ensure responsive design works
5. Submit your changes

## 📄 File Structure

```
NoteNest/
├── index.html          # Main application
├── css/
│   └── styles.css      # All styling
├── js/
│   ├── app.js          # Main application logic
│   ├── storage.js      # localStorage management
│   └── ui.js           # DOM manipulation & events
├── assets/             # Images and icons
└── README.md           # This file
```

## 🆘 Troubleshooting

### Notes Not Saving?
- Check if localStorage is enabled in your browser
- Try refreshing the page
- Ensure you have storage space available

### Performance Issues?
- Clear old browser data
- Try in an incognito/private window
- Check browser console for errors

### Layout Problems?
- Ensure you're using a modern browser
- Try zooming to 100%
- Check responsive mode on mobile

## 📋 Version History

- **v1.0.0**: Initial release with core functionality
  - Note creation, editing, deletion
  - Tag management and filtering
  - Real-time search
  - Responsive design
  - Local storage persistence

## 🙏 Acknowledgments

Built as part of a multi-agent development workflow demonstrating:
- Modern web development practices
- Local-first application design
- Clean, maintainable code architecture
- Comprehensive testing and validation

---

**Start taking notes today! 📝 Open `index.html` and begin writing.**