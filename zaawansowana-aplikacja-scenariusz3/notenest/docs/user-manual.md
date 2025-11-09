# NoteNest User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Authentication](#user-authentication)
3. [Creating and Managing Notes](#creating-and-managing-notes)
4. [Organizing with Notebooks](#organizing-with-notebooks)
5. [Search and Tags](#search-and-tags)
6. [Export and Import](#export-and-import)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### What is NoteNest?
NoteNest is a local-first note-taking application that runs entirely in your web browser. Your data is stored locally on your device, ensuring privacy and offline functionality.

### System Requirements
- **Web Browser**: Chrome 60+, Firefox 55+, Safari 12+, or Edge 79+
- **Storage**: Minimum 50MB free disk space for local data
- **JavaScript**: Must be enabled in your browser

### First Time Setup
1. Download or clone the NoteNest application files
2. Open `index.html` in your web browser
3. You'll be presented with the authentication screen
4. Create your first account by clicking "Register"

## User Authentication

### Creating an Account
1. Click "Register" on the welcome screen
2. Fill in the required information:
   - **Full Name**: Your display name
   - **Email**: Will be used as your username
   - **Password**: Must be at least 8 characters long
3. Click "Register" to create your account

### Logging In
1. Enter your email and password
2. Click "Login"
3. You'll be taken to your personal dashboard

### Password Security
- Your password is encrypted and stored locally
- No data is sent to external servers
- If you forget your password, you'll need to reset your local data

## Creating and Managing Notes

### Creating a New Note
1. Click the "New Note" button (+ icon) in the sidebar
2. Enter a title for your note
3. Start typing in the content area
4. Your note is automatically saved as you type

### Editing Notes
- **Rich Text**: Use the formatting toolbar for bold, italic, lists, etc.
- **Auto-save**: Changes are saved automatically every few seconds
- **Manual Save**: Press Ctrl+S (Cmd+S on Mac) to force save

### Note Features
- **Rich text formatting** with toolbar options
- **Automatic timestamps** for creation and modification
- **Tag support** for organization
- **Full-text search** within note content

### Deleting Notes
1. Open the note you want to delete
2. Click the trash icon in the note toolbar
3. Confirm the deletion in the popup dialog
4. **Note**: Deleted notes cannot be recovered

## Organizing with Notebooks

### Creating Notebooks
1. Right-click in the sidebar or click the "New Notebook" button
2. Enter a name for your notebook
3. Choose a color theme (optional)
4. Click "Create"

### Managing Notebooks
- **Rename**: Right-click on notebook name and select "Rename"
- **Delete**: Right-click and select "Delete" (notes will be moved to "Uncategorized")
- **Color coding**: Click the color dot next to notebook name to change color

### Moving Notes Between Notebooks
1. Select the note you want to move
2. Right-click and choose "Move to Notebook"
3. Select the destination notebook from the list

## Search and Tags

### Searching Notes
1. Use the search bar at the top of the application
2. Search terms will match:
   - Note titles
   - Note content
   - Tags
3. Results are highlighted and filtered in real-time

### Using Tags
1. Add tags to notes using the hashtag format: `#important #work`
2. Tags appear as clickable elements in your notes
3. Click on any tag to filter notes by that tag
4. Use the tag sidebar to see all available tags

### Advanced Search
- Use quotes for exact phrases: `"exact phrase"`
- Combine multiple terms: `project AND deadline`
- Search within specific notebooks using the notebook filter

## Export and Import

### Exporting Notes
1. Select the notes you want to export
2. Click "Export" in the toolbar
3. Choose your format:
   - **PDF**: For printing or sharing
   - **Markdown**: For use with other editors
   - **HTML**: For web publishing

### Export Options
- **Single Note**: Export just the current note
- **Multiple Notes**: Select multiple notes and export as a batch
- **Entire Notebook**: Export all notes from a notebook
- **All Notes**: Export your complete note collection

### Importing Notes
1. Click "Import" in the main menu
2. Select supported file formats:
   - Markdown files (.md)
   - Text files (.txt)
   - HTML files (.html)
3. Choose import destination notebook
4. Review imported notes and organize as needed

## Customization

### Theme Options
- **Light Mode**: Default bright theme
- **Dark Mode**: Eye-friendly dark theme
- **System**: Automatically matches your system theme

### Changing Themes
1. Click the theme toggle button in the header (sun/moon icon)
2. Or use the keyboard shortcut: Ctrl+Shift+T (Cmd+Shift+T on Mac)

### Editor Preferences
Access preferences through the user menu:
- **Font Size**: Adjust text size for readability
- **Line Height**: Change spacing between lines
- **Auto-save Interval**: Set how often notes are saved automatically

### Keyboard Shortcuts
- **New Note**: Ctrl+N (Cmd+N on Mac)
- **Save Note**: Ctrl+S (Cmd+S on Mac)
- **Search**: Ctrl+F (Cmd+F on Mac)
- **Toggle Theme**: Ctrl+Shift+T (Cmd+Shift+T on Mac)
- **Bold Text**: Ctrl+B (Cmd+B on Mac)
- **Italic Text**: Ctrl+I (Cmd+I on Mac)

## Troubleshooting

### Common Issues

#### "My notes disappeared!"
- Check if you're logged into the correct account
- Look in the "Uncategorized" notebook
- Use the search function to find notes by content

#### "The application won't load"
- Ensure JavaScript is enabled in your browser
- Clear browser cache and reload
- Check browser console for error messages

#### "Can't save notes"
- Check available storage space in your browser
- Try closing other browser tabs
- Clear browser data if storage is full

#### "Export/Import not working"
- Ensure your browser supports file downloads
- Check popup blockers aren't interfering
- Try using a different browser

### Performance Tips
- **Regular Cleanup**: Delete old notes you no longer need
- **Organize Notes**: Use notebooks to keep things organized
- **Limit Large Files**: Avoid very large images or attachments
- **Browser Maintenance**: Clear cache regularly

### Data Backup
Since NoteNest stores data locally:
1. Regularly export your notes
2. Save exported files to cloud storage or external drive
3. Consider using browser sync if available
4. Test restore process periodically

### Getting Help
- Check the [Technical Documentation](technical-documentation.md) for advanced topics
- Review the [Setup Guide](setup-guide.md) for installation issues
- Consult browser documentation for storage-related problems

## Advanced Features

### Offline Usage
- NoteNest works completely offline
- All features are available without internet connection
- Data syncs only within the same browser profile

### Browser Compatibility
- **Chrome/Chromium**: Full feature support
- **Firefox**: Full feature support
- **Safari**: Full feature support (macOS/iOS)
- **Edge**: Full feature support

### Storage Limits
- Typical browser storage limit: 5-50MB
- Monitor usage through browser developer tools
- Export and delete old notes if approaching limits

---

*Last updated: September 2024*
*NoteNest version: 1.0.0*