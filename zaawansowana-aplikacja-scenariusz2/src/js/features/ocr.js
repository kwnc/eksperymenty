/**
 * OCR Module - Handles Optical Character Recognition for attachments
 * Phase 3 Implementation using Tesseract.js
 */

class OCRManager {
    constructor() {
        this.isInitialized = false;
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.worker = null;
    }

    async init() {
        try {
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js library not loaded');
            }

            // Create worker
            this.worker = await Tesseract.createWorker('eng');
            this.isInitialized = true;

            console.log('OCR Manager initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize OCR:', error);
            this.isInitialized = false;
            return false;
        }
    }

    async processImage(file, options = {}) {
        try {
            if (!this.isInitialized) {
                const initialized = await this.init();
                if (!initialized) {
                    throw new Error('Failed to initialize OCR');
                }
            }

            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            const defaultOptions = {
                language: 'eng',
                confidence: 60,
                includeTextBlocks: false,
                includeWordBlocks: false,
                preserveFormatting: true
            };

            const ocrOptions = { ...defaultOptions, ...options };

            // Show progress notification
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Processing image with OCR...', 'info');
            }

            // Process image with Tesseract
            const { data } = await this.worker.recognize(file, {
                language: ocrOptions.language
            });

            // Filter results by confidence
            const filteredText = this.filterByConfidence(data, ocrOptions.confidence);

            const result = {
                success: true,
                text: filteredText.text,
                confidence: filteredText.averageConfidence,
                wordCount: filteredText.wordCount,
                processingTime: data.processingTime || 0,
                metadata: {
                    language: ocrOptions.language,
                    fileName: file.name,
                    fileSize: file.size,
                    imageWidth: data.imageWidth || 0,
                    imageHeight: data.imageHeight || 0
                }
            };

            if (ocrOptions.includeTextBlocks) {
                result.textBlocks = this.extractTextBlocks(data);
            }

            if (ocrOptions.includeWordBlocks) {
                result.wordBlocks = this.extractWordBlocks(data);
            }

            return result;

        } catch (error) {
            console.error('OCR processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    validateFile(file) {
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }

        if (!this.supportedFormats.includes(file.type)) {
            return {
                isValid: false,
                error: `Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`
            };
        }

        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`
            };
        }

        return { isValid: true };
    }

    filterByConfidence(data, minConfidence) {
        if (!data.words) {
            return {
                text: data.text || '',
                averageConfidence: data.confidence || 0,
                wordCount: 0
            };
        }

        const filteredWords = data.words.filter(word =>
            word.confidence >= minConfidence
        );

        const text = filteredWords.map(word => word.text).join(' ');
        const averageConfidence = filteredWords.length > 0
            ? filteredWords.reduce((sum, word) => sum + word.confidence, 0) / filteredWords.length
            : 0;

        return {
            text: text.trim(),
            averageConfidence: Math.round(averageConfidence),
            wordCount: filteredWords.length
        };
    }

    extractTextBlocks(data) {
        if (!data.blocks) return [];

        return data.blocks.map(block => ({
            text: block.text,
            confidence: block.confidence,
            bbox: block.bbox,
            paragraph: block.paragraph
        }));
    }

    extractWordBlocks(data) {
        if (!data.words) return [];

        return data.words.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
        }));
    }

    // Process multiple images
    async processBatch(files, options = {}) {
        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (window.noteNestApp) {
                window.noteNestApp.showNotification(
                    `Processing image ${i + 1} of ${files.length}...`,
                    'info'
                );
            }

            const result = await this.processImage(file, options);
            results.push({
                file: file.name,
                ...result
            });
        }

        return {
            success: true,
            results,
            totalFiles: files.length,
            successfulFiles: results.filter(r => r.success).length
        };
    }

    // Create attachment with OCR text
    async createAttachmentWithOCR(file, noteId) {
        try {
            if (!noteId) {
                throw new Error('Note ID is required');
            }

            // Process image with OCR
            const ocrResult = await this.processImage(file);

            if (!ocrResult.success) {
                throw new Error(ocrResult.error);
            }

            // Convert file to base64 for storage
            const base64Data = await this.fileToBase64(file);

            // Create attachment object
            const attachment = {
                noteId: noteId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                data: base64Data,
                ocrText: ocrResult.text,
                ocrConfidence: ocrResult.confidence,
                ocrMetadata: ocrResult.metadata,
                attachmentType: 'image',
                createdAt: new Date().toISOString()
            };

            // Store attachment
            const attachmentId = await window.storage.create('attachments', attachment);

            // Update note with attachment reference
            const noteResult = await window.notes.getNote(noteId);
            if (noteResult.success) {
                const note = noteResult.note;
                const attachments = note.attachments || [];
                attachments.push(attachmentId);

                await window.notes.updateNote(noteId, {
                    attachments: attachments
                });
            }

            return {
                success: true,
                attachment: { ...attachment, id: attachmentId },
                ocrResult
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Get attachment with OCR text
    async getAttachment(attachmentId) {
        try {
            const attachment = await window.storage.read('attachments', attachmentId);
            if (!attachment) {
                throw new Error('Attachment not found');
            }

            return {
                success: true,
                attachment
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all attachments for a note
    async getNoteAttachments(noteId) {
        try {
            const attachments = await window.storage.getAll('attachments');
            const noteAttachments = attachments.filter(att => att.noteId === noteId);

            return {
                success: true,
                attachments: noteAttachments
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Search attachments by OCR text
    async searchAttachments(query) {
        try {
            const attachments = await window.storage.getAll('attachments');
            const searchTerm = query.toLowerCase();

            const matchingAttachments = attachments.filter(att =>
                att.ocrText && att.ocrText.toLowerCase().includes(searchTerm)
            );

            return {
                success: true,
                attachments: matchingAttachments,
                query: query
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Extract text from image URL
    async extractTextFromURL(imageUrl, options = {}) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            const result = await this.worker.recognize(imageUrl, options);

            return {
                success: true,
                text: result.data.text,
                confidence: result.data.confidence
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get OCR statistics
    getStatistics() {
        return {
            supportedFormats: this.supportedFormats,
            maxFileSize: this.maxFileSize,
            isInitialized: this.isInitialized,
            capabilities: {
                batchProcessing: true,
                multipleLanguages: true,
                confidenceFiltering: true,
                textBlocks: true,
                wordBlocks: true
            }
        };
    }

    // Clean up resources
    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
        this.isInitialized = false;
    }

    // Language support
    getSupportedLanguages() {
        return [
            { code: 'eng', name: 'English' },
            { code: 'spa', name: 'Spanish' },
            { code: 'fra', name: 'French' },
            { code: 'deu', name: 'German' },
            { code: 'rus', name: 'Russian' },
            { code: 'chi_sim', name: 'Chinese (Simplified)' },
            { code: 'jpn', name: 'Japanese' },
            { code: 'kor', name: 'Korean' }
        ];
    }

    // Image preprocessing options
    getPreprocessingOptions() {
        return {
            enhance: 'Enhance image quality',
            denoise: 'Remove noise',
            deskew: 'Correct skew',
            threshold: 'Apply threshold'
        };
    }
}

// Global OCR manager instance
window.ocrManager = new OCRManager();