import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';
import { RichTextEditor } from '../components/RichTextEditor';
import { Button } from '../components/ui/Button';

export const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentNote, updateNote, folders } = useNotesStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setFolderId(currentNote.folderId || '');
      setTags(currentNote.tags?.join(', ') || '');
    }
  }, [currentNote]);

  useEffect(() => {
    // Auto-save functionality
    const saveTimer = setTimeout(() => {
      if (currentNote && (
        title !== currentNote.title ||
        content !== currentNote.content ||
        folderId !== (currentNote.folderId || '') ||
        tags !== (currentNote.tags?.join(', ') || '')
      )) {
        handleSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [title, content, folderId, tags, currentNote]);

  const handleSave = async () => {
    if (!currentNote) return;

    setIsSaving(true);
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      await updateNote(currentNote.id, {
        title: title || 'Untitled',
        content,
        folderId: folderId || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = () => {
    handleSave();
  };

  const handleBack = () => {
    navigate('/');
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return 'Saved just now';
    if (minutes < 60) return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `Saved at ${date.toLocaleTimeString()}`;
  };

  if (!currentNote) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No note selected</h3>
          <p className="text-gray-600 mb-6">Select a note to edit or create a new one</p>
          <Button onClick={() => navigate('/')}>Go to Notes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Notes
            </Button>

            <div className="text-sm text-gray-500">
              {isSaving && 'Saving...'}
              {!isSaving && lastSaved && formatLastSaved(lastSaved)}
              {!isSaving && !lastSaved && 'Not saved'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleManualSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Folder
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your note..."
          className="h-full"
        />
      </div>
    </div>
  );
};