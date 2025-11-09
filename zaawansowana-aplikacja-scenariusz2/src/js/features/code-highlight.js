/**
 * Code Highlighting Module - Handles syntax highlighting and Mermaid diagrams
 * Phase 3 Implementation using Prism.js and Mermaid.js
 */

class CodeHighlightManager {
    constructor() {
        this.isInitialized = false;
        this.supportedLanguages = [
            'javascript', 'python', 'java', 'css', 'html', 'sql', 'json',
            'bash', 'shell', 'php', 'ruby', 'go', 'rust', 'cpp', 'c',
            'typescript', 'jsx', 'tsx', 'markdown', 'yaml', 'xml'
        ];
        this.mermaidConfig = {
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'strict',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        };
    }

    async init() {
        try {
            // Initialize Prism.js
            if (typeof Prism === 'undefined') {
                console.warn('Prism.js library not loaded');
                return false;
            }

            // Initialize Mermaid
            if (typeof mermaid !== 'undefined') {
                mermaid.initialize(this.mermaidConfig);
                console.log('Mermaid initialized');
            } else {
                console.warn('Mermaid library not loaded');
            }

            this.isInitialized = true;
            console.log('Code highlighting manager initialized');
            return true;

        } catch (error) {
            console.error('Failed to initialize code highlighting:', error);
            this.isInitialized = false;
            return false;
        }
    }

    // Highlight all code blocks in the document
    highlightAll() {
        if (!this.isInitialized) {
            this.init();
        }

        try {
            // Highlight code blocks with Prism.js
            if (typeof Prism !== 'undefined' && Prism.highlightAll) {
                Prism.highlightAll();
            }

            // Process Mermaid diagrams
            this.processMermaidDiagrams();

        } catch (error) {
            console.error('Error highlighting code:', error);
        }
    }

    // Highlight specific element
    highlightElement(element) {
        if (!this.isInitialized || !element) return;

        try {
            // Check if element contains code blocks
            const codeBlocks = element.querySelectorAll('pre code, code');

            codeBlocks.forEach(block => {
                if (typeof Prism !== 'undefined' && Prism.highlightElement) {
                    Prism.highlightElement(block);
                }
            });

            // Process Mermaid diagrams in this element
            this.processMermaidDiagrams(element);

        } catch (error) {
            console.error('Error highlighting element:', error);
        }
    }

    // Insert code block into editor
    insertCodeBlock(language = 'javascript', code = '') {
        const editor = window.editor?.quill;
        if (!editor) {
            console.warn('Editor not available');
            return;
        }

        try {
            const range = editor.getSelection(true);

            // Create code block HTML
            const codeHTML = `
                <pre class="language-${language}"><code class="language-${language}">${this.escapeHTML(code || `// Enter your ${language} code here`)}</code></pre>
            `;

            // Insert into editor
            editor.clipboard.dangerouslyPasteHTML(range.index, codeHTML);

            // Move cursor after the code block
            editor.setSelection(range.index + 1);

            // Highlight the newly inserted code
            setTimeout(() => {
                this.highlightAll();
            }, 100);

            return true;

        } catch (error) {
            console.error('Error inserting code block:', error);
            return false;
        }
    }

    // Insert Mermaid diagram
    insertMermaidDiagram(diagramType = 'flowchart') {
        const editor = window.editor?.quill;
        if (!editor) {
            console.warn('Editor not available');
            return;
        }

        try {
            const range = editor.getSelection(true);

            // Get template for diagram type
            const template = this.getMermaidTemplate(diagramType);

            // Create mermaid block HTML
            const mermaidHTML = `
                <div class="mermaid-container">
                    <pre class="mermaid">${template}</pre>
                </div>
            `;

            // Insert into editor
            editor.clipboard.dangerouslyPasteHTML(range.index, mermaidHTML);

            // Move cursor after the diagram
            editor.setSelection(range.index + 1);

            // Process the newly inserted diagram
            setTimeout(() => {
                this.processMermaidDiagrams();
            }, 100);

            return true;

        } catch (error) {
            console.error('Error inserting Mermaid diagram:', error);
            return false;
        }
    }

    // Get Mermaid template based on type
    getMermaidTemplate(type) {
        const templates = {
            'flowchart': `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,

            'sequence': `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>+B: Hello Bob, how are you?
    B-->>-A: Great!`,

            'gantt': `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1          :done,    des1, 2024-01-01,2024-01-15
    Task 2          :active,  des2, 2024-01-16, 3d
    section Phase 2
    Task 3          :         des3, after des2, 5d`,

            'pie': `pie title Sample Pie Chart
    "Desktop" : 45
    "Mobile" : 35
    "Tablet" : 20`,

            'mindmap': `mindmap
  root((Central Topic))
    Topic 1
      Subtopic A
      Subtopic B
    Topic 2
      Subtopic C
      Subtopic D`,

            'timeline': `timeline
    title Timeline Example
    2021 : Event 1
         : Event 2
    2022 : Event 3
         : Event 4
    2023 : Event 5`
        };

        return templates[type] || templates['flowchart'];
    }

