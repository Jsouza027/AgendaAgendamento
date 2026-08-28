import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Agendamentos from './pages/Agendamentos';
import NovoAgendamento from './pages/Novoagendamento';
import Clientes from './pages/Clientes';
import Procedimentos from './pages/Procedimentos';
import Profissionais from './pages/Profissionais';
import Login from './pages/Login';

// Componente para proteger as rotas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-rose-50/30 dark:bg-gray-950 transition-colors duration-300">
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 lg:hidden z-40" onClick={() => setIsSidebarOpen(false)} />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agendamentos" element={<Agendamentos />} />
            <Route path="/novo-agendamento" element={<NovoAgendamento />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/procedimentos" element={<Procedimentos />} />
            <Route path="/profissionais" element={<Profissionais />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}