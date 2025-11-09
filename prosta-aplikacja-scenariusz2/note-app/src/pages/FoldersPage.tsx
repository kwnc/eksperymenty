import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';
import { Button } from '../components/ui/Button';

export const FoldersPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const {
    folders,
    notes,
    currentFolder,
    loadFolders,
    loadNotes,
    setCurrentFolder,
    setCurrentNote,
    createNote,
    deleteNote,
  } = useNotesStore();

  useEffect(() => {
    loadFolders();
    loadNotes();
  }, [loadFolders, loadNotes]);

  useEffect(() => {
    if (folderId) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        setCurrentFolder(folder);
      }
    } else {
      setCurrentFolder(null);
    }
  }, [folderId, folders, setCurrentFolder]);

  const handleCreateNote = async () => {
    const newNote = await createNote({
      title: 'Untitled Note',
      content: '',
      folderId: currentFolder?.id,
    });
    setCurrentNote(newNote);
    navigate('/editor');
  };

  const handleNoteClick = (note: any) => {
    setCurrentNote(note);
    navigate('/editor');
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

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
    const text = content.replace(/<[^>]*>/g, '');
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  // Get notes for current folder
  const folderNotes = currentFolder
    ? notes.filter(note => note.folderId === currentFolder.id)
    : notes.filter(note => !note.folderId);

  // Get subfolders
  const subfolders = currentFolder
    ? folders.filter(folder => folder.parentId === currentFolder.id)
    : folders.filter(folder => !folder.parentId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            {currentFolder ? (
              <>
                <button
                  onClick={() => navigate('/folders')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  All Folders
                </button>
                <span className="text-gray-400">/</span>
                <h1 className="text-2xl font-bold text-gray-900">{currentFolder.name}</h1>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">All Folders</h1>
            )}
          </div>
          <p className="text-gray-600">
            {subfolders.length} folders, {folderNotes.length} notes
          </p>
        </div>

        <Button onClick={handleCreateNote}>
          + New Note {currentFolder && `in ${currentFolder.name}`}
        </Button>
      </div>

      {/* Subfolders */}
      {subfolders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Folders</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subfolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => navigate(`/folders/${folder.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📁</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{folder.name}</h3>
                    <p className="text-sm text-gray-500">
                      {notes.filter(note => note.folderId === folder.id).length} notes
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Notes {currentFolder && `in ${currentFolder.name}`}
        </h2>

        {folderNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notes {currentFolder ? `in ${currentFolder.name}` : 'in root folder'}
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first note {currentFolder && `in this folder`}
            </p>
            <Button onClick={handleCreateNote}>Create Note</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {folderNotes.map((note) => (
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
    </div>
  );
};