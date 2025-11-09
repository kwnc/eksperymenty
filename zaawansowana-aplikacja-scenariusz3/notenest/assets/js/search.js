// NoteNest - Search Functionality
class SearchManager {
    constructor() {
        this.storageManager = null;
        this.authManager = null;
        this.notesManager = null;
        this.searchResults = [];
        this.currentQuery = '';
        this.searchFilters = {
            notebooks: [],
            tags: [],
            dateRange: null,
            includeArchived: false
        };
        this.searchHistory = [];
        this.maxHistoryItems = 20;
        this.onSearchResults = null;
        this.onSearchStateChanged = null;
        this.searchDebounceTimer = null;
        this.searchDebounceDelay = 300;
        this.init();
    }

    async init() {
        // Wait for required managers
        if (typeof StorageManager !== 'undefined') {
            this.storageManager = new StorageManager();
            // Other managers will be injected by app.js
        } else {
            setTimeout(() => this.init(), 100);
        }

        // Load search history from session storage
        this.loadSearchHistory();
    }

    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    setNotesManager(notesManager) {
        this.notesManager = notesManager;
    }

    // Perform search with debouncing
    debounceSearch(query, filters = {}) {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        this.searchDebounceTimer = setTimeout(() => {
            this.search(query, filters);
        }, this.searchDebounceDelay);
    }

    // Main search function
    async search(query, filters = {}) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            // Update current query and filters
            this.currentQuery = query.trim();
            this.searchFilters = { ...this.searchFilters, ...filters };

            // If empty query, return all notes (filtered by current filters)
            if (!this.currentQuery) {
                this.searchResults = await this.getAllFilteredNotes();
            } else {
                this.searchResults = await this.performTextSearch();
            }

            // Apply additional filters
            this.searchResults = this.applyFilters(this.searchResults);

            // Sort results by relevance
            this.searchResults = this.sortByRelevance(this.searchResults);

            // Add to search history if it's a meaningful search
            if (this.currentQuery.length > 2) {
                this.addToSearchHistory(this.currentQuery);
            }

            // Trigger callbacks
            if (this.onSearchResults) {
                this.onSearchResults(this.searchResults, this.currentQuery);
            }
            if (this.onSearchStateChanged) {
                this.onSearchStateChanged({
                    query: this.currentQuery,
                    filters: this.searchFilters,
                    resultCount: this.searchResults.length
                });
            }

            return this.searchResults;

        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    // Perform text-based search
    async performTextSearch() {
        const userId = this.authManager.getCurrentUser().id;

        // Get all notes
        const allNotes = await this.storageManager.getUserNotes(userId, {
            includeArchived: this.searchFilters.includeArchived,
            sortBy: 'modifiedAt',
            sortOrder: 'desc'
        });

        const query = this.currentQuery.toLowerCase();
        const searchTerms = this.parseSearchQuery(query);

        return allNotes.filter(note => {
            return this.matchesSearchTerms(note, searchTerms);
        });
    }

