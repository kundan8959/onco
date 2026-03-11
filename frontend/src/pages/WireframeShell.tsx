import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { overviewApi } from '../api';
import InlineNotice from '../components/InlineNotice';
import { useAuth } from '../context/AuthContext';

type Role = 'superadmin' | 'hospital' | 'patient';
type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple';
type Metric = { label: string; value: string; tone?: Tone };
type RouteConfig = {
  path: string;
  label: string;
  roles: Role[];
  title: string;
  subtitle: string;
  heroTitle: string;
  heroText: string;
  metrics: Metric[];
  panels: { title: string; items: string[] }[];
  table?: { title: string; columns: string[]; rows: string[][] };
  actions?: string[];
};

type DynamicPayload = Partial<Pick<RouteConfig, 'metrics' | 'table'>> | null;

const toneClass: Record<Tone, string> = {
  blue: 'tone-blue', green: 'tone-green', amber: 'tone-amber', red: 'tone-red', purple: 'tone-purple',
};

export const appRoutes: RouteConfig[] = [
  { path: 'superadmin/dashboard', label: 'Dashboard', roles: ['superadmin'], title: 'Superadmin Dashboard', subtitle: 'Global command center for hospitals, users, analytics, and audit visibility.', heroTitle: 'Platform health at a glance', heroText: 'System-wide hospitals, users, patient volume, and quick navigation into platform operations.', metrics: [{ label: 'Total Hospitals', value: '24', tone: 'blue' }, { label: 'Platform Users', value: '1,847', tone: 'green' }, { label: 'Active Patients', value: '12,340', tone: 'purple' }, { label: 'System Uptime', value: '98.7%', tone: 'amber' }], panels: [{ title: 'Core Tabs', items: ['Hospital Management', 'Users', 'Analytics', 'Audit Logs', 'System Config'] }, { title: 'Key Actions', items: ['Create hospital tenant', 'Activate/deactivate hospital', 'Review global analytics', 'Audit role and report activity'] }], actions: ['Add Hospital', 'Review Analytics', 'Open Audit Log'] },
  { path: 'superadmin/hospitals', label: 'Hospitals', roles: ['superadmin'], title: 'Hospital Management', subtitle: 'Tenant registry with status, patient count, admins, and growth signals.', heroTitle: 'All hospital tenants in one place', heroText: 'Cleaner management shell ready for live CRUD wiring.', metrics: [{ label: 'Active Tenants', value: '19', tone: 'green' }, { label: 'Inactive', value: '5', tone: 'red' }, { label: 'Avg Patients / Hospital', value: '514', tone: 'blue' }, { label: 'AI-enabled Sites', value: '16', tone: 'purple' }], panels: [{ title: 'Management Features', items: ['Search hospitals', 'Tenant status control', 'Hospital-level metrics', 'Hospital drill-down view'] }, { title: 'Future Wiring', items: ['Hospital CRUD', 'Onboarding workflow', 'Billing status', 'Hospital-scoped audit view'] }], actions: ['Create Tenant', 'Invite Hospital Admin', 'Export Registry'] },
  { path: 'superadmin/users', label: 'Users', roles: ['superadmin'], title: 'Platform Users', subtitle: 'Centralized access management for superadmin, hospital, and patient accounts.', heroTitle: 'Three-role access model', heroText: 'Only your requested roles, with the operational surface preserved.', metrics: [{ label: 'Superadmins', value: '3', tone: 'blue' }, { label: 'Hospitals', value: '24', tone: 'green' }, { label: 'Patients', value: '12,340', tone: 'purple' }, { label: 'Suspended Accounts', value: '18', tone: 'red' }], panels: [{ title: 'User Controls', items: ['Create accounts', 'Reset credentials', 'Activate/deactivate users', 'Review role assignments'] }, { title: 'Role Mapping', items: ['Superadmin = platform owner', 'Hospital = merged internal clinical workspace', 'Patient = self-service portal'] }], actions: ['Create User', 'Filter by Role', 'Reset Password'] },
  { path: 'superadmin/analytics', label: 'Analytics', roles: ['superadmin'], title: 'Global Analytics', subtitle: 'Platform-level trends: outcomes, AI performance, ER events, and throughput.', heroTitle: 'Cross-hospital oncology analytics', heroText: 'KPI shell for benchmark charts and comparison views.', metrics: [{ label: 'AI Accuracy', value: '94.2%', tone: 'green' }, { label: 'Reports Analyzed', value: '4,821', tone: 'blue' }, { label: 'ER Visit Rate', value: '3.2%', tone: 'amber' }, { label: 'Chemo Completion', value: '78%', tone: 'purple' }], panels: [{ title: 'Charts', items: ['Patients by cancer type', 'AI performance by hospital', 'Chemo completion trends', 'ER visits per 100 cycles'] }, { title: 'Backend Wiring', items: ['Benchmark APIs', 'Hospital ranking queries', 'Cancer cohort filters', 'Exportable dashboards'] }], actions: ['Compare Hospitals', 'Download Analytics', 'Open AI Metrics'] },
  { path: 'superadmin/audit', label: 'Audit Logs', roles: ['superadmin'], title: 'Audit Logs & Activity', subtitle: 'Security and workflow traceability for critical events.', heroTitle: 'Everything important is traceable', heroText: 'Audit shell with filters, stats, and recent activity.', metrics: [{ label: 'Events Today', value: '2,847', tone: 'blue' }, { label: 'Failed Logins', value: '14', tone: 'red' }, { label: 'AI Approvals', value: '342', tone: 'green' }, { label: 'Data Exports', value: '89', tone: 'amber' }], panels: [{ title: 'Tracked Events', items: ['Login / logout', 'AI approval', 'Data export', 'User creation', 'Role/status change'] }, { title: 'Compliance Use', items: ['Operational audit trail', 'Access review', 'AI decision history', 'Incident triage'] }], actions: ['Filter Events', 'Export Logs', 'Investigate Failures'] },
  { path: 'hospital/dashboard', label: 'Dashboard', roles: ['hospital'], title: 'Hospital Operations Dashboard', subtitle: 'Merged doctor + nurse + chemist + admin workspace.', heroTitle: 'Single hospital control room', heroText: 'One Hospital role with all operational tabs.', metrics: [{ label: 'Active Patients', value: '487', tone: 'blue' }, { label: 'AI Pending', value: '8', tone: 'purple' }, { label: 'Chemo Today', value: '12', tone: 'green' }, { label: 'ER Alerts', value: '3', tone: 'red' }], panels: [{ title: 'Merged Capabilities', items: ['Patient registry', 'AI report review', 'Treatment planning', 'Chemo sessions', 'Vitals & meds', 'ER logging', 'Reports'] }, { title: 'Primary Workflows', items: ['Upload report → AI review', 'Update oncology record', 'Schedule chemo', 'Track medication queue'] }], actions: ['Register Patient', 'Upload AI Report', 'Open Chemo Board'] },
  { path: 'hospital/patients', label: 'Patients', roles: ['hospital'], title: 'Patient Registry', subtitle: 'Patient list, filters, status, cancer type, stage, and treatment progress.', heroTitle: 'Registry shaped for hospital use', heroText: 'Hospital-level oncology registry.', metrics: [{ label: 'My/Active Patients', value: '42', tone: 'blue' }, { label: 'Critical Alerts', value: '2', tone: 'red' }, { label: 'AI Pending Review', value: '5', tone: 'purple' }, { label: 'Sessions This Week', value: '28', tone: 'green' }], panels: [{ title: 'Filters', items: ['Cancer Type', 'Stage', 'Active Treatment', 'Follow-up', 'AI Pending'] }, { title: 'Actions', items: ['New patient intake', 'Open oncology record', 'Review AI output', 'Track next session'] }], actions: ['Add Patient', 'Advanced Filter', 'Export Patient List'] },
  { path: 'hospital/oncology-records', label: 'Oncology', roles: ['hospital'], title: 'Oncology Records', subtitle: 'Diagnosis details, biomarkers, AJCC staging, and roadmap-ready disease records.', heroTitle: 'Clinical oncology record workspace', heroText: 'Unified disease record workspace.', metrics: [{ label: 'Breast Cases', value: '142', tone: 'purple' }, { label: 'Prostate Cases', value: '96', tone: 'blue' }, { label: 'Lung Cases', value: '71', tone: 'amber' }, { label: 'Colorectal Cases', value: '58', tone: 'green' }], panels: [{ title: 'Record Blocks', items: ['Diagnosis details', 'Biomarkers', 'TNM staging', 'AJCC stage', 'Treatment roadmap'] }, { title: 'AI-enhanced Fields', items: ['Pathology extraction', 'Stage calculation', 'Roadmap generation', 'Hospital review flow'] }], actions: ['Create Record', 'Open AJCC Panel', 'Generate Roadmap'] },
  { path: 'hospital/ai-reports', label: 'AI Reports', roles: ['hospital'], title: 'AI Report Analysis', subtitle: 'Track OCR + AI extraction progress and approvals.', heroTitle: 'Upload → OCR → LLM → stage → approve', heroText: 'Preserves the important AI flow.', metrics: [{ label: 'Reports Today', value: '26', tone: 'blue' }, { label: 'Awaiting Approval', value: '8', tone: 'amber' }, { label: 'Auto-created Records', value: '5', tone: 'green' }, { label: 'Failed Processing', value: '1', tone: 'red' }], panels: [{ title: 'Pipeline Stages', items: ['File validation', 'OCR text extraction', 'Groq analysis', 'AJCC staging', 'Auto-populate records'] }, { title: 'Review Actions', items: ['Approve & populate', 'Reject extraction', 'Retry AI processing', 'Compare source vs extracted'] }], actions: ['Upload Report', 'Retry Failed', 'Review Extracted Data'] },
  { path: 'hospital/treatment-plans', label: 'Treatment', roles: ['hospital'], title: 'Treatment Plans & AJCC Staging', subtitle: 'Protocol assignment, treatment intent, roadmap review, and planning.', heroTitle: 'Treatment planning from diagnosis to protocol', heroText: 'Room for AI-guided roadmap output.', metrics: [{ label: 'Plans in Progress', value: '132', tone: 'blue' }, { label: 'Roadmaps Generated', value: '78', tone: 'green' }, { label: 'Urgent Reviews', value: '6', tone: 'red' }, { label: 'Protocol Adherence', value: '95%', tone: 'purple' }], panels: [{ title: 'Plan Components', items: ['AJCC stage', 'Chemo protocol', 'Radiation plan', 'Targeted therapy', 'Supportive meds'] }, { title: 'Decision Support', items: ['AI roadmap', 'Stage-specific suggestions', 'Benchmark comparison', 'Follow-up monitoring'] }], actions: ['Save Plan', 'Print Plan', 'Compare with AI'] },
  { path: 'hospital/chemo-schedule', label: 'Chemo Schedule', roles: ['hospital'], title: 'Chemo Schedule & Session Board', subtitle: 'Session queue, readiness, delays, and schedule visibility.', heroTitle: 'Operational chemo calendar', heroText: 'Combines views into one hospital screen.', metrics: [{ label: 'Sessions Today', value: '18', tone: 'blue' }, { label: 'Pre-Chemo Pending', value: '3', tone: 'amber' }, { label: 'Completed', value: '7', tone: 'green' }, { label: 'Delayed', value: '1', tone: 'red' }], panels: [{ title: 'Board Widgets', items: ['Today queue', 'Cycle count', 'Next session cards', 'Delay notes', 'Checklist readiness'] }, { title: 'Future Engine', items: ['Auto-scheduling', 'Missed session detection', 'Conflict alerts', 'Patient reminders'] }], actions: ['Open Calendar', 'Log Delay', 'Clear for Chemo'] },
  { path: 'hospital/medications', label: 'Medications', roles: ['hospital'], title: 'Medication Queue & Verification', subtitle: 'Verification, dispensing, interaction review, and supportive meds.', heroTitle: 'Medication operations in one queue', heroText: 'Pharmacy workflows under Hospital role.', metrics: [{ label: 'Pending Verification', value: '14', tone: 'amber' }, { label: 'Ready to Dispense', value: '6', tone: 'green' }, { label: 'Interaction Alerts', value: '2', tone: 'red' }, { label: 'Dispensed Today', value: '89', tone: 'blue' }], panels: [{ title: 'Medication Tabs', items: ['Queue', 'Prescriptions', 'Interactions', 'Dispense Log', 'Emergency Meds', 'AI Extracted'] }, { title: 'Clinical Safety', items: ['Dose verification', 'Interaction warnings', 'ER med impact', 'Cross-check AI extraction'] }], actions: ['Verify All', 'Open Interaction Checker', 'Dispense Log'] },
  { path: 'hospital/imaging', label: 'Imaging', roles: ['hospital'], title: 'Imaging AI Workflow', subtitle: 'Upload imaging and radiology documents, run OCR/AI extraction, and review structured findings.', heroTitle: 'Imaging is already AI-aware in the Django backend', heroText: 'The Python backend treats imaging as MedicalReport-driven document analysis: upload PDF/JPG/PNG, extract text, run AI analysis, and surface structured imaging findings for oncology workflows.', metrics: [{ label: 'Supported Formats', value: 'PDF/JPG/PNG', tone: 'blue' }, { label: 'Imaging Types', value: 'CT/MRI/PET/X-Ray+', tone: 'purple' }, { label: 'Pipeline Statuses', value: '7', tone: 'green' }, { label: 'Auto Oncology Link', value: 'Yes', tone: 'amber' }], panels: [{ title: 'Django Imaging Flow', items: ['MedicalReport stores imaging uploads', 'OCR extracts text from scanned docs', 'AI builds extracted_data + insights + recommendations', 'Imaging findings feed oncology review'] }, { title: 'Detected Backend Types', items: ['X-Ray', 'CT Scan', 'MRI Scan', 'PET Scan', 'Mammography', 'Other Imaging/Radiology'] }], actions: ['Upload Document', 'View AI Insights', 'Review Extracted Data'] },
  { path: 'hospital/followups', label: 'Follow-ups', roles: ['hospital'], title: 'Oncology Follow-ups', subtitle: 'Track post-diagnosis visits, recurrence review, imaging summaries, tumor markers, and next-step notes.', heroTitle: 'Follow-ups stay inside the oncology loop', heroText: 'The Django backend already has OncologyFollowUp with follow-up date, recurrence flags, imaging summary, tumor markers, and notes. This overview anchors the workflow until a dedicated page is split out.', metrics: [{ label: 'Follow-ups Due', value: '14', tone: 'amber' }, { label: 'Recurrence Flags', value: '3', tone: 'red' }, { label: 'Imaging Reviews', value: '9', tone: 'blue' }, { label: 'Closed Visits', value: '22', tone: 'green' }], panels: [{ title: 'Captured Fields', items: ['Follow-up date', 'Recurrence detected', 'Imaging summary', 'Tumor marker summary', 'Clinical notes'] }, { title: 'Backend Status', items: ['Django model exists', 'API route exists', 'Ordering by latest follow-up', 'Can be split into a dedicated UI next'] }], actions: ['See full flow'] },
  { path: 'hospital/er-tracking', label: 'Symptom Report', roles: ['hospital'], title: 'Symptom Report', subtitle: 'Track symptom events, severity, progression, and follow-up within Oncology.', heroTitle: 'Symptoms belong inside the oncology workflow', heroText: 'Symptom Report replaces generic ER-style labeling and keeps monitoring tied directly to oncology care.', metrics: [{ label: 'Symptom Reports This Month', value: '27', tone: 'red' }, { label: 'Critical Cases', value: '4', tone: 'amber' }, { label: 'Post-Chemo Alerts', value: '9', tone: 'purple' }, { label: 'Resolved', value: '21', tone: 'green' }], panels: [{ title: 'Captured Fields', items: ['Symptom name', 'Severity', 'Progression', 'Pain score', 'Onset date', 'Follow-up actions'] }, { title: 'Notifications', items: ['Alert oncologist', 'Notify patient', 'Escalate urgent review', 'Flag treatment changes'] }], actions: ['Add Symptom Report', 'Review Alerts'] },
  { path: 'hospital/analytics', label: 'Analytics', roles: ['hospital'], title: 'Hospital Analytics', subtitle: 'Tumor markers, chemo completion, AI performance, ER trends, and benchmarks.', heroTitle: 'Benchmark-rich hospital dashboard', heroText: 'Charts once data APIs expand.', metrics: [{ label: 'Chemo Completion', value: '78%', tone: 'green' }, { label: 'Missed Session Rate', value: '4.1%', tone: 'amber' }, { label: 'AI Extraction Accuracy', value: '95.3%', tone: 'purple' }, { label: 'ER Visits / 100 Cycles', value: '3.2', tone: 'red' }], panels: [{ title: 'Planned Visuals', items: ['Cancer-type donuts', 'Marker trend charts', 'AI processing time', 'Completion bars', 'ER reason charts'] }, { title: 'Who Uses This', items: ['Hospital operations', 'Clinical review', 'Quality assurance', 'Executive reporting'] }], actions: ['Compare Benchmarks', 'Download Report', 'Open Cancer Cohort'] },
  { path: 'patient/dashboard', label: 'Dashboard', roles: ['patient'], title: 'My Dashboard', subtitle: 'Treatment progress, next appointments, marker trends, and notifications.', heroTitle: 'Your treatment journey in one view', heroText: 'Cleaner patient portal shell.', metrics: [{ label: 'Chemo Progress', value: '75%', tone: 'green' }, { label: 'Next Session', value: 'Mar 12 · 10:00', tone: 'blue' }, { label: 'Marker Trend', value: '↓ Improving', tone: 'purple' }, { label: 'Unread Alerts', value: '3', tone: 'amber' }], panels: [{ title: 'Home Cards', items: ['Treatment progress', 'Upcoming appointments', 'AI treatment summary', 'Notifications', 'Quick actions'] }, { title: 'What the patient sees', items: ['Plain-language summaries', 'Remaining cycles', 'Upcoming tests', 'Care-team reminders'] }], actions: ['View Schedule', 'Open Treatment Plan', 'Message Care Team'] },
  { path: 'patient/treatment-plan', label: 'Treatment Plan', roles: ['patient'], title: 'My Treatment Plan', subtitle: 'Stage summary, protocol, cycle timeline, roadmap, and intent in patient-friendly form.', heroTitle: 'Your plan, explained clearly', heroText: 'Readable plan structure.', metrics: [{ label: 'Cancer Stage', value: 'IIA', tone: 'blue' }, { label: 'Intent', value: 'Curative', tone: 'green' }, { label: 'Cycles Done', value: '6 of 8', tone: 'purple' }, { label: 'Expected Finish', value: 'Sep 2026', tone: 'amber' }], panels: [{ title: 'Plan Sections', items: ['Surgery', 'Chemotherapy', 'Targeted Therapy', 'Radiation', 'AI roadmap summary'] }, { title: 'Patient Actions', items: ['Download summary', 'See cycle details', 'Review medications', 'Prepare for next visit'] }], actions: ['Download Plan', 'See Cycle Timeline', 'View Medications'] },
  { path: 'patient/chemo-schedule', label: 'Chemo Schedule', roles: ['patient'], title: 'My Chemo Schedule', subtitle: 'Calendar-style schedule, session history, and pre-chemo requirements.', heroTitle: 'Know what happens next', heroText: 'Calendar-first patient experience.', metrics: [{ label: 'Upcoming Sessions', value: '2', tone: 'blue' }, { label: 'Completed', value: '6', tone: 'green' }, { label: 'Requirements Pending', value: '1', tone: 'amber' }, { label: 'Missed Sessions', value: '0', tone: 'purple' }], panels: [{ title: 'Schedule View', items: ['Month/week layout', 'Session details', 'Lab prerequisites', 'History log'] }, { title: 'Patient Help', items: ['Arrival reminders', 'Checklist visibility', 'Location/time clarity', 'Download schedule'] }], actions: ['View Calendar', 'Download Schedule', 'Prepare for Visit'] },
  { path: 'patient/health-metrics', label: 'Health Metrics', roles: ['patient'], title: 'My Health Metrics', subtitle: 'Tumor markers, symptom tracking, vitals, and response trends.', heroTitle: 'See progress over time', heroText: 'Marker charts and side-effect tracking.', metrics: [{ label: 'CA 15-3', value: '↓ 42%', tone: 'green' }, { label: 'Fatigue Score', value: '5/10', tone: 'amber' }, { label: 'Protocol Adherence', value: '95%', tone: 'blue' }, { label: 'Response', value: 'Good', tone: 'purple' }], panels: [{ title: 'Metric Widgets', items: ['Tumor marker trend', 'Side-effect severity', 'Vitals log', 'AI abnormal lab flags'] }, { title: 'Patient Controls', items: ['Log symptoms', 'Track weight', 'Review side effects', 'Download report'] }], actions: ['Log Symptoms', 'View Trend', 'Download Metrics'] },
  { path: 'patient/documents', label: 'Documents', roles: ['patient'], title: 'My Documents & Reports', subtitle: 'Reports, prescriptions, AI summaries, and uploaded documents.', heroTitle: 'All your reports in one place', heroText: 'Document center with AI status.', metrics: [{ label: 'Reports Available', value: '18', tone: 'blue' }, { label: 'AI Summaries', value: '7', tone: 'purple' }, { label: 'Pending Processing', value: '1', tone: 'amber' }, { label: 'Ready to Download', value: '17', tone: 'green' }], panels: [{ title: 'Document Types', items: ['Lab reports', 'Pathology', 'Imaging', 'Prescriptions', 'AI analysis output'] }, { title: 'Portal Actions', items: ['Upload document', 'Download PDF', 'View AI findings', 'Compare source and summary'] }], actions: ['Upload Document', 'View AI Insights', 'Download PDF'] },
  { path: 'patient/profile', label: 'Profile', roles: ['patient'], title: 'My Profile & Settings', subtitle: 'Personal information, emergency contacts, insurance, and notification preferences.', heroTitle: 'Keep your care profile up to date', heroText: 'Settings slide translated into an app page.', metrics: [{ label: 'Emergency Contacts', value: '1', tone: 'blue' }, { label: 'Insurance Status', value: 'Active', tone: 'green' }, { label: 'SMS Alerts', value: 'Enabled', tone: 'purple' }, { label: 'Profile Completion', value: '92%', tone: 'amber' }], panels: [{ title: 'Settings Blocks', items: ['Demographics', 'Emergency contacts', 'Insurance', 'Notification preferences', 'Password/security'] }, { title: 'Data Transparency', items: ['AI-populated field tags', 'Manual vs AI indicators', 'Contact update workflow', 'Channel preferences'] }], actions: ['Edit Profile', 'Add Emergency Contact', 'Update Insurance'] },
];

