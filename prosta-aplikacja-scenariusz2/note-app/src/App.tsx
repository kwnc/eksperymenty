import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NotesPage } from './pages/NotesPage';
import { EditorPage } from './pages/EditorPage';
import { SearchPage } from './pages/SearchPage';
import { FoldersPage } from './pages/FoldersPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<NotesPage />} />
          <Route path="editor" element={<EditorPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="folders" element={<FoldersPage />} />
          <Route path="folders/:folderId" element={<FoldersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
