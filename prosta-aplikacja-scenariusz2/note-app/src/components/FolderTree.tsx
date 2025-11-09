import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';
import type { Folder } from '../types';

interface FolderItemProps {
  folder: Folder;
  level: number;
  onFolderSelect: (folder: Folder) => void;
  onFolderDelete: (folder: Folder) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  level,
  onFolderSelect,
  onFolderDelete,
}) => {
  const { folders } = useNotesStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const { updateFolder } = useNotesStore();

  const subfolders = folders.filter(f => f.parentId === folder.id);
  const hasSubfolders = subfolders.length > 0;

  const handleSave = async () => {
    if (editName.trim() && editName !== folder.name) {
      await updateFolder(folder.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasSubfolders && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}

        <span className="text-sm">📁</span>

        {isEditing ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm border border-gray-300 rounded px-1"
            autoFocus
          />
        ) : (
          <span
            onClick={() => onFolderSelect(folder)}
            className="flex-1 text-sm text-gray-700 hover:text-gray-900"
          >
            {folder.name}
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete folder "${folder.name}"? This will also delete all notes in this folder.`)) {
                onFolderDelete(folder);
              }
            }}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            🗑️
          </button>
        </div>
      </div>

      {isExpanded && hasSubfolders && (
        <div>
          {subfolders.map(subfolder => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              onFolderSelect={onFolderSelect}
              onFolderDelete={onFolderDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC = () => {
  const navigate = useNavigate();
  const { folders, loadFolders, deleteFolder, setCurrentFolder } = useNotesStore();

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const rootFolders = folders.filter(folder => !folder.parentId);

  const handleFolderSelect = (folder: Folder) => {
    setCurrentFolder(folder);
    navigate(`/folders/${folder.id}`);
  };

  const handleFolderDelete = async (folder: Folder) => {
    await deleteFolder(folder.id);
  };

  if (folders.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No folders yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootFolders.map(folder => (
        <div key={folder.id} className="group">
          <FolderItem
            folder={folder}
            level={0}
            onFolderSelect={handleFolderSelect}
            onFolderDelete={handleFolderDelete}
          />
        </div>
      ))}
    </div>
  );
};