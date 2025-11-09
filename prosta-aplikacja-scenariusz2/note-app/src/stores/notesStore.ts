import { create } from 'zustand';
import type { Note, Folder, SearchResult, StorageQuota } from '../types';
import { dbUtils } from '../db';

interface NotesState {
  // State
  notes: Note[];
  folders: Folder[];
  currentNote: Note | null;
  currentFolder: Folder | null;
  searchQuery: string;
  searchResults: SearchResult[];
  isLoading: boolean;
  storageQuota: StorageQuota | null;

  // Actions
  loadNotes: () => Promise<void>;
  loadFolders: () => Promise<void>;

  // Note actions
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;

  // Folder actions
  createFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setCurrentFolder: (folder: Folder | null) => void;

  // Search actions
  searchNotes: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Storage actions
  updateStorageQuota: () => Promise<void>;

  // Data management
  exportData: () => Promise<{ notes: Note[], folders: Folder[], exportDate: string, version: string }>;
  importData: (data: { notes: Note[], folders: Folder[] }) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  // Initial state
  notes: [],
  folders: [],
  currentNote: null,
  currentFolder: null,
  searchQuery: '',
  searchResults: [],
  isLoading: false,
  storageQuota: null,

  // Load data
  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await dbUtils.getAllNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ isLoading: false });
    }
  },

  loadFolders: async () => {
    set({ isLoading: true });
    try {
      const folders = await dbUtils.getAllFolders();
      set({ folders, isLoading: false });
    } catch (error) {
      console.error('Failed to load folders:', error);
      set({ isLoading: false });
    }
  },

  // Note actions
  createNote: async (noteData) => {
    set({ isLoading: true });
    try {
      const newNote = await dbUtils.createNote(noteData);
      const { notes } = get();
      set({
        notes: [...notes, newNote],
        currentNote: newNote,
        isLoading: false
      });
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    set({ isLoading: true });
    try {
      const updatedNote = await dbUtils.updateNote(id, updates);
      if (updatedNote) {
        const { notes, currentNote } = get();
        const updatedNotes = notes.map(note =>
          note.id === id ? updatedNote : note
        );
        set({
          notes: updatedNotes,
          currentNote: currentNote?.id === id ? updatedNote : currentNote,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      set({ isLoading: false });
    }
  },

  deleteNote: async (id) => {
    set({ isLoading: true });
    try {
      await dbUtils.deleteNote(id);
      const { notes, currentNote } = get();
      const filteredNotes = notes.filter(note => note.id !== id);
      set({
        notes: filteredNotes,
        currentNote: currentNote?.id === id ? null : currentNote,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      set({ isLoading: false });
    }
  },

  setCurrentNote: (note) => {
    set({ currentNote: note });
  },

  // Folder actions
  createFolder: async (folderData) => {
    set({ isLoading: true });
    try {
      const newFolder = await dbUtils.createFolder(folderData);
      const { folders } = get();
      set({
        folders: [...folders, newFolder],
        isLoading: false
      });
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateFolder: async (id, updates) => {
    set({ isLoading: true });
    try {
      const updatedFolder = await dbUtils.updateFolder(id, updates);
      if (updatedFolder) {
        const { folders, currentFolder } = get();
        const updatedFolders = folders.map(folder =>
          folder.id === id ? updatedFolder : folder
        );
        set({
          folders: updatedFolders,
          currentFolder: currentFolder?.id === id ? updatedFolder : currentFolder,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to update folder:', error);
      set({ isLoading: false });
    }
  },

  deleteFolder: async (id) => {
    set({ isLoading: true });
    try {
      await dbUtils.deleteFolder(id);
      const { folders, notes, currentFolder } = get();
      const filteredFolders = folders.filter(folder => folder.id !== id);
      const filteredNotes = notes.filter(note => note.folderId !== id);
      set({
        folders: filteredFolders,
        notes: filteredNotes,
        currentFolder: currentFolder?.id === id ? null : currentFolder,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to delete folder:', error);
      set({ isLoading: false });
    }
  },

  setCurrentFolder: (folder) => {
    set({ currentFolder: folder });
  },

  // Search actions
  searchNotes: async (query) => {
    set({ searchQuery: query, isLoading: true });

    if (!query.trim()) {
      set({ searchResults: [], isLoading: false });
      return;
    }

    try {
      const notes = await dbUtils.searchNotes(query);
      const searchResults: SearchResult[] = notes.map(note => {
        const matchedContent = note.content.substring(0, 200);
        const relevanceScore = calculateRelevanceScore(note, query);
        return { note, matchedContent, relevanceScore };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);

      set({ searchResults, isLoading: false });
    } catch (error) {
      console.error('Failed to search notes:', error);
      set({ isLoading: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] });
  },

  // Storage actions
  updateStorageQuota: async () => {
    try {
      const estimate = await dbUtils.getStorageEstimate();
      set({ storageQuota: estimate });
    } catch (error) {
      console.error('Failed to get storage estimate:', error);
    }
  },

  // Data management
  exportData: async () => {
    const { notes, folders } = await dbUtils.exportData();
    return {
      notes,
      folders,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  },

  importData: async (data) => {
    set({ isLoading: true });
    try {
      await dbUtils.importData(data);
      // Reload all data
      const [notes, folders] = await Promise.all([
        dbUtils.getAllNotes(),
        dbUtils.getAllFolders(),
      ]);
      set({
        notes,
        folders,
        currentNote: null,
        currentFolder: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));

// Helper function to calculate relevance score
function calculateRelevanceScore(note: Note, query: string): number {
  const lowercaseQuery = query.toLowerCase();
  let score = 0;

  // Title matches get highest score
  if (note.title.toLowerCase().includes(lowercaseQuery)) {
    score += 10;
  }

  // Content matches get medium score
  if (note.content.toLowerCase().includes(lowercaseQuery)) {
    score += 5;
  }

  // Tag matches get lower score
  if (note.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))) {
    score += 3;
  }

  // Boost score for exact matches
  if (note.title.toLowerCase() === lowercaseQuery) {
    score += 20;
  }

  return score;
}