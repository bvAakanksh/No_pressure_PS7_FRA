import { createBrowserRouter } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import OverviewPage from './pages/OverviewPage';
import ClaimsPage from './pages/ClaimsPage';
import RiskAnomaliesPage from './pages/RiskAnomaliesPage';
import DistrictsPage from './pages/DistrictsPage';
import AnalysisPage from './pages/AnalysisPage';
import SettingsPage from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: OverviewPage },
      { path: 'claims', Component: ClaimsPage },
      { path: 'claims/:claimId', Component: ClaimsPage },
      { path: 'risk-anomalies', Component: RiskAnomaliesPage },
      { path: 'districts', Component: DistrictsPage },
      { path: 'analysis', Component: AnalysisPage },
      { path: 'settings', Component: SettingsPage },
    ],
  },
]);
