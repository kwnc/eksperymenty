# NoteNest Setup and Deployment Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Configuration Options](#configuration-options)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Setup](#advanced-setup)

## Quick Start

### For End Users
The fastest way to start using NoteNest:

1. **Download the Application**
   ```bash
   # Option 1: Clone from repository
   git clone <repository-url> notenest

   # Option 2: Download ZIP file
   # Extract to desired location
   ```

2. **Open the Application**
   - Navigate to the `notenest` folder
   - Double-click `index.html` or right-click and "Open with" your preferred browser
   - **Alternative**: Use File → Open in your browser and select `index.html`

3. **First Time Setup**
   - Create your first account using the registration form
   - Start creating notes immediately

**That's it!** NoteNest runs entirely in your browser with no additional setup required.

## Development Setup

### Prerequisites
- **Node.js**: Version 16 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Git**: For version control
- **Modern Web Browser**: Chrome 60+, Firefox 55+, Safari 12+, or Edge 79+

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url> notenest-dev
   cd notenest-dev
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Installation**
   ```bash
   # Run tests to ensure everything works
   npm test

   # Check for any linting issues
   npm run lint
   ```

4. **Start Development**
   ```bash
   # Open index.html in your browser
   # Or use a local development server:
   npx http-server . -p 8000
   ```

### Development Tools

#### Available npm Scripts
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type checking (if TypeScript is added)
npm run type-check

# Build production version
npm run build
```

#### IDE/Editor Setup

**Visual Studio Code Extensions** (Recommended):
- ES6 String HTML
- Live Server
- Prettier - Code formatter
- ESLint
- HTML CSS Support
- Auto Rename Tag

**Settings for VS Code** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "html.format.indentInnerHtml": true,
  "css.validate": true,
  "javascript.validate.enable": true
}
```

## Production Deployment

### Static Web Hosting
NoteNest is a client-side application that can be deployed on any static web hosting service.

#### Popular Hosting Options

**1. GitHub Pages**
```bash
# Enable GitHub Pages in repository settings
# Point to main branch or docs folder
# Access via: https://username.github.io/repository-name/
```

**2. Netlify**
```bash
# Connect GitHub repository to Netlify
# Build command: (none needed)
# Publish directory: / (root)
# Deploy automatically on push
```

