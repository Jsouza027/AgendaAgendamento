import { useEffect, useState, useCallback } from 'react';
import { agendamentosAPI, profissionaisAPI } from '../api/api';
import StatusBadge from '../components/StatusBadge';
import { ChevronLeft, ChevronRight, Trash2, Clock, User, FileText, MessageCircle } from 'lucide-react';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { useToast } from '../hooks/useToast';

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

const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

const getBlocksCount = (duracaoMinutos) => {
  if (!duracaoMinutos) return 1;
  const blocks = Math.round(duracaoMinutos / 30);
  return Math.max(1, blocks);
};

export default function Agendamentos() {
  const { toast, showToast, hideToast } = useToast();
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

  const carregarAgendamentos = useCallback(() => {
    agendamentosAPI.listarPorDia(data).then(r => setAgendamentos(r.data));
  }, [data]);
  const carregarProfissionais = () => profissionaisAPI.listar().then(r => setProfissionais(r.data));

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  useEffect(() => {
    carregarProfissionais();
  }, []);

  const mudarStatus = async (id, status) => {
    try {
      await agendamentosAPI.atualizarStatus(id, status);
      showToast('Status atualizado!');
      carregarAgendamentos();
      if (agendamentoSelecionado?.id === id) {
        setAgendamentoSelecionado(prev => ({ ...prev, status }));
      }
    } catch {
      showToast('Erro ao atualizar status.', 'error');
    }
  };

  const deletar = async (id) => {
    if (!confirm('Cancelar agendamento?')) return;
    try {
      await agendamentosAPI.deletar(id);
      showToast('Agendamento removido.');
      setAgendamentoSelecionado(null);
      carregarAgendamentos();
    } catch {
      showToast('Erro ao remover agendamento.', 'error');
    }
  };

  const navData = (dias) => {
    const d = new Date(data);
    d.setDate(d.getDate() + dias);
    setData(d.toISOString().split('T')[0]);
  };

  // Conjunto para gerenciar as células que devem ser "puladas" por causa do rowSpan
  const skipCells = new Set();

  return (
    <div className="space-y-4 sm:space-y-6 flex flex-col h-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-rose-900 dark:text-rose-300">Agenda</h1>

        <div className="flex items-center gap-2 sm:gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-rose-100 dark:border-gray-700">
          <button onClick={() => navData(-1)} className="p-2 hover:bg-rose-50 dark:hover:bg-gray-700 rounded-lg text-rose-600 dark:text-rose-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className="bg-transparent border-none outline-none font-medium text-rose-800 dark:text-rose-300 text-sm cursor-pointer" />
          <button onClick={() => navData(1)} className="p-2 hover:bg-rose-50 dark:hover:bg-gray-700 rounded-lg text-rose-600 dark:text-rose-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="card flex-1 overflow-hidden p-0 flex flex-col border border-rose-200/60 dark:border-gray-700">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse min-w-max hidden lg:table">
            <thead className="sticky top-0 z-20 bg-rose-50 dark:bg-gray-900/90 backdrop-blur-md shadow-sm">
              <tr>
                <th className="p-4 border-b border-r border-rose-200 dark:border-gray-700 w-24 text-center text-rose-800 dark:text-rose-300 font-semibold sticky left-0 z-30 bg-rose-50 dark:bg-gray-900">
                  <Clock size={18} className="mx-auto" />
                </th>
                {profissionais.map(p => (
                  <th key={p.id} className="p-4 border-b border-rose-200 dark:border-gray-700 text-center font-semibold text-rose-900 dark:text-rose-200 min-w-[200px]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300">
                        {p.nome.charAt(0)}
                      </div>
                      {p.nome}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map((hora, hIdx) => (
                <tr key={hora} className="hover:bg-rose-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="p-3 border-b border-r border-rose-100 dark:border-gray-800 text-center text-sm font-medium text-rose-600 dark:text-rose-400 sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-rose-50/80 dark:group-hover:bg-gray-800/80">
                    {hora}
                  </td>
                  {profissionais.map(prof => {
                    const skipKey = `${hIdx}-${prof.id}`;
                    if (skipCells.has(skipKey)) return null;

                    const ag = agendamentos.find(a => {
                      if (Number(a.profissional?.id) !== Number(prof.id)) return false;
                      if (a.status === 'CANCELADO') return false;
                      const h = new Date(a.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      return h === hora;
                    });

                    if (ag) {
                      const duracao = ag.procedimento?.duracaoMinutos || 30;
                      const blocks = getBlocksCount(duracao);

                      for (let i = 1; i < blocks; i++) {
                        skipCells.add(`${hIdx + i}-${prof.id}`);
                      }

                      return (
                        <td key={prof.id} rowSpan={blocks} className="border-b border-rose-100 dark:border-gray-800 p-1.5 align-top">
                          <div
                            onClick={() => setAgendamentoSelecionado(ag)}
                            className="bg-rose-100/80 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 transition-all border border-rose-200 dark:border-rose-800/50 rounded-xl p-3 h-full cursor-pointer relative group/item overflow-hidden flex flex-col justify-start"
                            title={`${ag.cliente?.nome} - ${ag.procedimento?.nome} (${duracao}min)`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-semibold text-rose-900 dark:text-rose-200 text-sm truncate pr-2">
                                {ag.cliente?.nome}
                              </p>
                              <StatusBadge status={ag.status} />
                            </div>
                            <p className="text-xs text-rose-700 dark:text-rose-400 truncate">
                              {ag.procedimento?.nome}
                            </p>

                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm text-white opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 p-3 flex flex-col items-center justify-center text-center z-10 pointer-events-none rounded-xl">
                              <span className="font-bold text-sm mb-1">{ag.cliente?.nome}</span>
                              <span className="text-xs text-rose-200">{ag.procedimento?.nome}</span>
                              <span className="text-xs text-rose-300 mt-1">Duração: {duracao} min</span>
                              <span className="text-[10px] text-gray-400 mt-2">Clique para opções</span>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Célula vazia
                    return (
                      <td key={prof.id} className="border-b border-rose-100/50 dark:border-gray-800/50 p-2">
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Visualização Mobile/Tablet (telas < lg) */}
          <div className="lg:hidden p-4 space-y-3">
            {agendamentos.length === 0 ? (
              <p className="text-rose-400 dark:text-rose-500 text-center py-8 text-sm font-medium">
                Nenhum agendamento para este dia.
              </p>
            ) : (
              agendamentos
                .filter(a => a.status !== 'CANCELADO')
                .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
                .map(ag => {
                  const hora = new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={ag.id}
                      onClick={() => setAgendamentoSelecionado(ag)}
                      className="bg-rose-50/50 hover:bg-rose-100/50 dark:bg-gray-800 dark:hover:bg-gray-700/80 border border-rose-100 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3 shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/40 px-2 py-1 rounded-lg">
                          <Clock size={14} /> {hora}
                        </span>
                        <StatusBadge status={ag.status} />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-200 dark:bg-rose-800 flex items-center justify-center font-display font-bold text-rose-700 dark:text-rose-300 text-sm shrink-0">
                          {ag.cliente?.nome?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-rose-900 dark:text-rose-200 text-sm truncate">
                            {ag.cliente?.nome}
                          </p>
                          <p className="text-xs text-rose-500 dark:text-rose-400 truncate">
                            {ag.procedimento?.nome} · {ag.profissional?.nome}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <Modal open={!!agendamentoSelecionado} onClose={() => setAgendamentoSelecionado(null)} title="Detalhes do Agendamento">
        {agendamentoSelecionado && (
          <div className="space-y-5">
            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xl">
                {agendamentoSelecionado.cliente?.nome?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-rose-900 dark:text-rose-200">{agendamentoSelecionado.cliente?.nome}</h3>
                <p className="text-sm text-rose-600 dark:text-rose-400">{agendamentoSelecionado.cliente?.telefone || 'Sem telefone'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-white dark:bg-gray-800 p-3 border border-rose-100 dark:border-gray-700">
                <p className="text-xs text-rose-400 dark:text-gray-400 flex items-center gap-1.5 mb-1"><User size={14} /> Profissional</p>
                <p className="font-medium text-rose-800 dark:text-rose-300">{agendamentoSelecionado.profissional?.nome}</p>
              </div>
              <div className="card bg-white dark:bg-gray-800 p-3 border border-rose-100 dark:border-gray-700">
                <p className="text-xs text-rose-400 dark:text-gray-400 flex items-center gap-1.5 mb-1"><Clock size={14} /> Horário</p>
                <p className="font-medium text-rose-800 dark:text-rose-300">
                  {new Date(agendamentoSelecionado.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="card bg-white dark:bg-gray-800 p-3 border border-rose-100 dark:border-gray-700 col-span-2">
                <p className="text-xs text-rose-400 dark:text-gray-400 flex items-center gap-1.5 mb-1"><FileText size={14} /> Serviço</p>
                <div className="flex justify-between items-center">
                  <p className="font-medium text-rose-800 dark:text-rose-300">{agendamentoSelecionado.procedimento?.nome}</p>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    R$ {Number(agendamentoSelecionado.procedimento?.preco || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-rose-100 dark:border-gray-700">
              <label className="text-sm font-medium text-rose-800 dark:text-rose-300">Alterar Status</label>
              <div className="flex flex-wrap gap-2">
                {['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'].map(s => (
                  <button
                    key={s}
                    onClick={() => mudarStatus(agendamentoSelecionado.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${agendamentoSelecionado.status === s
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-rose-300'
                      }`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center flex-wrap gap-2">
              {agendamentoSelecionado.cliente?.telefone && (
                <button
                  onClick={() => enviarLembrete(agendamentoSelecionado)}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded-xl transition-colors font-medium text-sm"
                >
                  <MessageCircle size={16} /> Lembrete WhatsApp
                </button>
              )}
              <button
                onClick={() => deletar(agendamentoSelecionado.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors font-medium text-sm"
              >
                <Trash2 size={16} /> Cancelar Agendamento
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}