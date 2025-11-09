import React, { useState } from 'react';
import { useNotesStore } from '../stores/notesStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { exportUtils } from '../utils/export';

export const SettingsPage: React.FC = () => {
  const { storageQuota, exportData, importData, notes, folders } = useNotesStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'csv'>('json');

  const handleExport = async (format: 'json' | 'markdown' | 'csv' = exportFormat) => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      switch (format) {
        case 'json': {
          const data = await exportData();
          exportUtils.downloadFile(
            JSON.stringify(data, null, 2),
            `notes-backup-${dateStr}.json`,
            'application/json'
          );
          break;
        }
        case 'markdown': {
          const markdown = exportUtils.exportToMarkdown(notes, folders);
          exportUtils.downloadFile(
            markdown,
            `notes-export-${dateStr}.md`,
            'text/markdown'
          );
          break;
        }
        case 'csv': {
          const csv = exportUtils.exportToCSV(notes);
          exportUtils.downloadFile(
            csv,
            `notes-export-${dateStr}.csv`,
            'text/csv'
          );
          break;
        }
      }

      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsLoading(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      // Validate the data structure
      if (!data.notes || !data.folders) {
        throw new Error('Invalid backup file format');
      }

      await importData(data);
      alert('Import successful! Your notes have been imported.');
      setIsImportModalOpen(false);
      setImportFile(null);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getUsagePercentage = () => {
    if (!storageQuota || storageQuota.quota === 0) return 0;
    return Math.round((storageQuota.usage / storageQuota.quota) * 100);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your notes and application settings</p>
      </div>

      {/* Storage Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Storage Information</h2>
        {storageQuota ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Storage Usage</span>
              <span className="text-sm text-gray-600">
                {formatBytes(storageQuota.usage)} / {formatBytes(storageQuota.quota)}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  getUsagePercentage() >= 90 ? 'bg-red-500' :
                  getUsagePercentage() >= 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
              />
            </div>

            <div className="text-sm text-gray-600">
              {getUsagePercentage()}% of available storage used
            </div>

            {getUsagePercentage() >= 75 && (
              <div className={`p-3 rounded-md ${
                getUsagePercentage() >= 90 ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
              }`}>
                <p className="text-sm">
                  {getUsagePercentage() >= 90
                    ? 'Storage is almost full. Consider exporting and deleting old notes.'
                    : 'Storage is getting full. Consider backing up your notes.'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Storage information not available</p>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-600">
                Download all your notes and folders as a JSON file
              </p>
            </div>
            <Button
              onClick={() => setIsExportModalOpen(true)}
              variant="outline"
            >
              Export
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Import Data</h3>
                <p className="text-sm text-gray-600">
                  Import notes and folders from a backup file
                </p>
              </div>
              <Button
                onClick={() => setIsImportModalOpen(true)}
                variant="outline"
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Notes App</strong> - A local-first note-taking application</p>
          <p>Version: 1.0.0</p>
          <p>All your data is stored locally in your browser using IndexedDB</p>
          <p>No data is sent to external servers</p>
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Data"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Choose a format to export your notes and folders.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="json">JSON (Full backup - recommended)</option>
              <option value="markdown">Markdown (.md file)</option>
              <option value="csv">CSV (Metadata only)</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {exportFormat === 'json' && 'Complete backup that can be imported back into the app.'}
            {exportFormat === 'markdown' && 'Human-readable format suitable for other applications.'}
            {exportFormat === 'csv' && 'Spreadsheet format with note metadata and preview.'}
          </div>

          <div className="flex space-x-3">
            <Button onClick={() => handleExport()}>
              Export {exportFormat.toUpperCase()}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data"
      >
        <div className="space-y-4">
          <p className="text-red-600 text-sm">
            <strong>Warning:</strong> This will replace all your current notes and folders.
            Make sure to export your current data first if you want to keep it.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select backup file
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleImport}
              disabled={!importFile || isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Data'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};