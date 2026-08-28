import { useEffect, useState, useCallback } from 'react';
import { clientesAPI } from '../api/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import StatusBadge from '../components/StatusBadge';
import { Plus, Pencil, Trash2, Search, History, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const vazio = { nome: '', telefone: '', email: '' };
const PAGE_SIZE = 10;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState(null);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const carregar = useCallback(() => {
    clientesAPI.listarPaginado(busca, page, PAGE_SIZE)
      .then(r => {
        setClientes(r.data.content);
        setTotalPages(r.data.totalPages);
        setTotalElements(r.data.totalElements);
      })
      .catch(() => showToast('Erro ao carregar clientes.', 'error'));
  }, [busca, page, showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  // Debounce para a busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusca(buscaInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [buscaInput]);

  const abrirNovo = () => { setForm(vazio); setEditId(null); setModal(true); };
  const abrirEditar = (c) => {
    setForm({ nome: c.nome, telefone: c.telefone, email: c.email || '' });
    setEditId(c.id); setModal(true);
  };

  const abrirHistorico = async (c) => {
    setClienteSelecionado(c);
    setModalHistorico(true);
    setLoadingHistorico(true);
    try {
      const r = await clientesAPI.historico(c.id);
      setHistorico(r.data);
    } catch {
      showToast('Erro ao carregar histórico.', 'error');
    } finally {
      setLoadingHistorico(false);
    }
  };

  const salvar = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      showToast('Nome e telefone são obrigatórios.', 'error');
      return;
    }
    try {
      if (editId) await clientesAPI.atualizar(editId, form);
      else await clientesAPI.criar(form);
      showToast(editId ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      setModal(false);
      carregar();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erro ao salvar cliente.', 'error');
    }
  };

  const deletar = async (id) => {
    if (!confirm('Remover cliente?')) return;
    try {
      await clientesAPI.deletar(id);
      showToast('Cliente removido.');
      if (clientes.length === 1 && page > 0) setPage(p => p - 1);
      else carregar();
    } catch {
      showToast('Erro ao remover cliente.', 'error');
    }
  };

  // Estatísticas do histórico
  const statsHistorico = historico.reduce((acc, ag) => {
    if (ag.status === 'CONCLUIDO') acc.concluidos++;
    else if (ag.status === 'FALTOU') acc.faltas++;
    else if (ag.status === 'CANCELADO') acc.cancelados++;
    acc.total++;
    return acc;
  }, { total: 0, concluidos: 0, faltas: 0, cancelados: 0 });

  const totalGasto = historico
    .filter(ag => ag.status === 'CONCLUIDO')
    .reduce((sum, ag) => sum + (ag.procedimento?.preco || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-rose-900 dark:text-rose-300">Clientes</h1>
          {totalElements > 0 && (
            <p className="text-xs text-rose-400 dark:text-rose-500 mt-0.5">{totalElements} cliente{totalElements !== 1 ? 's' : ''} cadastrado{totalElements !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 dark:text-rose-500" />
        <input
          placeholder="Buscar por nome ou telefone..."
          className="input pl-10"
          value={buscaInput}
          onChange={e => setBuscaInput(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {clientes.map(c => (
          <div key={c.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center font-display font-bold text-rose-600 dark:text-rose-400 text-lg shrink-0">
                {c.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-rose-900 dark:text-rose-200 truncate">{c.nome}</p>
                <p className="text-sm text-rose-500 dark:text-rose-400 truncate">
                  {c.telefone}{c.email && <span className="hidden sm:inline"> · {c.email}</span>}
                </p>
                {c.email && <p className="text-xs text-rose-400 dark:text-rose-500 sm:hidden truncate mt-0.5">{c.email}</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end sm:justify-start border-t border-rose-50/50 dark:border-gray-800/80 pt-2 sm:pt-0 sm:border-t-0 shrink-0">
              <button
                onClick={() => abrirHistorico(c)}
                title="Ver histórico"
                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <History size={16} />
              </button>
              <button onClick={() => abrirEditar(c)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-800 rounded-lg">
                <Pencil size={16} />
              </button>
              <button onClick={() => deletar(c.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {clientes.length === 0 && (
          <div className="card text-center py-12 text-rose-400 dark:text-rose-500">
            {busca ? `Nenhum cliente encontrado para "${busca}".` : 'Nenhum cliente cadastrado ainda.'}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-rose-200 dark:border-gray-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border border-rose-200 dark:border-gray-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal Novo/Editar Cliente */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Cliente' : 'Novo Cliente'}>
        <div className="space-y-4">
          {[['nome', 'Nome Completo', 'text'], ['telefone', 'Telefone / WhatsApp', 'tel'], ['email', 'E-mail (opcional)', 'email']].map(([k, l, t]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input type={t} className="input" value={form[k]}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={salvar} className="btn-primary flex-1">Salvar</button>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Modal Histórico do Cliente */}
      <Modal open={modalHistorico} onClose={() => setModalHistorico(false)}
        title={`Histórico — ${clienteSelecionado?.nome}`}>
        {loadingHistorico ? (
          <p className="text-center py-8 text-rose-400 text-sm">Carregando histórico...</p>
        ) : (
          <div className="space-y-4">
            {/* Stats do cliente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Total', value: statsHistorico.total, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: null },
                { label: 'Concluídos', value: statsHistorico.concluidos, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
                { label: 'Faltas', value: statsHistorico.faltas, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
                { label: 'Cancelados', value: statsHistorico.cancelados, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', icon: AlertCircle },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {totalGasto > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total gasto (concluídos)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">R$ {totalGasto.toFixed(2)}</span>
              </div>
            )}

            {/* Lista de agendamentos */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {historico.length === 0 ? (
                <p className="text-center text-rose-400 dark:text-rose-500 py-6 text-sm">Nenhum agendamento encontrado.</p>
              ) : historico.map(ag => (
                <div key={ag.id} className="flex items-center justify-between gap-3 p-3 bg-rose-50/60 dark:bg-gray-800 rounded-xl">
                  <div className="min-w-0">
                    <p className="font-medium text-rose-900 dark:text-rose-200 text-sm truncate">{ag.procedimento?.nome}</p>
                    <p className="text-xs text-rose-500 dark:text-rose-400 truncate">
                      {ag.profissional?.nome} · {new Date(ag.dataHora).toLocaleDateString('pt-BR')} {new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={ag.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}