    // Process Mermaid diagrams in container
    async processMermaidDiagrams(container = document) {
        if (typeof mermaid === 'undefined') {
            console.warn('Mermaid not available');
            return;
        }

        try {
            const mermaidElements = container.querySelectorAll('.mermaid');

            for (let i = 0; i < mermaidElements.length; i++) {
                const element = mermaidElements[i];

                // Skip if already processed
                if (element.getAttribute('data-processed') === 'true') {
                    continue;
                }

                // Get diagram text
                const diagramText = element.textContent || element.innerText;

                if (!diagramText.trim()) {
                    continue;
                }

                try {
                    // Generate unique ID
                    const diagramId = `mermaid-${Date.now()}-${i}`;

                    // Render diagram
                    const { svg } = await mermaid.render(diagramId, diagramText);

                    // Create wrapper
                    const wrapper = document.createElement('div');
                    wrapper.className = 'mermaid-diagram';
                    wrapper.innerHTML = svg;

                    // Add edit button
                    const editBtn = document.createElement('button');
                    editBtn.className = 'mermaid-edit-btn';
                    editBtn.innerHTML = '✏️ Edit';
                    editBtn.onclick = () => this.editMermaidDiagram(element, diagramText);

                    wrapper.appendChild(editBtn);

                    // Replace element
                    element.parentNode.replaceChild(wrapper, element);

                } catch (renderError) {
                    console.error('Error rendering Mermaid diagram:', renderError);

                    // Show error message
                    element.innerHTML = `
                        <div class="mermaid-error">
                            <strong>Mermaid Diagram Error:</strong>
                            <pre>${renderError.message}</pre>
                            <button onclick="this.parentNode.parentNode.innerHTML = '${this.escapeHTML(diagramText)}'">
                                Show Source
                            </button>
                        </div>
                    `;
                }

                element.setAttribute('data-processed', 'true');
            }

        } catch (error) {
            console.error('Error processing Mermaid diagrams:', error);
        }
    }

    // Edit Mermaid diagram
    editMermaidDiagram(originalElement, diagramText) {
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'mermaid-edit-modal modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Mermaid Diagram</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="mermaid-edit-text">Diagram Code:</label>
                        <textarea id="mermaid-edit-text" class="form-input" rows="10" style="font-family: monospace;">${diagramText}</textarea>
                    </div>
                    <div class="form-group">
                        <small class="text-secondary">
                            <a href="https://mermaid.js.org/syntax/" target="_blank">View Mermaid syntax documentation</a>
                        </small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-mermaid-edit" class="btn-secondary">Cancel</button>
                    <button id="preview-mermaid" class="btn-secondary">Preview</button>
                    <button id="save-mermaid-edit" class="btn-primary">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.querySelector('#cancel-mermaid-edit').onclick = () => modal.remove();

        modal.querySelector('#preview-mermaid').onclick = () => {
            const newText = modal.querySelector('#mermaid-edit-text').value;
            this.previewMermaidDiagram(newText);
        };

        modal.querySelector('#save-mermaid-edit').onclick = () => {
            const newText = modal.querySelector('#mermaid-edit-text').value;
            this.saveMermaidEdit(originalElement, newText);
            modal.remove();
        };

        // Show modal
        modal.classList.remove('hidden');
    }

