/**
 * Views Module - Handles Calendar and Kanban views for note organization
 * Phase 3 Implementation
 */

class ViewsManager {
    constructor() {
        this.currentView = 'list'; // list, calendar, kanban
        this.currentDate = new Date();
        this.kanbanColumns = [
            { id: 'todo', title: 'To Do', color: '#FF6B6B' },
            { id: 'in_progress', title: 'In Progress', color: '#4ECDC4' },
            { id: 'review', title: 'Review', color: '#45B7D1' },
            { id: 'done', title: 'Done', color: '#96CEB4' }
        ];
    }

    // Switch between different views
    switchView(viewType) {
        this.currentView = viewType;

        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-view="${viewType}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Render appropriate view
        switch (viewType) {
            case 'list':
                this.renderListView();
                break;
            case 'calendar':
                this.renderCalendarView();
                break;
            case 'kanban':
                this.renderKanbanView();
                break;
        }

        // Save preference
        if (window.storage) {
            window.storage.setSetting('preferred_view', viewType);
        }
    }

    // Render list view (existing note list)
    renderListView() {
        if (window.ui) {
            window.ui.renderNotesList();
        }
    }

    // Render calendar view
    async renderCalendarView() {
        const notesContainer = document.getElementById('notes-list');
        if (!notesContainer) return;

        const notes = await this.getAllNotesWithDates();

        notesContainer.innerHTML = `
            <div class="calendar-view">
                <div class="calendar-header">
                    <button class="btn-icon" id="prev-month">&larr;</button>
                    <h3 id="calendar-title">${this.getMonthYear()}</h3>
                    <button class="btn-icon" id="next-month">&rarr;</button>
                </div>
                <div class="calendar-grid" id="calendar-grid">
                    ${this.generateCalendarGrid(notes)}
                </div>
                <div class="calendar-legend">
                    <div class="legend-item">
                        <span class="dot created"></span>
                        <span>Created</span>
                    </div>
                    <div class="legend-item">
                        <span class="dot modified"></span>
                        <span>Modified</span>
                    </div>
                </div>
            </div>
        `;

        this.setupCalendarEvents();
    }

