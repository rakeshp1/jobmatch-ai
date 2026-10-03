import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { IconBriefcase, IconFile, IconGrid, IconPlus, IconTarget } from './Icons';

const NAV = [
  { to: '/', label: 'Dashboard', icon: IconGrid, end: true },
  { to: '/resume', label: 'Resume', icon: IconFile },
  { to: '/jobs/new', label: 'Add Job', icon: IconPlus },
  { to: '/matches', label: 'Job Matches', icon: IconTarget },
  { to: '/applications', label: 'Applications', icon: IconBriefcase },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      {open && <button className="backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside id="app-sidebar" className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">J</div>
          <div>
            <strong>JobMatch AI</strong>
            <span>Resume to role fit</span>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <p className="sidebar-foot">Scores estimate wording overlap. They are not a promise of an interview.</p>
      </aside>
      <main className="main" id="main">
        <div className="topbar">
          <strong>JobMatch AI</strong>
          <button className="menu-btn" type="button" aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen((value) => !value)}>
            {open ? 'Close menu' : 'Menu'}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
