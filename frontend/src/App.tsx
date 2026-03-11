import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import Layout from './components/Layout';
import AppChrome from './components/AppChrome';
import GlobalLoader from './components/GlobalLoader';
import { useConfirm } from './hooks/useConfirm';
import LoginPage from './pages/LoginPage';
import { AppShellPage, appRoutes, getDefaultRouteForRole } from './pages/WireframeShell';
import PatientListPage from './pages/patients/PatientListPage';
import PatientFormPage from './pages/patients/PatientFormPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import OncologyListPage from './pages/oncology/OncologyListPage';
import OncologyDetailPage from './pages/oncology/OncologyDetailPage';
import RecordFormPage from './pages/oncology/RecordFormPage';
import MedicationListPage from './pages/medications/MedicationListPage';
import AllergyListPage from './pages/allergies/AllergyListPage';
import ConditionListPage from './pages/conditions/ConditionListPage';
import VitalsListPage from './pages/vitals/VitalsListPage';
import LifestyleListPage from './pages/lifestyle/LifestyleListPage';
import MedicalHistoryListPage from './pages/medical-history/MedicalHistoryListPage';
import PayerListPage from './pages/oncology/PayerListPage';
import TreatmentListPage from './pages/oncology/TreatmentListPage';
import SymptomListPage from './pages/oncology/SymptomListPage';
import TreatmentCalendarPage from './pages/oncology/TreatmentCalendarPage';
import FollowupListPage from './pages/oncology/FollowupListPage';
import ImagingPage from './pages/oncology/ImagingPage';
import AnalyticsDrilldownPage from './pages/analytics/AnalyticsDrilldownPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import HospitalsPage from './pages/superadmin/HospitalsPage';
import UsersPage from './pages/superadmin/UsersPage';
import AnalyticsPage from './pages/superadmin/AnalyticsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  if (user) return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  return <>{children}</>;
}

function RoleAwareHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
}

function AppInner() {
  const { resolveConfirm } = useConfirm();

  return (
    <>
      <GlobalLoader />
      <AppChrome onConfirm={() => resolveConfirm(true)} onCancel={() => resolveConfirm(false)} />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<RoleAwareHome />} />

          <Route path="patients" element={<PatientListPage />} />
          <Route path="patients/add" element={<PatientFormPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="patients/:id/edit" element={<PatientFormPage />} />

          <Route path="oncology" element={<OncologyListPage />} />
          <Route path="oncology/add" element={<RecordFormPage />} />
          <Route path="oncology/:id" element={<OncologyDetailPage />} />
          <Route path="oncology/:id/edit" element={<RecordFormPage />} />

          <Route path="medications" element={<MedicationListPage />} />
          <Route path="allergies" element={<AllergyListPage />} />
          <Route path="conditions" element={<ConditionListPage />} />
          <Route path="vitals" element={<VitalsListPage />} />
          <Route path="lifestyle" element={<LifestyleListPage />} />
          <Route path="medical-history" element={<MedicalHistoryListPage />} />
          <Route path="hospital/dashboard" element={<DashboardPage />} />
          <Route path="hospital/imaging" element={<ImagingPage />} />
          <Route path="hospital/followups" element={<FollowupListPage />} />
          <Route path="payer-submissions" element={<PayerListPage />} />
          <Route path="treatments" element={<TreatmentListPage />} />
          <Route path="treatments/calendar" element={<TreatmentCalendarPage />} />
          <Route path="symptoms" element={<SymptomListPage />} />
          <Route path="analytics/drilldown" element={<AnalyticsDrilldownPage />} />
          <Route path="audit/logs" element={<AuditLogPage />} />
          <Route path="superadmin/hospitals" element={<HospitalsPage />} />
          <Route path="superadmin/users" element={<UsersPage />} />
          <Route path="superadmin/analytics" element={<AnalyticsPage />} />
          <Route path="superadmin/audit" element={<AuditLogPage />} />

          {appRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={<AppShellPage route={route} />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <NotificationsProvider>
          <AppInner />
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