const fullFlowLinkMap: Record<string, string> = {
  'hospital/patients': '/patients',
  'hospital/oncology-records': '/oncology',
  'hospital/medications': '/medications',
  'hospital/chemo-schedule': '/treatments',
  'hospital/er-tracking': '/symptoms',
  'hospital/ai-reports': '/payer-submissions',
  'hospital/treatment-plans': '/oncology',
  'hospital/followups': '/oncology',
  'patient/profile': '/patients/1',
};

const actionLinkMap: Record<string, string> = {
  'Register Patient': '/patients/add',
  'Add Patient': '/patients/add',
  'Create Record': '/oncology/add',
  'Open Chemo Board': '/treatments',
  'Upload AI Report': '/payer-submissions',
  'Open Calendar': '/treatments/calendar',
  'Log Delay': '/treatments',
  'Verify All': '/medications',
  'Dispense Log': '/medications',
  'Log ER Visit': '/symptoms',
  'Add Symptom Report': '/symptoms',
  'Review Alerts': '/symptoms',
  'See full flow': '/patients',
  'Upload Document': '/hospital/imaging',
  'View AI Insights': '/hospital/imaging',
  'View Schedule': '/treatments',
  'Open Treatment Plan': '/oncology',
  'View Medications': '/medications',
  'Log Symptoms': '/symptoms',
  'Review Analytics': '/analytics/drilldown',
  'Open Audit Log': '/audit/logs',
  'Compare Hospitals': '/analytics/drilldown',
  'Open AI Metrics': '/analytics/drilldown',
  'Compare Benchmarks': '/analytics/drilldown',
  'Open Cancer Cohort': '/hospital/oncology-records',
  'Review Extracted Data': '/hospital/imaging',
  'Retry Failed': '/payer-submissions',
  'Generate Roadmap': '/oncology/add',
  'Compare with AI': '/oncology',
  'Add Emergency Contact': '/patients/1/edit',
  'Update Insurance': '/patients/1/edit',
  'Edit Profile': '/patients/1/edit',
};

