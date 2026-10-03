import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AddJob } from './pages/AddJob';
import { Applications } from './pages/Applications';
import { Dashboard } from './pages/Dashboard';
import { EditJob } from './pages/EditJob';
import { ImproveMatch } from './pages/ImproveMatch';
import { JobAnalysis } from './pages/JobAnalysis';
import { JobMatches } from './pages/JobMatches';
import { NotFound } from './pages/NotFound';
import { Resume } from './pages/Resume';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="resume" element={<Resume />} />
          <Route path="jobs/new" element={<AddJob />} />
          <Route path="jobs/:id/edit" element={<EditJob />} />
          <Route path="jobs/:id/improve" element={<ImproveMatch />} />
          <Route path="jobs/:id" element={<JobAnalysis />} />
          <Route path="matches" element={<JobMatches />} />
          <Route path="applications" element={<Applications />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
