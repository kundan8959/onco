import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appRoutes, getDefaultRouteForRole } from '../pages/WireframeShell';
import NotificationBell from './NotificationBell';

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

const roleTabMeta = {
  superadmin: { label: 'Super Admin', className: 't-sa' },
  hospital: { label: 'Hospital', className: 't-ho' },
  patient: { label: 'Patient', className: 't-pa' },
};

type NavItem = {
  path: string;
  label: string;
  title?: string;
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

  const routes = useMemo(() => appRoutes.filter((route) => user && route.roles.includes(user.role)), [user]);

  const groupedRoutes = useMemo<NavGroup[]>(() => {
    if (!user) return [];

    if (user.role === 'superadmin') {
      return [{
        title: 'Platform',
        items: routes.map((route) => ({ path: `/${route.path}`, label: route.label, title: route.title })),
      }];
    }

    if (user.role === 'hospital') {
      return [
        {
          title: 'Patient Management',
          items: [
            { path: '/patients', label: 'Patients', title: 'Patient Registry' },
            { path: '/allergies', label: 'Allergies', title: 'Allergies' },
            { path: '/medications', label: 'Medications', title: 'Medications' },
            { path: '/conditions', label: 'Chronic Conditions', title: 'Chronic Conditions' },
            { path: '/vitals', label: 'Vitals', title: 'Vitals' },
            { path: '/lifestyle', label: 'Lifestyle Information', title: 'Lifestyle Information' },
            { path: '/medical-history', label: 'Medical Histories', title: 'Medical Histories' },
            { path: '/hospital/imaging', label: 'Imaging', title: 'Imaging AI Workflow' },
          ],
        },
        {
          title: 'Oncology',
          items: [
            { path: '/oncology', label: 'Diagnosis Confirmed', title: 'Diagnosis Confirmed' },
            { path: '/hospital/followups', label: 'Follow-ups', title: 'Oncology Follow-ups' },
            { path: '/payer-submissions', label: 'Payer Submissions', title: 'Payer Submissions' },
            { path: '/symptoms', label: 'Symptom Reports', title: 'Symptom Reports' },
            { path: '/treatments', label: 'Treatments', title: 'Treatments' },
          ],
        },
      ];
    }

    return [{
      title: 'Patient Portal',
      items: routes.map((route) => ({ path: `/${route.path}`, label: route.label, title: route.title })),
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
          <div className="brand-logo">ON</div>
          {!collapsed && (
            <div>
              <h1>OncoFlow</h1>
              <p>AI-assisted oncology workspace</p>
            </div>
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
                  <Link key={item.path} to={item.path} className={`nav-link ${active ? 'active' : ''}`}>
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
              <div className="topbar-brand-icon">⚕️</div>
              <div>
                <div className="topbar-brand-name">OncoCare <span>EHR</span></div>
                <div className="breadcrumb-line">{currentNavItem?.title || roleLabels[user.role]}</div>
              </div>
            </div>
          </div>
          <div className="topbar-center role-tabs" aria-label="Role tabs">
            {(['superadmin', 'hospital', 'patient'] as const).map((role) => {
              const active = user.role === role;
              const meta = roleTabMeta[role];
              return (
                <button
                  key={role}
                  type="button"
                  className={`role-tab ${meta.className} ${active ? 'active' : ''}`}
                  onClick={() => role === user.role ? navigate(getDefaultRouteForRole(user.role)) : undefined}
                >
                  <span className="role-tab-dot" />
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div className="topbar-right">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