    // Parse search query into terms and operators
    parseSearchQuery(query) {
        const terms = [];
        const regex = /"([^"]+)"|(\S+)/g;
        let match;

        while ((match = regex.exec(query)) !== null) {
            const term = match[1] || match[2];
            terms.push({
                text: term.toLowerCase(),
                isPhrase: !!match[1]
            });
        }

        return terms;
    }

    // Check if note matches search terms
    matchesSearchTerms(note, searchTerms) {
        const searchableText = this.getSearchableText(note).toLowerCase();

        return searchTerms.every(term => {
            if (term.isPhrase) {
                return searchableText.includes(term.text);
            } else {
                // For single words, check if they appear as whole words or parts of words
                return searchableText.includes(term.text);
            }
        });
    }

    // Get searchable text from note
    getSearchableText(note) {
        // Strip HTML tags from content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        const cleanContent = tempDiv.textContent || tempDiv.innerText || '';

        return [
            note.title,
            cleanContent,
            note.tags.join(' ')
        ].join(' ');
    }

    // Get all notes with basic filters applied
    async getAllFilteredNotes() {
        const userId = this.authManager.getCurrentUser().id;

        return await this.storageManager.getUserNotes(userId, {
            includeArchived: this.searchFilters.includeArchived,
            sortBy: 'modifiedAt',
            sortOrder: 'desc'
        });
    }

    // Apply additional filters to search results
    applyFilters(notes) {
        let filteredNotes = [...notes];

        // Filter by notebooks
        if (this.searchFilters.notebooks && this.searchFilters.notebooks.length > 0) {
            filteredNotes = filteredNotes.filter(note =>
                this.searchFilters.notebooks.includes(note.notebookId)
            );
        }

        // Filter by tags
        if (this.searchFilters.tags && this.searchFilters.tags.length > 0) {
            filteredNotes = filteredNotes.filter(note =>
                this.searchFilters.tags.some(tag => note.tags.includes(tag))
            );
        }

        // Filter by date range
        if (this.searchFilters.dateRange) {
            const { start, end } = this.searchFilters.dateRange;
            filteredNotes = filteredNotes.filter(note => {
                const noteDate = new Date(note.modifiedAt);
                return noteDate >= start && noteDate <= end;
            });
        }

        return filteredNotes;
    }

    // Sort results by relevance
    sortByRelevance(notes) {
        if (!this.currentQuery) {
            return notes; // Keep original order for non-text searches
        }

        const query = this.currentQuery.toLowerCase();

        return notes.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, query);
            const scoreB = this.calculateRelevanceScore(b, query);
            return scoreB - scoreA;
        });
    }

    // Calculate relevance score for a note
    calculateRelevanceScore(note, query) {
        let score = 0;
        const queryTerms = query.split(/\s+/);

        // Title matches get highest score
        const titleLower = note.title.toLowerCase();
        queryTerms.forEach(term => {
            if (titleLower.includes(term)) {
                score += titleLower === term ? 100 : 50; // Exact match vs partial
            }
        });

        // Tag matches get high score
        queryTerms.forEach(term => {
            note.tags.forEach(tag => {
                if (tag.toLowerCase().includes(term)) {
                    score += tag.toLowerCase() === term ? 30 : 15;
                }
            });
        });

        // Content matches get lower score
        const contentLower = this.getSearchableText(note).toLowerCase();
        queryTerms.forEach(term => {
            const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
            score += matches * 5;
        });

        // Boost recent notes slightly
        const daysSinceModified = (Date.now() - new Date(note.modifiedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceModified < 7) {
            score += 10;
        } else if (daysSinceModified < 30) {
            score += 5;
        }

        // Boost pinned notes
        if (note.pinned) {
            score += 20;
        }

        return score;
    }

    // Advanced search with specific fields
    async advancedSearch(criteria) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            const allNotes = await this.storageManager.getUserNotes(userId, {
                includeArchived: true,
                sortBy: 'modifiedAt',
                sortOrder: 'desc'
            });

            let results = allNotes;

            // Filter by title
            if (criteria.title) {
                const titleQuery = criteria.title.toLowerCase();
                results = results.filter(note =>
                    note.title.toLowerCase().includes(titleQuery)
                );
            }

            // Filter by content
            if (criteria.content) {
                const contentQuery = criteria.content.toLowerCase();
                results = results.filter(note => {
                    const cleanContent = this.getSearchableText(note).toLowerCase();
                    return cleanContent.includes(contentQuery);
                });
            }

            // Filter by tags
            if (criteria.tags && criteria.tags.length > 0) {
                results = results.filter(note =>
                    criteria.tags.every(tag => note.tags.includes(tag))
                );
            }

            // Filter by notebooks
            if (criteria.notebooks && criteria.notebooks.length > 0) {
                results = results.filter(note =>
                    criteria.notebooks.includes(note.notebookId)
                );
            }

            // Filter by date created
            if (criteria.createdAfter || criteria.createdBefore) {
                results = results.filter(note => {
                    const createdDate = new Date(note.createdAt);
                    let matches = true;

                    if (criteria.createdAfter) {
                        matches = matches && createdDate >= new Date(criteria.createdAfter);
                    }
                    if (criteria.createdBefore) {
                        matches = matches && createdDate <= new Date(criteria.createdBefore);
                    }

                    return matches;
                });
            }

            // Filter by date modified
            if (criteria.modifiedAfter || criteria.modifiedBefore) {
                results = results.filter(note => {
                    const modifiedDate = new Date(note.modifiedAt);
                    let matches = true;

                    if (criteria.modifiedAfter) {
                        matches = matches && modifiedDate >= new Date(criteria.modifiedAfter);
                    }
                    if (criteria.modifiedBefore) {
                        matches = matches && modifiedDate <= new Date(criteria.modifiedBefore);
                    }

                    return matches;
                });
            }

            // Filter by pinned status
            if (criteria.pinned !== undefined) {
                results = results.filter(note => note.pinned === criteria.pinned);
            }

            // Filter by archived status
            if (criteria.archived !== undefined) {
                results = results.filter(note => note.archived === criteria.archived);
            }

            this.searchResults = results;

            if (this.onSearchResults) {
                this.onSearchResults(this.searchResults, 'Advanced Search');
            }

            return this.searchResults;

        } catch (error) {
            console.error('Advanced search error:', error);
            throw error;
        }
    }

    // Search within specific notebook
    async searchInNotebook(notebookId, query) {
        this.searchFilters.notebooks = [notebookId];
        return await this.search(query);
    }

    // Search by tags
    async searchByTags(tags) {
        this.searchFilters.tags = Array.isArray(tags) ? tags : [tags];
        return await this.search('');
    }

    // Get search suggestions based on query
    async getSearchSuggestions(query) {
        try {
            if (!query || query.length < 2) {
                return this.getRecentSearches();
            }

            const suggestions = new Set();
            const queryLower = query.toLowerCase();

            // Add matching search history
            this.searchHistory.forEach(term => {
                if (term.toLowerCase().includes(queryLower)) {
                    suggestions.add(term);
                }
            });

            // Add matching tags
            if (this.notesManager) {
                const allTags = this.notesManager.getAllTags();
                allTags.forEach(tag => {
                    if (tag.toLowerCase().includes(queryLower)) {
                        suggestions.add(`tag:${tag}`);
                    }
                });
            }

            // Add matching note titles
            const userId = this.authManager.getCurrentUser().id;
            const recentNotes = await this.storageManager.getUserNotes(userId, {
                sortBy: 'modifiedAt',
                sortOrder: 'desc'
            });

            recentNotes.slice(0, 20).forEach(note => {
                if (note.title.toLowerCase().includes(queryLower)) {
                    suggestions.add(note.title);
                }
            });

            return Array.from(suggestions).slice(0, 10);

        } catch (error) {
            console.error('Error getting search suggestions:', error);
            return [];
        }
    }

    // Get recent searches
    getRecentSearches() {
        return this.searchHistory.slice(0, 5);
    }

    // Add to search history
    addToSearchHistory(query) {
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(term => term !== query);

        // Add to beginning
        this.searchHistory.unshift(query);

        // Limit history size
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }

        // Save to session storage
        this.saveSearchHistory();
    }

    // Clear search history
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    // Load search history from session storage
    loadSearchHistory() {
        if (this.storageManager) {
            const history = this.storageManager.getSessionData('search_history');
            if (history && Array.isArray(history)) {
                this.searchHistory = history;
            }
        }
    }

    // Save search history to session storage
    saveSearchHistory() {
        if (this.storageManager) {
            this.storageManager.setSessionData('search_history', this.searchHistory);
        }
    }

    // Clear current search
    clearSearch() {
        this.currentQuery = '';
        this.searchResults = [];
        this.searchFilters = {
            notebooks: [],
            tags: [],
            dateRange: null,
            includeArchived: false
        };

        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        if (this.onSearchResults) {
            this.onSearchResults([], '');
        }
        if (this.onSearchStateChanged) {
            this.onSearchStateChanged({
                query: '',
                filters: this.searchFilters,
                resultCount: 0
            });
        }
    }

    // Set search filters
    setFilters(filters) {
        this.searchFilters = { ...this.searchFilters, ...filters };

        // Re-run search with new filters if there's an active query
        if (this.currentQuery || this.hasActiveFilters()) {
            this.search(this.currentQuery);
        }
    }

    // Check if any filters are active
    hasActiveFilters() {
        return (
            this.searchFilters.notebooks.length > 0 ||
            this.searchFilters.tags.length > 0 ||
            this.searchFilters.dateRange !== null ||
            this.searchFilters.includeArchived
        );
    }

    // Get current search state
    getSearchState() {
        return {
            query: this.currentQuery,
            filters: this.searchFilters,
            results: this.searchResults,
            resultCount: this.searchResults.length
        };
    }

    // Highlight search terms in text
    highlightSearchTerms(text, query) {
        if (!query || !text) return text;

        const terms = this.parseSearchQuery(query.toLowerCase());
        let highlightedText = text;

        terms.forEach(term => {
            const regex = new RegExp(`(${this.escapeRegex(term.text)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });

        return highlightedText;
    }

    // Escape special regex characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Set callbacks
    setSearchResultsCallback(callback) {
        this.onSearchResults = callback;
    }

    setSearchStateChangedCallback(callback) {
        this.onSearchStateChanged = callback;
    }

    // Cleanup
    destroy() {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        this.onSearchResults = null;
        this.onSearchStateChanged = null;
    }
}

// Export for use in other modules
window.SearchManager = SearchManager;