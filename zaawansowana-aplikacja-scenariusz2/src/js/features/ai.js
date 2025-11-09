/**
 * AI Integration Module - Handles OpenAI API integration for note summarization
 * Phase 3 Implementation
 */

class AIManager {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://api.openai.com/v1';
        this.models = {
            'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096, costEffective: true },
            'gpt-4': { name: 'GPT-4', maxTokens: 8192, highQuality: true },
            'gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 128000, latest: true }
        };
        this.defaultModel = 'gpt-3.5-turbo';
        this.isConfigured = false;
    }

    // Configure AI with API key
    configure(apiKey) {
        this.apiKey = apiKey;
        this.isConfigured = !!apiKey;

        // Save API key securely (in production, use proper encryption)
        if (window.storage) {
            window.storage.setSetting('openai_api_key', apiKey);
        }

        return this.isConfigured;
    }

    // Load saved configuration
    loadConfiguration() {
        if (window.storage) {
            const savedApiKey = window.storage.getSetting('openai_api_key');
            if (savedApiKey) {
                this.configure(savedApiKey);
            }
        }
    }

    // Check if AI is configured and available
    isAvailable() {
        return this.isConfigured && navigator.onLine;
    }

    // Summarize note content
    async summarizeNote(noteId, options = {}) {
        try {
            if (!this.isAvailable()) {
                throw new Error('AI services not available. Please check your API key and internet connection.');
            }

            const noteResult = await window.notes.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const note = noteResult.note;
            const content = this.stripHTML(note.content);

            if (content.length < 50) {
                throw new Error('Note content too short for summarization (minimum 50 characters)');
            }

            const summarizeOptions = {
                model: options.model || this.defaultModel,
                maxLength: options.maxLength || 150,
                style: options.style || 'concise',
                includeKeyPoints: options.includeKeyPoints || false,
                language: options.language || 'auto'
            };

            const prompt = this.buildSummarizePrompt(note.title, content, summarizeOptions);

            const response = await this.callOpenAI({
                model: summarizeOptions.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that summarizes notes clearly and concisely.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: Math.min(summarizeOptions.maxLength * 2, 500),
                temperature: 0.3
            });

            const summary = response.choices[0]?.message?.content?.trim();

            if (!summary) {
                throw new Error('Failed to generate summary');
            }

            // Save summary to note metadata
            const noteMetadata = note.metadata || {};
            noteMetadata.aiSummary = {
                text: summary,
                createdAt: new Date().toISOString(),
                model: summarizeOptions.model,
                options: summarizeOptions
            };

            await window.notes.updateNote(noteId, {
                metadata: noteMetadata
            });

            return {
                success: true,
                summary,
                metadata: {
                    model: summarizeOptions.model,
                    tokensUsed: response.usage?.total_tokens || 0,
                    originalLength: content.length,
                    summaryLength: summary.length,
                    compressionRatio: Math.round((summary.length / content.length) * 100)
                }
            };

        } catch (error) {
            console.error('AI summarization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate note from prompt
    async generateNote(prompt, options = {}) {
        try {
            if (!this.isAvailable()) {
                throw new Error('AI services not available');
            }

            const generateOptions = {
                model: options.model || this.defaultModel,
                maxLength: options.maxLength || 500,
                style: options.style || 'informative',
                format: options.format || 'markdown',
                language: options.language || 'english'
            };

            const systemPrompt = this.buildGeneratePrompt(generateOptions);

            const response = await this.callOpenAI({
                model: generateOptions.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: generateOptions.maxLength * 2,
                temperature: 0.7
            });

            const generatedContent = response.choices[0]?.message?.content?.trim();

            if (!generatedContent) {
                throw new Error('Failed to generate content');
            }

            return {
                success: true,
                content: generatedContent,
                metadata: {
                    model: generateOptions.model,
                    tokensUsed: response.usage?.total_tokens || 0,
                    prompt: prompt,
                    options: generateOptions
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Improve note writing
    async improveNote(noteId, options = {}) {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const note = noteResult.note;
            const content = this.stripHTML(note.content);

            const improveOptions = {
                model: options.model || this.defaultModel,
                focusAreas: options.focusAreas || ['clarity', 'grammar', 'structure'],
                preserveStyle: options.preserveStyle || true,
                language: options.language || 'auto'
            };

            const prompt = this.buildImprovePrompt(note.title, content, improveOptions);

            const response = await this.callOpenAI({
                model: improveOptions.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful writing assistant that improves text while preserving the original meaning and style.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: Math.max(content.length * 1.5, 1000),
                temperature: 0.3
            });

            const improvedContent = response.choices[0]?.message?.content?.trim();

            return {
                success: true,
                originalContent: content,
                improvedContent,
                suggestions: this.extractSuggestions(improvedContent),
                metadata: {
                    model: improveOptions.model,
                    tokensUsed: response.usage?.total_tokens || 0,
                    focusAreas: improveOptions.focusAreas
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Extract key topics from note
    async extractTopics(noteId, options = {}) {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const note = noteResult.note;
            const content = this.stripHTML(note.content);

            const prompt = `Extract the main topics and themes from this note. Return a JSON array of topics with importance scores (1-10):

Title: ${note.title}
Content: ${content}

Format: [{"topic": "topic name", "importance": 8, "description": "brief description"}]`;

            const response = await this.callOpenAI({
                model: options.model || this.defaultModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that analyzes text and extracts key topics. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.2
            });

            const topicsText = response.choices[0]?.message?.content?.trim();
            let topics;

            try {
                topics = JSON.parse(topicsText);
            } catch (parseError) {
                // Fallback: extract topics from text response
                topics = this.parseTopicsFromText(topicsText);
            }

            return {
                success: true,
                topics,
                metadata: {
                    model: options.model || this.defaultModel,
                    tokensUsed: response.usage?.total_tokens || 0
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate tags for note
    async generateTags(noteId, options = {}) {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const note = noteResult.note;
            const content = this.stripHTML(note.content);

            const prompt = `Generate relevant tags for this note. Return 5-10 concise, descriptive tags:

Title: ${note.title}
Content: ${content.substring(0, 1000)}...

Return tags as a comma-separated list.`;

            const response = await this.callOpenAI({
                model: options.model || this.defaultModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that generates relevant tags for notes. Keep tags concise and relevant.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.4
            });

            const tagsText = response.choices[0]?.message?.content?.trim();
            const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

            return {
                success: true,
                tags,
                metadata: {
                    model: options.model || this.defaultModel,
                    tokensUsed: response.usage?.total_tokens || 0
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Call OpenAI API
    async callOpenAI(requestData) {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    }

    // Build prompts
    buildSummarizePrompt(title, content, options) {
        const styleMap = {
            concise: 'very brief and to the point',
            detailed: 'comprehensive with key details',
            bullet: 'as bullet points',
            executive: 'in executive summary format'
        };

        const style = styleMap[options.style] || 'concise';

        return `Summarize this note ${style}. Maximum ${options.maxLength} words.

Title: ${title}
Content: ${content}

${options.includeKeyPoints ? 'Include key points at the end.' : ''}`;
    }

    buildGeneratePrompt(options) {
        const styleMap = {
            informative: 'informative and well-structured',
            creative: 'creative and engaging',
            academic: 'academic and formal',
            casual: 'casual and conversational'
        };

        const style = styleMap[options.style] || 'informative';

        return `You are a helpful assistant that creates ${style} content. Write in ${options.format} format in ${options.language}. Keep responses under ${options.maxLength} words.`;
    }

    buildImprovePrompt(title, content, options) {
        const focusAreas = options.focusAreas.join(', ');

        return `Improve this note focusing on: ${focusAreas}. ${options.preserveStyle ? 'Preserve the original writing style.' : 'Feel free to adjust the style.'}

Title: ${title}
Content: ${content}

Return only the improved version.`;
    }

    // Utility methods
    stripHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    extractSuggestions(improvedContent) {
        // Extract suggestions if they're included in the response
        const suggestionMarkers = ['Suggestions:', 'Improvements:', 'Changes:'];

        for (const marker of suggestionMarkers) {
            const index = improvedContent.indexOf(marker);
            if (index !== -1) {
                return improvedContent.substring(index).split('\n').filter(line => line.trim());
            }
        }

        return [];
    }

    parseTopicsFromText(text) {
        // Fallback parser for when JSON parsing fails
        const lines = text.split('\n').filter(line => line.trim());
        const topics = [];

        lines.forEach(line => {
            const match = line.match(/(.+?):?\s*(\d+)?/);
            if (match) {
                topics.push({
                    topic: match[1].trim(),
                    importance: parseInt(match[2]) || 5,
                    description: ''
                });
            }
        });

        return topics;
    }

    // Get available models
    getAvailableModels() {
        return Object.entries(this.models).map(([id, info]) => ({
            id,
            ...info
        }));
    }

    // Get usage statistics
    getUsageStats() {
        const stats = window.storage?.getSetting('ai_usage_stats') || {
            totalRequests: 0,
            totalTokens: 0,
            summariesGenerated: 0,
            notesImproved: 0,
            tagsGenerated: 0
        };

        return stats;
    }

    // Update usage statistics
    updateUsageStats(type, tokensUsed = 0) {
        const stats = this.getUsageStats();
        stats.totalRequests++;
        stats.totalTokens += tokensUsed;

        switch (type) {
            case 'summary':
                stats.summariesGenerated++;
                break;
            case 'improve':
                stats.notesImproved++;
                break;
            case 'tags':
                stats.tagsGenerated++;
                break;
        }

        if (window.storage) {
            window.storage.setSetting('ai_usage_stats', stats);
        }
    }

    // Clear API key
    clearConfiguration() {
        this.apiKey = null;
        this.isConfigured = false;
        if (window.storage) {
            window.storage.setSetting('openai_api_key', null);
        }
    }
}

// Global AI manager instance
window.aiManager = new AIManager();