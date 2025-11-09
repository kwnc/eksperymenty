import Dexie, { type Table } from 'dexie';
import type { Note, Folder } from '../types';

export class NotesDatabase extends Dexie {
  notes!: Table<Note>;
  folders!: Table<Folder>;

  constructor() {
    super('NotesDatabase');
    this.version(1).stores({
      notes: 'id, title, content, folderId, createdAt, updatedAt, tags',
      folders: 'id, name, parentId, createdAt, updatedAt'
    });
  }
}

export const db = new NotesDatabase();

// Database utility functions
export const dbUtils = {
  // Notes operations
  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const now = new Date();
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    await db.notes.add(newNote);
    return newNote;
  },

  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | undefined> {
    const updatedNote = {
      ...updates,
      updatedAt: new Date(),
    };

    await db.notes.update(id, updatedNote);
    return db.notes.get(id);
  },

  async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  async getAllNotes(): Promise<Note[]> {
    return db.notes.toArray();
  },

  async getNotesByFolder(folderId: string): Promise<Note[]> {
    return db.notes.where('folderId').equals(folderId).toArray();
  },

  async searchNotes(query: string): Promise<Note[]> {
    const lowercaseQuery = query.toLowerCase();
    return db.notes
      .filter(note =>
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        (note.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ?? false)
      )
      .toArray();
  },

  // Folders operations
  async createFolder(folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    const now = new Date();
    const newFolder: Folder = {
      ...folder,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    await db.folders.add(newFolder);
    return newFolder;
  },

  async updateFolder(id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>): Promise<Folder | undefined> {
    const updatedFolder = {
      ...updates,
      updatedAt: new Date(),
    };

    await db.folders.update(id, updatedFolder);
    return db.folders.get(id);
  },

  async deleteFolder(id: string): Promise<void> {
    // Delete all notes in the folder
    await db.notes.where('folderId').equals(id).delete();
    // Delete the folder
    await db.folders.delete(id);
  },

  async getAllFolders(): Promise<Folder[]> {
    return db.folders.toArray();
  },

  async getSubfolders(parentId: string): Promise<Folder[]> {
    return db.folders.where('parentId').equals(parentId).toArray();
  },

  // Data export/import
  async exportData(): Promise<{ notes: Note[], folders: Folder[] }> {
    const [notes, folders] = await Promise.all([
      db.notes.toArray(),
      db.folders.toArray()
    ]);

    return { notes, folders };
  },

  async importData(data: { notes: Note[], folders: Folder[] }): Promise<void> {
    await db.transaction('rw', db.notes, db.folders, async () => {
      // Clear existing data
      await db.notes.clear();
      await db.folders.clear();

      // Import new data
      await db.folders.bulkAdd(data.folders);
      await db.notes.bulkAdd(data.notes);
    });
  },

  // Storage quota monitoring
  async getStorageEstimate(): Promise<{ quota: number; usage: number; usageDetails?: any }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        usageDetails: (estimate as any).usageDetails,
      };
    }
    return { quota: 0, usage: 0 };
  }
};