**3. Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# Follow prompts for configuration
```

**4. Traditional Web Server**
```bash
# Copy all files to web server document root
# Ensure proper file permissions (644 for files, 755 for directories)
# Configure web server for proper MIME types
```

### Server Configuration

#### Apache Configuration (`.htaccess`)
```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
</IfModule>
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/notenest;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript text/xml application/xml;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";

    # Cache static assets
    location ~* \.(css|js|png|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Production Build Process

1. **Prepare Files**
   ```bash
   # Ensure all tests pass
   npm test

   # Run linting
   npm run lint

   # Create production build (if build script available)
   npm run build
   ```

2. **Optimize Assets**
   ```bash
   # Minify CSS (optional)
   npm install -g csso-cli
   csso assets/css/main.css -o assets/css/main.min.css

   # Minify JavaScript (optional)
   npm install -g terser
   terser assets/js/app.js -o assets/js/app.min.js
   ```

3. **Upload to Server**
   ```bash
   # Using rsync
   rsync -avz --delete ./ user@server:/path/to/webroot/

   # Using FTP/SFTP
   # Upload all files maintaining directory structure
   ```

## Configuration Options

### Environment Configuration
Create a `config.js` file for environment-specific settings:

```javascript
// config.js
const CONFIG = {
  // Application settings
  APP_NAME: 'NoteNest',
  VERSION: '1.0.0',

  // Storage configuration
  STORAGE: {
    MAX_NOTES: 10000,
    MAX_NOTE_SIZE: 1048576, // 1MB
    AUTO_SAVE_INTERVAL: 5000, // 5 seconds
    CLEANUP_INTERVAL: 86400000 // 24 hours
  },

  // Security settings
  SECURITY: {
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT: 86400000, // 24 hours
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900000 // 15 minutes
  },

  // Feature flags
  FEATURES: {
    DARK_MODE: true,
    EXPORT_PDF: true,
    IMPORT_FILES: true,
    RICH_TEXT_EDITOR: true,
    TAG_SYSTEM: true
  },

  // UI configuration
  UI: {
    THEME: 'auto', // 'light', 'dark', 'auto'
    SIDEBAR_WIDTH: 280,
    EDITOR_FONT_SIZE: 14,
    MAX_RECENT_NOTES: 10
  }
};

// Make config available globally
window.CONFIG = CONFIG;
```

### Customization Options

#### Themes
Modify `assets/css/themes.css` to customize appearance:
```css
/* Custom theme variables */
:root {
  --primary-color: #E97900; /* Orange theme */
  --secondary-color: #F0F0F0;
  --background-color: #FFFFFF;
  --text-color: #333333;
  --border-color: #DDDDDD;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --background-color: #1A1A1A;
  --text-color: #FFFFFF;
  --border-color: #444444;
}
```

#### Feature Configuration
Enable/disable features by modifying the configuration:
```javascript
// Disable PDF export
CONFIG.FEATURES.EXPORT_PDF = false;

// Disable rich text editor (plain text only)
CONFIG.FEATURES.RICH_TEXT_EDITOR = false;

// Customize auto-save interval
CONFIG.STORAGE.AUTO_SAVE_INTERVAL = 10000; // 10 seconds
```

## Troubleshooting

### Common Issues

#### Installation Problems

**Issue**: `npm install` fails with permission errors
**Solution**:
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm to manage Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
nvm use node
```

**Issue**: Tests fail with "Cannot find module" errors
**Solution**:
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Browser Issues

**Issue**: Application doesn't load in browser
**Solutions**:
- Ensure JavaScript is enabled
- Check browser console for errors
- Try different browser
- Clear browser cache
- Disable browser extensions

**Issue**: Storage quota exceeded
**Solutions**:
- Clear browser storage: Developer Tools → Application → Storage
- Export notes before clearing storage
- Increase browser storage limit (if available)
- Use Incognito/Private browsing for testing

#### Performance Issues

**Issue**: Slow loading with many notes
**Solutions**:
- Implement pagination in note list
- Clear old/unused notes
- Check browser memory usage
- Restart browser

**Issue**: Auto-save conflicts
**Solutions**:
- Increase auto-save interval
- Check for multiple browser tabs
- Verify storage permissions

### Debugging

#### Browser Developer Tools
1. **Console Tab**: Check for JavaScript errors
2. **Network Tab**: Monitor resource loading
3. **Application Tab**: Inspect localStorage/IndexedDB
4. **Performance Tab**: Analyze performance bottlenecks

#### Common Debug Commands
```javascript
// Check storage usage
console.log(navigator.storage.estimate());

// List all stored data
console.log(localStorage);

// Check current user
console.log(window.app?.authManager?.getCurrentUser());

// Verify note count
console.log(window.app?.notesManager?.getNotes().length);
```

## Advanced Setup

### Custom Domain Configuration
1. Purchase domain name
2. Configure DNS records to point to hosting service
3. Set up SSL certificate (Let's Encrypt recommended)
4. Update any hardcoded URLs in configuration

### CDN Integration
For better performance with global users:
```html
<!-- Add CDN for static assets -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
```

### Analytics Integration (Optional)
```html
<!-- Add before closing </head> tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID', {
    anonymize_ip: true,
    allow_google_signals: false
  });
</script>
```

### Automated Deployment
Create GitHub Action for automated deployment:
```yaml
# .github/workflows/deploy.yml
name: Deploy NoteNest
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

---

*Last updated: September 2024*
*NoteNest Setup Guide v1.0.0*