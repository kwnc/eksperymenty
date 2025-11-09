import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';
import { FolderTree } from './FolderTree';
import { Button } from './ui/Button';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { createNote, createFolder } = useNotesStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateNote = async () => {
    await createNote({
      title: 'Untitled Note',
      content: '',
      folderId: undefined,
    });
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder({
        name: newFolderName.trim(),
        parentId: undefined,
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const navItems = [
    { path: '/', label: 'All Notes', icon: '📄' },
    { path: '/folders', label: 'Folders', icon: '📁' },
    { path: '/search', label: 'Search', icon: '🔍' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2">
          <Button
            onClick={handleCreateNote}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            + New Note
          </Button>

          {!isCreatingFolder ? (
            <Button
              onClick={() => setIsCreatingFolder(true)}
              variant="outline"
              className="w-full"
            >
              + New Folder
            </Button>
          ) : (
            <div className="flex space-x-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                autoFocus
              />
              <Button
                onClick={handleCreateFolder}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ✓
              </Button>
              <Button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                size="sm"
                variant="outline"
              >
                ✕
              </Button>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Folders
          </h3>
          <FolderTree />
        </div>
      </nav>
    </aside>
  );
};