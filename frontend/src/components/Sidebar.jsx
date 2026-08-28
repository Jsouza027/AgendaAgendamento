import { NavLink } from 'react-router-dom';
import { Scissors, CalendarDays, Users, Grid3x3, LayoutDashboard, UserCog } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agendamentos', icon: CalendarDays, label: 'Agenda' },
  { to: '/novo-agendamento', icon: Scissors, label: 'Novo Ag.' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/procedimentos', icon: Grid3x3, label: 'Serviços' },
  { to: '/profissionais', icon: UserCog, label: 'Profissionais' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside 
      className={`bg-white dark:bg-gray-900 border-r border-rose-100 dark:border-gray-800 flex flex-col shadow-sm transition-all duration-300 overflow-hidden fixed lg:relative lg:w-64 lg:opacity-100 lg:border-r lg:shadow-sm z-50 h-screen lg:h-auto ${
        isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-none lg:border-r lg:opacity-100 lg:w-64'
      }`}
    >
      <div className="w-64 flex flex-col flex-1 h-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden p-2 text-rose-600 hover:bg-rose-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-8 lg:mt-0">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-gray-800'
                }`}>
              <Icon size={20} /> {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
