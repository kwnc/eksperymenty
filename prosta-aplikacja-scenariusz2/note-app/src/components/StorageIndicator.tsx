import React, { useEffect } from 'react';
import { useNotesStore } from '../stores/notesStore';

export const StorageIndicator: React.FC = () => {
  const { storageQuota, updateStorageQuota } = useNotesStore();

  useEffect(() => {
    updateStorageQuota();
    // Update every 30 seconds
    const interval = setInterval(updateStorageQuota, 30000);
    return () => clearInterval(interval);
  }, [updateStorageQuota]);

  if (!storageQuota) return null;

  const usagePercentage = storageQuota.quota > 0
    ? Math.round((storageQuota.usage / storageQuota.quota) * 100)
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStorageColor = () => {
    if (usagePercentage >= 90) return 'text-red-600';
    if (usagePercentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className="flex items-center space-x-1">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              usagePercentage >= 90 ? 'bg-red-500' :
              usagePercentage >= 75 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <span className={`${getStorageColor()} font-medium`}>
          {formatBytes(storageQuota.usage)}
        </span>
        <span className="text-gray-500">
          / {formatBytes(storageQuota.quota)}
        </span>
      </div>
    </div>
  );
};