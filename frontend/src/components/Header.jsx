import { Menu, Scissors, Sun, Moon } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';

export default function Header({ toggleSidebar }) {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-gray-900 border-b border-rose-100 dark:border-gray-800 flex items-center px-3 sm:px-4 justify-between transition-colors duration-300 z-10 relative">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-gray-800 text-rose-500 dark:text-rose-400 transition-colors"
          title="Alternar menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center">
            <Scissors size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-rose-900 dark:text-rose-300 leading-tight">Salão</p>
            <p className="text-xs text-rose-400 dark:text-rose-500 font-medium">Gestão &amp; Agenda</p>
          </div>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-rose-50 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-gray-700 shadow-sm border border-rose-100 dark:border-gray-700"
      >
        {isDark ? (
          <Sun size={20} className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
        ) : (
          <Moon size={20} className="text-rose-500" />
        )}
      </button>
    </header>
  );
}