    // Preview Mermaid diagram
    async previewMermaidDiagram(diagramText) {
        try {
            const previewId = `preview-${Date.now()}`;
            const { svg } = await mermaid.render(previewId, diagramText);

            // Show preview modal
            const previewModal = document.createElement('div');
            previewModal.className = 'mermaid-preview-modal modal';
            previewModal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Diagram Preview</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="mermaid-preview">${svg}</div>
                    </div>
                </div>
            `;

            document.body.appendChild(previewModal);
            previewModal.querySelector('.modal-close').onclick = () => previewModal.remove();

        } catch (error) {
            alert('Preview Error: ' + error.message);
        }
    }

    // Save Mermaid edit
    saveMermaidEdit(originalElement, newDiagramText) {
        // Create new mermaid element
        const newElement = document.createElement('pre');
        newElement.className = 'mermaid';
        newElement.textContent = newDiagramText;

        // Replace in editor
        originalElement.parentNode.replaceChild(newElement, originalElement);

        // Process the updated diagram
        setTimeout(() => {
            this.processMermaidDiagrams();
        }, 100);
    }

    // Create code block toolbar
    createCodeToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-group">
                <label>Language:</label>
                <select id="code-language-select" class="language-select">
                    ${this.supportedLanguages.map(lang =>
                        `<option value="${lang}">${lang}</option>`
                    ).join('')}
                </select>
                <button id="insert-code-btn" class="btn-sm btn-secondary">💻 Insert Code</button>
            </div>
            <div class="toolbar-group">
                <label>Diagram:</label>
                <select id="diagram-type-select" class="diagram-select">
                    <option value="flowchart">Flowchart</option>
                    <option value="sequence">Sequence</option>
                    <option value="gantt">Gantt Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="mindmap">Mind Map</option>
                    <option value="timeline">Timeline</option>
                </select>
                <button id="insert-diagram-btn" class="btn-sm btn-secondary">📊 Insert Diagram</button>
            </div>
        `;

        return toolbar;
    }

    // Setup toolbar event listeners
    setupToolbarListeners(toolbar) {
        const insertCodeBtn = toolbar.querySelector('#insert-code-btn');
        const insertDiagramBtn = toolbar.querySelector('#insert-diagram-btn');
        const languageSelect = toolbar.querySelector('#code-language-select');
        const diagramSelect = toolbar.querySelector('#diagram-type-select');

        if (insertCodeBtn && languageSelect) {
            insertCodeBtn.addEventListener('click', () => {
                const language = languageSelect.value;
                this.insertCodeBlock(language);
            });
        }

        if (insertDiagramBtn && diagramSelect) {
            insertDiagramBtn.addEventListener('click', () => {
                const diagramType = diagramSelect.value;
                this.insertMermaidDiagram(diagramType);
            });
        }
    }

    // Utility methods
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get code statistics
    getCodeStatistics() {
        return {
            supportedLanguages: this.supportedLanguages,
            isInitialized: this.isInitialized,
            features: {
                syntaxHighlighting: typeof Prism !== 'undefined',
                mermaidDiagrams: typeof mermaid !== 'undefined',
                codeInsertion: true,
                diagramEditing: true,
                multipleLanguages: true
            }
        };
    }

    // Apply theme to code highlighting
    applyTheme(theme) {
        // Update Mermaid theme
        if (typeof mermaid !== 'undefined') {
            const mermaidTheme = theme.includes('dark') ? 'dark' : 'default';
            this.mermaidConfig.theme = mermaidTheme;
            mermaid.initialize(this.mermaidConfig);

            // Re-process existing diagrams
            this.processMermaidDiagrams();
        }
    }
}

// Global code highlight manager instance
window.codeHighlightManager = new CodeHighlightManager();