export function getDefaultRouteForRole(role: Role) {
  if (role === 'superadmin') return '/superadmin/dashboard';
  if (role === 'hospital') return '/patients';
  return '/patient/dashboard';
}

export function AppShellPage({ route }: { route: RouteConfig }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dynamic, setDynamic] = useState<DynamicPayload>(null);
  const [notice, setNotice] = useState<string>('');

  useEffect(() => {
    let active = true;
    overviewApi.getPage(route.path).then((response) => {
      if (active) setDynamic(response.data || null);
    }).catch(() => {
      if (active) setDynamic(null);
    });
    return () => { active = false; };
  }, [route.path]);

  if (!user) return null;
  if (!route.roles.includes(user.role)) return <AccessDenied />;

  const metrics = dynamic?.metrics || route.metrics;
  const table = dynamic?.table || route.table;
  const fullFlowHref = fullFlowLinkMap[route.path];

  const onAction = (action: string) => {
    const href = actionLinkMap[action] || fullFlowHref;
    if (href) {
      navigate(href);
      return;
    }
    setNotice(`${action} is not fully implemented on this overview screen yet. A real module is linked wherever possible.`);
  };

  return (
    <div className="wireframe-page">
      <div className="page-topline">{route.title}</div>
      <div className="hero-card">
        <div>
          <div className="hero-kicker">{route.subtitle}</div>
          <h1>{route.heroTitle}</h1>
          <p>{route.heroText}</p>
        </div>
        <div className="hero-actions">
          {(route.actions || []).map((action) => (
            <button key={action} className="action-button" onClick={() => onAction(action)}>{action}</button>
          ))}
        </div>
      </div>

      {notice && <InlineNotice kind="warning" text={notice} />}

      <div className="metric-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className={`metric-card ${toneClass[metric.tone || 'blue']}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="panel-grid">
        {route.panels.map((panel) => (
          <section key={panel.title} className="info-panel">
            <div className="panel-title">{panel.title}</div>
            <ul>{panel.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ))}
      </div>

      {table && (
        <section className="data-card">
          <div className="data-card-header">
            <div>
              <h3>{table.title}</h3>
              <p>Live where backend data exists; full flow links now point to working pages.</p>
            </div>
            {fullFlowHref ? <Link to={fullFlowHref} className="mini-link">See full flow</Link> : <span className="mini-link">Overview</span>}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function AccessDenied() {
  const { user } = useAuth();
  return (
    <div className="empty-state">
      <h2>Access restricted</h2>
      <p>This tab belongs to another workspace. Signed in as <strong>{user?.role}</strong>.</p>
      <Link to={getDefaultRouteForRole((user?.role || 'patient') as Role)} className="action-button primary-link">Go to my dashboard</Link>
    </div>
  );
}
