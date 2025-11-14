/**
 * ui.js - User Interface Layer
 * Handle all DOM manipulation and UI rendering
 */

/**
 * Initialize UI event listeners
 */
function initUI() {
  bindEventListeners();
  renderView();
}

/**
 * Bind all event listeners
 */
function bindEventListeners() {
  // Navigation
  document.getElementById('new-note-btn').addEventListener('click', handleNewNote);
  document.getElementById('all-notes-btn').addEventListener('click', handleShowAllNotes);
  document.getElementById('back-to-list-btn').addEventListener('click', handleBackToList);

  // Note actions
  document.getElementById('save-note-btn').addEventListener('click', handleSaveNote);
  document.getElementById('delete-note-btn').addEventListener('click', handleDeleteNote);
  document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
  document.getElementById('cancel-delete-btn').addEventListener('click', cancelDelete);

  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Form inputs - auto-save on blur
  document.getElementById('note-title').addEventListener('blur', handleAutoSave);
  document.getElementById('note-content').addEventListener('blur', handleAutoSave);
  document.getElementById('note-tags').addEventListener('blur', handleAutoSave);
}

/**
 * Render notes list view
 * @param {Note[]} notes - Array of notes to render
 */
function renderNotesList(notes) {
  const container = document.getElementById('notes-list');

  if (!notes || notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No notes found. Create your first note!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notes.map(note => `
    <article class="note-card" data-note-id="${note.id}">
      <h3 class="note-card-title">${sanitizeHTML(note.title)}</h3>
      <p class="note-card-preview">${sanitizeHTML(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
      <div class="note-card-meta">
        <span class="note-card-date">${formatDate(note.updatedAt)}</span>
        ${note.tags.length > 0 ? `
          <div class="note-card-tags">
            ${note.tags.map(tag => `<span class="tag">${sanitizeHTML(tag)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </article>
  `).join('');

  // Add click handlers to note cards
  container.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => {
      const noteId = card.dataset.noteId;
      handleNoteClick(noteId);
    });
  });
}

/**
 * Render note editor with note data
 * @param {Note|null} note - Note to edit or null for new note
 */
function renderNoteEditor(note) {
  const titleInput = document.getElementById('note-title');
  const contentInput = document.getElementById('note-content');
  const tagsInput = document.getElementById('note-tags');
  const createdDate = document.getElementById('created-date');
  const updatedDate = document.getElementById('updated-date');

  if (note) {
    titleInput.value = note.title;
    contentInput.value = note.content;
    tagsInput.value = note.tags.join(', ');
    createdDate.textContent = `Created: ${formatDate(note.createdAt)}`;
    updatedDate.textContent = `Last updated: ${formatDate(note.updatedAt)}`;
    document.getElementById('delete-note-btn').style.display = 'block';
  } else {
    titleInput.value = '';
    contentInput.value = '';
    tagsInput.value = '';
    createdDate.textContent = 'Created: --';
    updatedDate.textContent = 'Last updated: --';
    document.getElementById('delete-note-btn').style.display = 'none';
  }

  // Focus title input
  setTimeout(() => titleInput.focus(), 100);
}

/**
 * Render tag cloud
 * @param {Array<{tag: string, count: number}>} tags - Tags with counts
 */
function renderTagCloud(tags) {
  const container = document.getElementById('tag-cloud');

  if (!tags || tags.length === 0) {
    container.innerHTML = '<p class="no-tags">No tags yet</p>';
    return;
  }

  container.innerHTML = tags.map(({ tag, count }) => `
    <button class="tag-button" data-tag="${tag}">
      ${sanitizeHTML(tag)} <span class="tag-count">(${count})</span>
    </button>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.tag-button').forEach(button => {
    button.addEventListener('click', () => {
      const tag = button.dataset.tag;
      handleTagFilter(tag);
    });
  });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: "success", "error", "info"
 */
function showNotification(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('toast-show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show note list view
 */
function showNotesListView() {
  document.getElementById('notes-list-view').style.display = 'block';
  document.getElementById('note-editor-view').style.display = 'none';
}

/**
 * Show note editor view
 */
function showNoteEditorView() {
  document.getElementById('notes-list-view').style.display = 'none';
  document.getElementById('note-editor-view').style.display = 'block';
}

/**
 * Show delete confirmation modal
 */
function showDeleteModal() {
  document.getElementById('delete-modal').style.display = 'flex';
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
}

/**
 * Update view title
 * @param {string} title - View title
 */
function updateViewTitle(title) {
  document.getElementById('view-title').textContent = title;
}

/**
 * Render the current view based on app state
 */
function renderView() {
  const tags = getAllTags();
  renderTagCloud(tags);

  const notes = getAllNotes();
  renderNotesList(notes);
}
