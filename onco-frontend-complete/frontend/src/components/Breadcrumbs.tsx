import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { appRoutes } from '../pages/WireframeShell';

const segmentLabelMap: Record<string, string> = {
  patients: 'Patients',
  oncology: 'Diagnosis Confirmed',
  medications: 'Medications',
  allergies: 'Allergies',
  conditions: 'Chronic Conditions',
  vitals: 'Vitals',
  lifestyle: 'Lifestyle Information',
  'medical-history': 'Medical Histories',
  hospital: 'Hospital',
  imaging: 'Imaging',
  followups: 'Follow-ups',
  'payer-submissions': 'Payer Submissions',
  treatments: 'Treatments',
  calendar: 'Calendar',
  symptoms: 'Symptom Reports',
  analytics: 'Analytics',
  drilldown: 'Drilldown',
  audit: 'Audit',
  logs: 'Logs',
  superadmin: 'Super Admin',
  hospitals: 'Hospitals',
  users: 'Users',
  patient: 'Patient',
  dashboard: 'Dashboard',
  profile: 'Profile',
  'treatment-plan': 'Treatment Plan',
  'chemo-schedule': 'Chemo Schedule',
  'health-metrics': 'Health Metrics',
  documents: 'Documents',
  add: 'Add',
  edit: 'Edit',
};

const routeTitleMap = new Map(appRoutes.map((route) => [route.path, route.title]));

function prettifySegment(segment: string) {
  if (routeTitleMap.has(segment)) return routeTitleMap.get(segment) as string;
  if (segmentLabelMap[segment]) return segmentLabelMap[segment];
  if (/^\d+$/.test(segment)) return `#${segment}`;
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Breadcrumbs() {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '/login') return null;

  const parts = cleanPath.split('/').filter(Boolean);
  const crumbs = parts.map((segment, index) => {
    const to = `/${parts.slice(0, index + 1).join('/')}`;
    const fullRouteTitle = routeTitleMap.get(parts.slice(0, index + 1).join('/'));
    return {
      to,
      label: fullRouteTitle || prettifySegment(segment),
      current: index === parts.length - 1,
    };
  });

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/" className="breadcrumb-link breadcrumb-home">Home</Link>
      {crumbs.map((crumb) => (
        <Fragment key={crumb.to}>
          <span className="breadcrumb-separator">
            <i className="fas fa-chevron-right" />
          </span>
          {crumb.current ? (
            <span className="breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link to={crumb.to} className="breadcrumb-link">{crumb.label}</Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
