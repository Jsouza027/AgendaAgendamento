import { useEffect, useState } from 'react';
import { CalendarDays, Users, CheckCircle, Clock, DollarSign, TrendingUp, MessageCircle, BarChart2 } from 'lucide-react';
import { agendamentosAPI, clientesAPI } from '../api/api';
import StatusBadge from '../components/StatusBadge';

const colorClasses = {
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
};

function enviarLembrete(ag) {
  const telefone = ag.cliente?.telefone?.replace(/\D/g, '');
  if (!telefone) return;
  const hora = new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const data = new Date(ag.dataHora).toLocaleDateString('pt-BR');
  const msg = encodeURIComponent(
    `Olá ${ag.cliente?.nome}! 😊 Lembramos que você tem um agendamento de *${ag.procedimento?.nome}* com *${ag.profissional?.nome}* no dia *${data}* às *${hora}*. Aguardamos você! 💅`
  );
  window.open(`https://wa.me/55${telefone}?text=${msg}`, '_blank');
}

export default function Dashboard() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    agendamentosAPI.listarPorDia().then(r => setAgendamentos(r.data)).catch(() => { });
    clientesAPI.listar().then(r => setTotalClientes(r.data.length)).catch(() => { });
    agendamentosAPI.dashboardStats().then(r => setStats(r.data)).catch(() => { });
  }, []);

  const confirmados = agendamentos.filter(a => a.status === 'CONFIRMADO').length;
  const pendentes = agendamentos.filter(a => a.status === 'PENDENTE').length;

  const cardStats = [
    { label: 'Agendamentos Hoje', value: agendamentos.length, icon: CalendarDays, color: 'rose' },
    { label: 'Confirmados', value: confirmados, icon: CheckCircle, color: 'green' },
    { label: 'Pendentes', value: pendentes, icon: Clock, color: 'amber' },
    { label: 'Total Clientes', value: totalClientes, icon: Users, color: 'blue' },
    {
      label: 'Faturamento Hoje',
      value: stats ? `R$ ${Number(stats.faturamentoDia).toFixed(2)}` : '—',
      icon: DollarSign, color: 'emerald',
    },
    {
      label: 'Faturamento do Mês',
      value: stats ? `R$ ${Number(stats.faturamentoMes).toFixed(2)}` : '—',
      icon: TrendingUp, color: 'purple',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-rose-900 dark:text-rose-300">Dashboard</h1>
        <p className="text-xs sm:text-sm text-rose-500 dark:text-rose-400 mt-1">Visão geral do dia de hoje</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {cardStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]?.bg}`}>
              <Icon size={18} className={colorClasses[color]?.text} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-xl font-bold text-rose-900 dark:text-rose-200 truncate">{value}</p>
              <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-medium leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Agenda do Dia */}
        <div className="card lg:col-span-2">
          <h2 className="font-display text-base sm:text-lg font-semibold text-rose-900 dark:text-rose-300 mb-3 sm:mb-4">
            Agenda de Hoje
          </h2>
          {agendamentos.length === 0 ? (
            <p className="text-rose-400 dark:text-rose-500 text-center py-6 sm:py-8 text-sm">
              Nenhum agendamento para hoje.
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {agendamentos.map(ag => (
                <div key={ag.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-rose-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-200 dark:bg-rose-800 flex items-center justify-center font-display font-bold text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                      {ag.cliente?.nome?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-rose-900 dark:text-rose-200 text-xs sm:text-sm truncate">{ag.cliente?.nome}</p>
                      <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 truncate">
                        {ag.procedimento?.nome} · {ag.profissional?.nome}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-300">
                      {new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusBadge status={ag.status} />
                    {ag.cliente?.telefone && (
                      <button
                        onClick={() => enviarLembrete(ag)}
                        title="Enviar lembrete no WhatsApp"
                        className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      >
                        <MessageCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Serviços do Mês */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <BarChart2 size={18} className="text-rose-500" />
            <h2 className="font-display text-base sm:text-lg font-semibold text-rose-900 dark:text-rose-300">
              Top Serviços do Mês
            </h2>
          </div>
          {!stats || stats.topProcedimentos?.length === 0 ? (
            <p className="text-rose-400 dark:text-rose-500 text-center py-6 text-sm">
              Sem dados neste mês ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topProcedimentos.map((proc, i) => {
                const max = stats.topProcedimentos[0]?.count || 1;
                const pct = Math.round((proc.count / max) * 100);
                const barColors = [
                  'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500', 'bg-indigo-500'
                ];
                return (
                  <div key={proc.nome}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-rose-800 dark:text-rose-300 truncate pr-2">{proc.nome}</span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">{proc.count}x</span>
                    </div>
                    <div className="w-full bg-rose-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`${barColors[i % barColors.length]} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}