import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import AppLayout from './components/layout/AppLayout';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ClaimsPage = lazy(() => import('./pages/ClaimsPage'));
const RiskAnomaliesPage = lazy(() => import('./pages/RiskAnomaliesPage'));
const DistrictsPage = lazy(() => import('./pages/DistrictsPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

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
