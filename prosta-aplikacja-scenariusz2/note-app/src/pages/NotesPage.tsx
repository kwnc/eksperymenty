import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';
import { Button } from '../components/ui/Button';
import type { Note } from '../types';

export const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { notes, loadNotes, createNote, deleteNote, setCurrentNote } = useNotesStore();
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = async () => {
    const newNote = await createNote({
      title: 'Untitled Note',
      content: '',
    });
    setCurrentNote(newNote);
    navigate('/editor');
  };

  const handleNoteClick = (note: Note) => {
    setCurrentNote(note);
    navigate('/editor');
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getPreview = (content: string) => {
    // Strip HTML tags and get first 100 characters
    const text = content.replace(/<[^>]*>/g, '');
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Notes</h1>
          <p className="text-gray-600 mt-1">{notes.length} notes</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="updatedAt">Last Modified</option>
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <Button onClick={handleCreateNote}>
            + New Note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first note</p>
          <Button onClick={handleCreateNote}>Create Your First Note</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleNoteClick(note)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 truncate flex-1">
                  {note.title || 'Untitled'}
                </h3>
                <button
                  onClick={(e) => handleDeleteNote(e, note.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {getPreview(note.content) || 'No content'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(note.updatedAt)}</span>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex space-x-1">
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-gray-400">+{note.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};