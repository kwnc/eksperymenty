export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  note: Note;
  matchedContent: string;
  relevanceScore: number;
}

export interface AppState {
  notes: Note[];
  folders: Folder[];
  currentNote: Note | null;
  currentFolder: Folder | null;
  searchQuery: string;
  searchResults: SearchResult[];
  isLoading: boolean;
  storageQuota: StorageQuota | null;
}

export interface StorageQuota {
  quota: number;
  usage: number;
  usageDetails?: {
    indexedDB?: number;
  };
}

export interface ExportData {
  notes: Note[];
  folders: Folder[];
  exportDate: string;
  version: string;
}

export type ViewMode = 'list' | 'grid' | 'editor';

export type SortOrder = 'title' | 'createdAt' | 'updatedAt';

export type SortDirection = 'asc' | 'desc';