import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export const Layout: React.FC = () => {
  useKeyboardShortcuts();
  const { isOffline } = useOfflineStatus();

  return (
    <div className="flex h-screen bg-gray-50">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          You are currently offline. Your notes are saved locally and will sync when you reconnect.
        </div>
      )}

      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-auto ${isOffline ? 'mt-10' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};