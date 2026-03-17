import { useMemo, useState } from 'react';
import './Layout.css';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appRoutes, getDefaultRouteForRole } from '../pages/WireframeShell';
import Breadcrumbs from './Breadcrumbs';
import NotificationBell from './NotificationBell';
import HospitalSwitcher from './HospitalSwitcher';
import { APP_NAME } from '../config';
import { useThemeLogo } from '../hooks/useThemeLogo';

const roleLabels = {
  superadmin: 'Superadmin Workspace',
  hospital: 'Hospital Workspace',
  patient: 'Patient Portal',
};

const roleIcons = {
  superadmin: 'fa-shield-halved',
  hospital: 'fa-hospital-user',
  patient: 'fa-user-heart',
};

const routeIconMap: Record<string, string> = {
  'superadmin/dashboard': 'fa-chart-line',
  'superadmin/hospitals': 'fa-hospital',
  'superadmin/users': 'fa-users-gear',
  'superadmin/analytics': 'fa-chart-pie',
  'superadmin/audit': 'fa-clipboard-list',
  'patient/dashboard': 'fa-house-medical',
  'patient/treatment-plan': 'fa-file-medical',
  'patient/chemo-schedule': 'fa-calendar-days',
  'patient/health-metrics': 'fa-heart-pulse',
  'patient/documents': 'fa-folder-open',
  'patient/profile': 'fa-id-card',
};

type NavItem = {
  path: string;
  label: string;
  title?: string;
  icon: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { logoSmall, logoFull } = useThemeLogo();

  const routes = useMemo(() => appRoutes.filter((route) => user && route.roles.includes(user.role)), [user]);

  const groupedRoutes = useMemo<NavGroup[]>(() => {
    if (!user) return [];

    if (user.role === 'superadmin') {
      return [{
        title: 'Platform',
        items: routes.map((route) => ({ path: `/${route.path}`, label: route.label, title: route.title, icon: routeIconMap[route.path] || 'fa-grid-2' })),
      }];
    }

    if (user.role === 'hospital') {
      return [
        {
          title: 'Patient Management',
          items: [
            { path: '/patients', label: 'Patients', title: 'Patient Registry', icon: 'fa-users' },
            { path: '/allergies', label: 'Allergies', title: 'Allergies', icon: 'fa-triangle-exclamation' },
            { path: '/medications', label: 'Medications', title: 'Medications', icon: 'fa-pills' },
            { path: '/conditions', label: 'Chronic Conditions', title: 'Chronic Conditions', icon: 'fa-notes-medical' },
            { path: '/vitals', label: 'Vitals', title: 'Vitals', icon: 'fa-heart-pulse' },
            { path: '/lifestyle', label: 'Lifestyle Information', title: 'Lifestyle Information', icon: 'fa-leaf' },
            { path: '/medical-history', label: 'Medical Histories', title: 'Medical Histories', icon: 'fa-file-waveform' },
            { path: '/hospital/imaging', label: 'Imaging', title: 'Imaging AI Workflow', icon: 'fa-x-ray' },
          ],
        },
        {
          title: 'Oncology',
          items: [
            { path: '/oncology', label: 'Diagnosis Confirmed', title: 'Diagnosis Confirmed', icon: 'fa-ribbon' },
            { path: '/hospital/followups', label: 'Follow-ups', title: 'Oncology Follow-ups', icon: 'fa-stethoscope' },
            { path: '/payer-submissions', label: 'Payer Submissions', title: 'Payer Submissions', icon: 'fa-file-invoice-dollar' },
            { path: '/symptoms', label: 'Symptom Reports', title: 'Symptom Reports', icon: 'fa-notes-medical' },
            { path: '/treatments', label: 'Treatments', title: 'Treatments', icon: 'fa-syringe' },
            { path: '/episodes', label: 'Episode Schedule', title: 'Episode Schedule', icon: 'fa-calendar-check' },
          ],
        },
      ];
    }

    return [{
      title: 'Patient Portal',
      items: routes.map((route) => ({ path: `/${route.path}`, label: route.label, title: route.title, icon: routeIconMap[route.path] || 'fa-user' })),
    }];
  }, [routes, user]);

  const currentNavItem = groupedRoutes
    .flatMap((group) => group.items)
    .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));

  if (!user) return null;

  return (
    <div className={`app-shell role-${user.role}`}>
      <div className="app-ambient app-ambient-1"></div>
      <div className="app-ambient app-ambient-2"></div>
      <div className="app-ambient app-ambient-3"></div>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-glow"></div>
        <div className="brand-block">
          {collapsed ? (
            <img src={logoSmall} alt={APP_NAME} className="brand-logo-img brand-logo-img--small" />
          ) : (
            <img src={logoFull} alt={APP_NAME} className="brand-logo-img brand-logo-img--full" />
          )}
        </div>

        <div className="workspace-chip">
          <i className={`fas ${roleIcons[user.role]}`}></i>
          {!collapsed && <span>{roleLabels[user.role]}</span>}
        </div>

        <nav className="nav-groups">
          {groupedRoutes.map((group) => (
            <div key={group.title} className="nav-group">
              {!collapsed && <div className="nav-group-title">{group.title}</div>}
              {group.items.map((item) => {
                const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link key={item.path} to={item.path} className={`nav-link ${active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
                    <span className="nav-icon"><i className={`fas ${item.icon}`}></i></span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="ghost-button topbar-menu" onClick={() => setCollapsed((value) => !value)}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="topbar-brand" onClick={() => navigate(getDefaultRouteForRole(user.role))}>
              {/* <div className="topbar-brand-icon"><img src={logoSmall} alt={APP_NAME} /></div> */}
              <div>
                <div className="topbar-brand-name">TP Healthcare <span>EHR</span></div>
                <div className="breadcrumb-line">{roleLabels[user.role]}</div>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            {user.role === 'patient' && <HospitalSwitcher />}
            <NotificationBell />
            <div className="identity-pill glass-pill">
              <div className="nav-avatar-mini">{(user.first_name || user.username || 'U').slice(0, 2).toUpperCase()}</div>
              <div>
                <span className="identity-name">{user.first_name || user.username}</span>
                <span className="identity-role">{user.role}</span>
              </div>
            </div>
            <button className="danger-button" onClick={() => { logout(); navigate('/login'); }}>
              Logout
            </button>
          </div>
        </header>

        <main className="content-shell">
          <div className="content-shell-top">
            <Breadcrumbs />
            {currentNavItem?.title ? <div className="content-shell-title">{currentNavItem.title}</div> : null}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
