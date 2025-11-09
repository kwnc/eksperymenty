import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { createNote, setCurrentNote } = useNotesStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input/textarea/contenteditable
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isInputFocused) return;

      // Cmd/Ctrl + N: New note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewNote();
      }

      // Cmd/Ctrl + /: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape: Go back to notes list
      if (e.key === 'Escape') {
        navigate('/');
      }

      // Cmd/Ctrl + Shift + F: Go to folders
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        navigate('/folders');
      }

      // Cmd/Ctrl + ,: Go to settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      }
    };

    const handleNewNote = async () => {
      try {
        const newNote = await createNote({
          title: 'Untitled Note',
          content: '',
        });
        setCurrentNote(newNote);
        navigate('/editor');
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, createNote, setCurrentNote]);
};