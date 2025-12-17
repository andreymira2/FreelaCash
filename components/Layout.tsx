
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Plus, FileText, Settings, Wallet, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Avatar } from './ui';

const Layout: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useData();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Início' },
    { path: '/projects', icon: FolderKanban, label: 'Projetos' },
    { path: '/expenses', icon: Wallet, label: 'Despesas' },
    { path: '/calendar', icon: Calendar, label: 'Calendário' },
    { path: '/add', icon: Plus, label: 'Novo', special: true },
    { path: '/reports', icon: FileText, label: 'Relatórios' },
    { path: '/settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-28 lg:pl-64 bg-base transition-colors duration-300">
      {/* Desktop Sidebar (Dark Blended) */}
      <aside className="fixed left-0 top-0 h-full w-28 lg:w-64 bg-base border-r border-white/5 hidden md:flex flex-col p-4 lg:p-6 z-30">

        {/* Logo Area */}
        <div className="mb-10 flex flex-col lg:flex-row items-center gap-3 justify-center lg:justify-start">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-neon">
            <div className="w-4 h-4 bg-black rounded-sm transform rotate-45"></div>
          </div>
          <h1 className="hidden lg:block text-xl font-black text-white tracking-tight glow-text">FreelaCash</h1>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex lg:flex-row flex-col items-center gap-3 px-3 py-3 lg:px-4 lg:py-3.5 rounded-xl transition-all duration-300 group relative active:scale-95
                ${isActive
                  ? 'bg-white/5 text-white shadow-inner border border-white/5'
                  : 'text-ink-gray hover:text-white hover:bg-white/5'}
                ${item.special ? 'mt-4 lg:bg-brand lg:text-black lg:hover:bg-brand-hover lg:shadow-neon lg:border-transparent' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={22} strokeWidth={2.5} />
                  </div>
                  <span className={`text-xs lg:text-sm font-semibold ${!item.special ? 'lg:block hidden md:block' : 'lg:block hidden'}`}>{item.label}</span>

                  {/* Active Indicator Dot */}
                  {item.path !== '/add' && isActive && (
                    <div className="lg:block hidden absolute left-0 w-1 h-4 bg-brand rounded-r-full shadow-[0_0_8px_#C6FF3F]"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Mini-Card */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <NavLink to="/settings" className="flex flex-col lg:flex-row items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
            <Avatar name={userProfile.name} src={userProfile.avatar} className="w-10 h-10 rounded-full border border-white/10" />
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-brand transition-colors">{userProfile.name}</p>
              <p className="text-xs text-ink-dim truncate">{userProfile.title || 'Freelancer'}</p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Mobile Bottom Nav (Floating Dark Glass) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-xl shadow-float flex justify-around items-center p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden z-50 border-t border-white/10">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-300
              ${isActive && !item.special ? 'text-brand' : 'text-ink-gray'}
            `}
          >
            {({ isActive }) => (
              <>
                {item.special ? (
                  <div className="bg-brand text-black p-2.5 rounded-xl shadow-neon transition-transform active:scale-95">
                    <item.icon size={22} strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform active:scale-90" />
                    <span className="text-xs font-semibold">{item.label}</span>
                    {isActive && <div className="absolute -bottom-0.5 w-1 h-1 bg-brand rounded-full shadow-[0_0_8px_currentColor]"></div>}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="w-full text-white pb-24 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
