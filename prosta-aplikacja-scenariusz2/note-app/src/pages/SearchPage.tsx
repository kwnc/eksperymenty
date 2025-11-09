import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, searchResults, isLoading, setCurrentNote } = useNotesStore();

  const handleNoteClick = (noteId: string) => {
    const note = searchResults.find(result => result.note.id === noteId)?.note;
    if (note) {
      setCurrentNote(note);
      navigate('/editor');
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (!searchQuery) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search your notes</h3>
          <p className="text-gray-600">Use the search bar above to find notes by title, content, or tags</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
        <p className="text-gray-600 mt-1">
          {isLoading ? 'Searching...' : `${searchResults.length} results for "${searchQuery}"`}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Searching...</p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">😔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try searching with different keywords</p>
        </div>
      ) : (
        <div className="space-y-4">
          {searchResults.map((result) => (
            <div
              key={result.note.id}
              onClick={() => handleNoteClick(result.note.id)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-lg">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightText(result.note.title || 'Untitled', searchQuery)
                    }}
                  />
                </h3>
                <div className="text-sm text-gray-500">
                  {formatDate(result.note.updatedAt)}
                </div>
              </div>

              <p
                className="text-gray-600 mb-3"
                dangerouslySetInnerHTML={{
                  __html: highlightText(result.matchedContent, searchQuery)
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {result.note.tags && result.note.tags.length > 0 && (
                    <div className="flex space-x-1">
                      {result.note.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(tag, searchQuery)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">
                    Relevance: {Math.round(result.relevanceScore)}%
                  </div>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};