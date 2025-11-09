/**
 * Theme Manager - Handles application theming
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = [
            { id: 'light', name: 'Light', icon: '☀️' },
            { id: 'dark', name: 'Dark', icon: '🌙' },
            { id: 'sepia', name: 'Sepia', icon: '📜' },
            { id: 'high-contrast', name: 'High Contrast', icon: '⚫' },
            { id: 'blue', name: 'Blue', icon: '🔵' },
            { id: 'green', name: 'Green', icon: '🟢' },
        ];
        this.systemPreference = null;
    }

    init() {
        // Detect system color scheme preference
        this.detectSystemPreference();

        // Load saved theme or use system preference
        this.loadSavedTheme();

        // Set up system preference change listener
        this.setupSystemPreferenceListener();

        // Apply initial theme
        this.applyTheme(this.currentTheme);

        console.log('Theme manager initialized with theme:', this.currentTheme);
    }

    detectSystemPreference() {
        if (window.matchMedia) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            this.systemPreference = prefersDark.matches ? 'dark' : 'light';
        } else {
            this.systemPreference = 'light';
        }
    }

    setupSystemPreferenceListener() {
        if (window.matchMedia) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            prefersDark.addEventListener('change', (e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';

                // If user hasn't set a specific theme, follow system preference
                const savedTheme = window.storage?.getSetting('theme');
                if (!savedTheme || savedTheme === 'auto') {
                    this.setTheme(this.systemPreference);
                }
            });
        }
    }

    loadSavedTheme() {
        try {
            const savedTheme = window.storage?.getSetting('theme', 'auto');

            if (savedTheme === 'auto') {
                this.currentTheme = this.systemPreference || 'light';
            } else if (this.isValidTheme(savedTheme)) {
                this.currentTheme = savedTheme;
            } else {
                this.currentTheme = 'light';
            }
        } catch (error) {
            console.warn('Failed to load saved theme:', error);
            this.currentTheme = this.systemPreference || 'light';
        }
    }

    saveTheme(themeId) {
        try {
            if (window.storage) {
                window.storage.setSetting('theme', themeId);
            }
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    isValidTheme(themeId) {
        return this.themes.some(theme => theme.id === themeId);
    }

    setTheme(themeId) {
        if (!this.isValidTheme(themeId) && themeId !== 'auto') {
            console.warn('Invalid theme ID:', themeId);
            return false;
        }

        if (themeId === 'auto') {
            this.currentTheme = this.systemPreference || 'light';
        } else {
            this.currentTheme = themeId;
        }

        this.applyTheme(this.currentTheme);
        this.saveTheme(themeId);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));

        return true;
    }

    applyTheme(themeId) {
        const root = document.documentElement;

        // Remove all theme data attributes
        this.themes.forEach(theme => {
            root.removeAttribute(`data-theme`);
        });

        // Apply new theme
        if (themeId !== 'light') {
            root.setAttribute('data-theme', themeId);
        }

        // Update Quill editor theme if it exists
        this.updateEditorTheme(themeId);

        console.log('Applied theme:', themeId);
    }

    updateEditorTheme(themeId) {
        // Update Quill editor styling for different themes
        const editor = document.querySelector('.ql-editor');
        if (editor) {
            // Force re-render of editor styles
            editor.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
        }

        const toolbar = document.querySelector('.ql-toolbar');
        if (toolbar) {
            // Update toolbar styling
            toolbar.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return [...this.themes];
    }

    getThemeInfo(themeId) {
        return this.themes.find(theme => theme.id === themeId) || null;
    }

    cycleTheme() {
        const currentIndex = this.themes.findIndex(theme => theme.id === this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];

        this.setTheme(nextTheme.id);
        return nextTheme;
    }

    toggleDarkMode() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }

    // Get computed CSS variable values for current theme
    getThemeVariable(variableName) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(`--${variableName}`)
            .trim();
    }

    // Get theme-aware color for dynamic elements
    getThemeColor(colorName) {
        const colorMap = {
            primary: this.getThemeVariable('primary-color'),
            secondary: this.getThemeVariable('secondary-color'),
            accent: this.getThemeVariable('accent-color'),
            textPrimary: this.getThemeVariable('text-primary'),
            textSecondary: this.getThemeVariable('text-secondary'),
            backgroundPrimary: this.getThemeVariable('background-primary'),
            backgroundSecondary: this.getThemeVariable('background-secondary'),
            border: this.getThemeVariable('border-color')
        };

        return colorMap[colorName] || null;
    }

    // Check if current theme is dark
    isDarkTheme() {
        return this.currentTheme === 'dark' ||
               (this.currentTheme === 'high-contrast' && this.systemPreference === 'dark');
    }

    // Export theme as CSS custom properties
    exportThemeCSS() {
        const root = getComputedStyle(document.documentElement);
        const variables = [
            'primary-color', 'secondary-color', 'accent-color',
            'text-primary', 'text-secondary',
            'background-primary', 'background-secondary',
            'border-color', 'shadow-light', 'shadow-medium'
        ];

        let css = ':root {\n';
        variables.forEach(variable => {
            const value = root.getPropertyValue(`--${variable}`).trim();
            if (value) {
                css += `  --${variable}: ${value};\n`;
            }
        });
        css += '}';

        return css;
    }

    // Create theme preview
    createThemePreview(themeId) {
        const theme = this.getThemeInfo(themeId);
        if (!theme) return null;

        const preview = document.createElement('div');
        preview.className = 'theme-preview';
        preview.setAttribute('data-theme', themeId);

        preview.innerHTML = `
            <div class="theme-preview-content">
                <div class="theme-preview-header">
                    <span class="theme-preview-icon">${theme.icon}</span>
                    <span class="theme-preview-name">${theme.name}</span>
                </div>
                <div class="theme-preview-sample">
                    <div class="sample-text-primary">Primary Text</div>
                    <div class="sample-text-secondary">Secondary Text</div>
                    <div class="sample-button">Button</div>
                </div>
            </div>
        `;

        return preview;
    }
}

// Global theme manager instance
window.themeManager = new ThemeManager();