    // Generate calendar grid HTML
    generateCalendarGrid(notes) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        let html = `
            <div class="calendar-weekdays">
                <div class="weekday">Sun</div>
                <div class="weekday">Mon</div>
                <div class="weekday">Tue</div>
                <div class="weekday">Wed</div>
                <div class="weekday">Thu</div>
                <div class="weekday">Fri</div>
                <div class="weekday">Sat</div>
            </div>
            <div class="calendar-days">
        `;

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayNotes = this.getNotesForDate(notes, dateString);
            const isToday = this.isToday(year, month, day);

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateString}">
                    <div class="day-number">${day}</div>
                    <div class="day-notes">
                        ${dayNotes.map(note => `
                            <div class="day-note ${note.type}"
                                 data-note-id="${note.id}"
                                 title="${note.title}">
                                ${note.title.length > 15 ? note.title.substring(0, 15) + '...' : note.title}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    // Get notes for specific date
    getNotesForDate(notes, dateString) {
        return notes.filter(note => {
            const createdDate = note.createdAt.split('T')[0];
            const modifiedDate = note.updatedAt.split('T')[0];
            return createdDate === dateString || modifiedDate === dateString;
        }).map(note => ({
            ...note,
            type: note.createdAt.split('T')[0] === dateString ? 'created' : 'modified'
        }));
    }

    // Check if date is today
    isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year &&
               today.getMonth() === month &&
               today.getDate() === day;
    }

    // Setup calendar event listeners
    setupCalendarEvents() {
        // Navigation buttons
        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendarView();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendarView();
        });

        // Day note clicks
        document.querySelectorAll('.day-note').forEach(noteEl => {
            noteEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = noteEl.dataset.noteId;
                if (window.ui && noteId) {
                    window.ui.openNote(noteId);
                }
            });
        });

        // Day clicks (for creating new notes)
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const date = dayEl.dataset.date;
                this.createNoteForDate(date);
            });
        });
    }

    // Create new note for specific date
    async createNoteForDate(dateString) {
        if (window.ui) {
            const note = await window.ui.createNewNote();
            if (note) {
                // Set note date metadata
                const metadata = note.metadata || {};
                metadata.scheduledDate = dateString;

                await window.notes.updateNote(note.id, { metadata });
                this.renderCalendarView(); // Refresh calendar
            }
        }
    }

    // Render Kanban view
    async renderKanbanView() {
        const notesContainer = document.getElementById('notes-list');
        if (!notesContainer) return;

        const notes = await this.getAllNotesWithKanbanStatus();

        notesContainer.innerHTML = `
            <div class="kanban-view">
                <div class="kanban-header">
                    <h3>Project Board</h3>
                    <button class="btn-secondary" id="add-kanban-column">+ Add Column</button>
                </div>
                <div class="kanban-board" id="kanban-board">
                    ${this.kanbanColumns.map(column => `
                        <div class="kanban-column" data-column-id="${column.id}">
                            <div class="column-header" style="border-left: 4px solid ${column.color}">
                                <h4>${column.title}</h4>
                                <span class="note-count">${this.getColumnNoteCount(notes, column.id)}</span>
                            </div>
                            <div class="column-content" id="column-${column.id}">
                                ${this.renderKanbanNotes(notes, column.id)}
                            </div>
                            <div class="column-footer">
                                <button class="btn-ghost add-note-btn" data-column="${column.id}">
                                    + Add Note
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.setupKanbanEvents();
    }

    // Render notes for Kanban column
    renderKanbanNotes(notes, columnId) {
        const columnNotes = notes.filter(note =>
            (note.metadata?.kanbanStatus || 'todo') === columnId
        );

        return columnNotes.map(note => `
            <div class="kanban-card" data-note-id="${note.id}" draggable="true">
                <div class="card-header">
                    <h5>${note.title}</h5>
                    <button class="btn-icon card-menu" data-note-id="${note.id}">⋮</button>
                </div>
                <div class="card-content">
                    ${this.getCardPreview(note.content)}
                </div>
                <div class="card-footer">
                    <span class="card-date">${this.formatCardDate(note.updatedAt)}</span>
                    ${note.tags ? note.tags.map(tag => `
                        <span class="tag mini">${tag}</span>
                    `).join('') : ''}
                </div>
            </div>
        `).join('');
    }

    // Get card content preview
    getCardPreview(content) {
        const textContent = content.replace(/<[^>]*>/g, '').trim();
        return textContent.length > 100 ?
            textContent.substring(0, 100) + '...' :
            textContent;
    }

    // Format date for card
    formatCardDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    // Get note count for column
    getColumnNoteCount(notes, columnId) {
        return notes.filter(note =>
            (note.metadata?.kanbanStatus || 'todo') === columnId
        ).length;
    }

    // Setup Kanban event listeners
    setupKanbanEvents() {
        // Add note buttons
        document.querySelectorAll('.add-note-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const columnId = btn.dataset.column;
                await this.createKanbanNote(columnId);
            });
        });

        // Card clicks
        document.querySelectorAll('.kanban-card').forEach(card => {
            card.addEventListener('click', () => {
                const noteId = card.dataset.noteId;
                if (window.ui && noteId) {
                    window.ui.openNote(noteId);
                }
            });
        });

        // Drag and drop setup
        this.setupKanbanDragDrop();

        // Card menu buttons
        document.querySelectorAll('.card-menu').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCardMenu(e.target.dataset.noteId, e.target);
            });
        });
    }

    // Create new note in Kanban column
    async createKanbanNote(columnId) {
        if (window.ui) {
            const note = await window.ui.createNewNote();
            if (note) {
                // Set Kanban status
                const metadata = note.metadata || {};
                metadata.kanbanStatus = columnId;

                await window.notes.updateNote(note.id, { metadata });
                this.renderKanbanView(); // Refresh Kanban
            }
        }
    }

    // Setup drag and drop for Kanban
    setupKanbanDragDrop() {
        let draggedCard = null;

        // Card drag events
        document.querySelectorAll('.kanban-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedCard = card;
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                draggedCard = null;
            });
        });

        // Column drop events
        document.querySelectorAll('.column-content').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');

                if (draggedCard) {
                    const noteId = draggedCard.dataset.noteId;
                    const newColumnId = column.id.replace('column-', '');

                    await this.moveNoteToColumn(noteId, newColumnId);
                }
            });
        });
    }

    // Move note to different Kanban column
    async moveNoteToColumn(noteId, newColumnId) {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (noteResult.success) {
                const note = noteResult.note;
                const metadata = note.metadata || {};
                metadata.kanbanStatus = newColumnId;

                await window.notes.updateNote(noteId, { metadata });
                this.renderKanbanView(); // Refresh Kanban

                if (window.noteNestApp) {
                    window.noteNestApp.showNotification('Note moved successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error moving note:', error);
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Failed to move note', 'error');
            }
        }
    }

    // Show card context menu
    showCardMenu(noteId, buttonElement) {
        // Remove existing menus
        document.querySelectorAll('.card-context-menu').forEach(menu => menu.remove());

        const menu = document.createElement('div');
        menu.className = 'card-context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="edit">Edit Note</div>
            <div class="menu-item" data-action="duplicate">Duplicate</div>
            <div class="menu-item" data-action="export">Export</div>
            <div class="menu-separator"></div>
            <div class="menu-item danger" data-action="delete">Delete</div>
        `;

        // Position menu
        const rect = buttonElement.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '1000';

        document.body.appendChild(menu);

        // Menu item clicks
        menu.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
            if (action) {
                await this.handleCardAction(noteId, action);
                menu.remove();
            }
        });

        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    // Handle card context menu actions
    async handleCardAction(noteId, action) {
        switch (action) {
            case 'edit':
                if (window.ui) {
                    window.ui.openNote(noteId);
                }
                break;
            case 'duplicate':
                await this.duplicateNote(noteId);
                break;
            case 'export':
                if (window.exportManager) {
                    window.exportManager.exportNote(noteId, 'markdown');
                }
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this note?')) {
                    await window.notes.deleteNote(noteId);
                    this.renderKanbanView();
                }
                break;
        }
    }

    // Duplicate note
    async duplicateNote(noteId) {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (noteResult.success) {
                const originalNote = noteResult.note;
                const duplicatedNote = {
                    title: `${originalNote.title} (Copy)`,
                    content: originalNote.content,
                    notebookId: originalNote.notebookId,
                    tags: originalNote.tags ? [...originalNote.tags] : [],
                    metadata: originalNote.metadata ? { ...originalNote.metadata } : {}
                };

                const result = await window.notes.createNote(duplicatedNote);
                if (result.success) {
                    this.renderKanbanView();
                    if (window.noteNestApp) {
                        window.noteNestApp.showNotification('Note duplicated successfully', 'success');
                    }
                }
            }
        } catch (error) {
            console.error('Error duplicating note:', error);
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Failed to duplicate note', 'error');
            }
        }
    }

    // Utility methods
    async getAllNotesWithDates() {
        try {
            const result = await window.notes.getAllNotes();
            return result.success ? result.notes : [];
        } catch (error) {
            console.error('Error fetching notes:', error);
            return [];
        }
    }

    async getAllNotesWithKanbanStatus() {
        const notes = await this.getAllNotesWithDates();
        return notes.map(note => ({
            ...note,
            kanbanStatus: note.metadata?.kanbanStatus || 'todo'
        }));
    }

    getMonthYear() {
        return this.currentDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    }

    // Load saved view preference
    loadViewPreference() {
        if (window.storage) {
            const savedView = window.storage.getSetting('preferred_view');
            if (savedView && ['list', 'calendar', 'kanban'].includes(savedView)) {
                this.switchView(savedView);
                return;
            }
        }
        // Default to list view
        this.switchView('list');
    }

    // Get view statistics
    getViewStatistics() {
        return {
            currentView: this.currentView,
            kanbanColumns: this.kanbanColumns.length,
            calendarMonth: this.getMonthYear(),
            supportedViews: ['list', 'calendar', 'kanban']
        };
    }
}

// Global views manager instance
window.viewsManager = new ViewsManager();