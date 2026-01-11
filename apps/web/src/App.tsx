import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import WorkflowList from './pages/WorkflowList';
import WorkflowEditor from './pages/WorkflowEditor';
import ExecutionHistory from './pages/ExecutionHistory';
import Connectors from './pages/Connectors';
import Triggers from './pages/Triggers';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workflows" element={<WorkflowList />} />
        <Route path="workflows/:id" element={<WorkflowEditor />} />
        <Route path="executions" element={<ExecutionHistory />} />
        <Route path="connectors" element={<Connectors />} />
        <Route path="triggers" element={<Triggers />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
