import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { WizardShell } from './components/wizard/WizardShell';
import { ProvisioningPanel } from './components/provisioning/ProvisioningPanel';

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/wizard" element={<WizardShell />} />
        <Route path="/wizard/provisioning" element={<ProvisioningPanel />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
