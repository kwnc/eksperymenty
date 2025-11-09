import React from 'react';
import { SearchBar } from './SearchBar';
import { StorageIndicator } from './StorageIndicator';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Notes App</h1>
        </div>

        <div className="flex items-center space-x-4">
          <SearchBar />
          <StorageIndicator />
        </div>
      </div>
    </header>
  );
};