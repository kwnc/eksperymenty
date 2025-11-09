/**
 * Search Module - Handles note searching and indexing
 * Phase 2 Implementation with advanced search features
 */

class SearchManager {
    constructor() {
        this.searchIndex = new Map();
        this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    }

    // Advanced search with multiple criteria
    async search(query, options = {}) {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const searchOptions = {
                includeContent: true,
                includeTitle: true,
                includeTags: true,
                caseSensitive: false,
                exactMatch: false,
                notebookId: null,
                tags: [],
                dateRange: null,
                ...options
            };

            const searchTerms = this.parseSearchQuery(query);
            let results = [];

            if (searchTerms.length === 0 && searchOptions.tags.length === 0) {
                return { success: true, results: [] };
            }

            // Get all user notes
            const notesResult = await window.notes.getUserNotes();
            if (!notesResult.success) {
                throw new Error(notesResult.error);
            }

            let notes = notesResult.notes;

            // Filter by notebook if specified
            if (searchOptions.notebookId) {
                notes = notes.filter(note => note.notebookId === searchOptions.notebookId);
            }

            // Filter by date range if specified
            if (searchOptions.dateRange) {
                notes = this.filterByDateRange(notes, searchOptions.dateRange);
            }

            // Perform text search
            if (searchTerms.length > 0) {
                notes = this.performTextSearch(notes, searchTerms, searchOptions);
            }

            // Filter by tags if specified
            if (searchOptions.tags.length > 0) {
                notes = this.filterByTags(notes, searchOptions.tags);
            }

            // Calculate relevance scores
            results = notes.map(note => ({
                note,
                score: this.calculateRelevanceScore(note, searchTerms, searchOptions),
                matchedFields: this.getMatchedFields(note, searchTerms, searchOptions)
            }));

            // Sort by relevance score
            results.sort((a, b) => b.score - a.score);

            return {
                success: true,
                results: results.map(r => r.note),
                searchInfo: {
                    query,
                    totalResults: results.length,
                    searchTerms,
                    options: searchOptions
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Parse search query into terms and operators
    parseSearchQuery(query) {
        if (!query || typeof query !== 'string') return [];

        const terms = [];
        const regex = /"([^"]+)"|(\S+)/g;
        let match;

        while ((match = regex.exec(query)) !== null) {
            const term = match[1] || match[2]; // Quoted phrase or single word
            if (term && !this.stopWords.has(term.toLowerCase())) {
                terms.push(term.toLowerCase());
            }
        }

        return terms;
    }

    // Perform text search across note content
    performTextSearch(notes, searchTerms, options) {
        return notes.filter(note => {
            let hasMatch = false;

            // Search in title
            if (options.includeTitle && note.title) {
                const titleText = options.caseSensitive ? note.title : note.title.toLowerCase();
                hasMatch = searchTerms.some(term => {
                    return options.exactMatch ?
                        titleText === term :
                        titleText.includes(term);
                });
            }

            // Search in content
            if (!hasMatch && options.includeContent && note.content) {
                const contentText = this.stripHtml(note.content);
                const searchText = options.caseSensitive ? contentText : contentText.toLowerCase();
                hasMatch = searchTerms.some(term => {
                    return options.exactMatch ?
                        searchText === term :
                        searchText.includes(term);
                });
            }

            // Search in tags
            if (!hasMatch && options.includeTags && note.tags) {
                const tagText = note.tags.join(' ').toLowerCase();
                hasMatch = searchTerms.some(term => tagText.includes(term));
            }

            return hasMatch;
        });
    }

    // Filter notes by tags
    filterByTags(notes, requiredTags) {
        return notes.filter(note => {
            if (!note.tags || note.tags.length === 0) return false;

            const noteTags = note.tags.map(tag => tag.toLowerCase());
            return requiredTags.every(tag =>
                noteTags.includes(tag.toLowerCase())
            );
        });
    }

    // Filter notes by date range
    filterByDateRange(notes, dateRange) {
        const { start, end } = dateRange;
        const startDate = new Date(start);
        const endDate = new Date(end);

        return notes.filter(note => {
            const noteDate = new Date(note.updatedAt || note.createdAt);
            return noteDate >= startDate && noteDate <= endDate;
        });
    }

    // Calculate relevance score for search results
    calculateRelevanceScore(note, searchTerms, options) {
        let score = 0;

        if (searchTerms.length === 0) return 1;

        const titleText = (note.title || '').toLowerCase();
        const contentText = this.stripHtml(note.content || '').toLowerCase();
        const tagText = (note.tags || []).join(' ').toLowerCase();

        searchTerms.forEach(term => {
            // Title matches have higher weight
            if (titleText.includes(term)) {
                score += titleText === term ? 10 : 5;
            }

            // Tag matches have medium weight
            if (tagText.includes(term)) {
                score += 3;
            }

            // Content matches have lower weight
            if (contentText.includes(term)) {
                score += 1;
            }

            // Boost score for exact matches
            if (options.exactMatch) {
                if (titleText === term) score += 5;
                if (contentText.includes(` ${term} `)) score += 2;
            }
        });

        // Boost recent notes
        const daysSinceUpdate = (Date.now() - new Date(note.updatedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) score += 2;
        else if (daysSinceUpdate < 30) score += 1;

        return score;
    }

    // Get matched fields for highlighting
    getMatchedFields(note, searchTerms, options) {
        const matched = [];

        const titleText = (note.title || '').toLowerCase();
        const contentText = this.stripHtml(note.content || '').toLowerCase();
        const tagText = (note.tags || []).join(' ').toLowerCase();

        searchTerms.forEach(term => {
            if (titleText.includes(term)) matched.push('title');
            if (contentText.includes(term)) matched.push('content');
            if (tagText.includes(term)) matched.push('tags');
        });

        return [...new Set(matched)];
    }

    // Strip HTML tags from content
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    // Search suggestions based on existing content
    async getSearchSuggestions(query, limit = 5) {
        try {
            const suggestions = [];

            // Get all notes to build suggestions
            const notesResult = await window.notes.getUserNotes();
            if (notesResult.success) {
                const allText = notesResult.notes.map(note =>
                    `${note.title} ${this.stripHtml(note.content)} ${(note.tags || []).join(' ')}`
                ).join(' ').toLowerCase();

                const words = allText.split(/\s+/).filter(word =>
                    word.length > 2 &&
                    !this.stopWords.has(word) &&
                    word.includes(query.toLowerCase())
                );

                const wordFreq = {};
                words.forEach(word => {
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                });

                const sortedWords = Object.entries(wordFreq)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, limit)
                    .map(([word]) => word);

                suggestions.push(...sortedWords);
            }

            // Add tag suggestions
            const tags = await this.getAllTags();
            const matchingTags = tags.filter(tag =>
                tag.toLowerCase().includes(query.toLowerCase())
            ).slice(0, Math.max(0, limit - suggestions.length));

            suggestions.push(...matchingTags.map(tag => `tag:${tag}`));

            return {
                success: true,
                suggestions: suggestions.slice(0, limit)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all unique tags
    async getAllTags() {
        try {
            if (!window.auth.isAuthenticated()) return [];

            const user = window.auth.getCurrentUser();
            const tags = await window.storage.getAll('tags');

            return tags
                .filter(tag => tag.userId === user.id)
                .map(tag => tag.name)
                .sort();

        } catch (error) {
            console.error('Error getting tags:', error);
            return [];
        }
    }

    // Build search index for faster searching (future enhancement)
    async buildSearchIndex() {
        try {
            const notesResult = await window.notes.getUserNotes();
            if (!notesResult.success) return;

            this.searchIndex.clear();

            notesResult.notes.forEach(note => {
                const words = this.extractWords(`${note.title} ${this.stripHtml(note.content)}`);

                words.forEach(word => {
                    if (!this.searchIndex.has(word)) {
                        this.searchIndex.set(word, new Set());
                    }
                    this.searchIndex.get(word).add(note.id);
                });
            });

            console.log('Search index built with', this.searchIndex.size, 'unique terms');

        } catch (error) {
            console.error('Error building search index:', error);
        }
    }

    // Extract words from text for indexing
    extractWords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.stopWords.has(word));
    }

    // Search within specific notebook
    async searchInNotebook(notebookId, query, options = {}) {
        return this.search(query, { ...options, notebookId });
    }

    // Search by tag
    async searchByTags(tags, options = {}) {
        return this.search('', { ...options, tags });
    }

    // Advanced search with multiple criteria
    async advancedSearch(criteria) {
        const {
            query = '',
            tags = [],
            notebookId = null,
            dateFrom = null,
            dateTo = null,
            includeArchived = false
        } = criteria;

        const options = {
            tags,
            notebookId,
            dateRange: dateFrom && dateTo ? { start: dateFrom, end: dateTo } : null
        };

        const result = await this.search(query, options);

        if (result.success && !includeArchived) {
            result.results = result.results.filter(note => !note.isArchived);
        }

        return result;
    }
}

window.search = new SearchManager();