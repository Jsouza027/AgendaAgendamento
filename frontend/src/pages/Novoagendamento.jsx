import { useEffect, useState, useMemo } from 'react';
import { clientesAPI, procedimentosAPI, profissionaisAPI, agendamentosAPI } from '../api/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Clock } from 'lucide-react';

const formVazio = {
  clienteId: '', procedimentoId: '', profissionalId: '',
  observacoes: ''
};

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

export default function NovoAgendamento() {
  const nav = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [clientes, setClientes] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [profissionaisFiltrados, setProfissionaisFiltrados] = useState([]);
  const [modalCliente, setModalCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(formVazio);

  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [horaSelecionada, setHoraSelecionada] = useState('');
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);

  useEffect(() => {
    if (dataSelecionada) {
      agendamentosAPI.listarPorDia(dataSelecionada).then(r => setAgendamentosDoDia(r.data)).catch(() => setAgendamentosDoDia([]));
    }
  }, [dataSelecionada]);

  useEffect(() => {
    clientesAPI.listar().then(r => setClientes(r.data));
    procedimentosAPI.listar().then(r => setProcedimentos(r.data));
    profissionaisAPI.listar().then(r => {
      setProfissionais(r.data);
      setProfissionaisFiltrados(r.data);
    });
  }, []);

  // Filtra profissionais quando o procedimento muda
  const handleProcedimentoChange = (procedimentoId) => {
    setForm(f => ({ ...f, procedimentoId, profissionalId: '' }));
    if (!procedimentoId) {
      setProfissionaisFiltrados(profissionais);
      return;
    }
    profissionaisAPI.porProcedimento(procedimentoId).then(r => {
      setProfissionaisFiltrados(r.data);
    }).catch(() => {
      setProfissionaisFiltrados(profissionais);
    });
  };

  const salvarCliente = async () => {
    if (!novoCliente.nome.trim() || !novoCliente.telefone.trim()) {
      showToast('Nome e telefone são obrigatórios.', 'error');
      return;
    }
    try {
      const r = await clientesAPI.criar(novoCliente);
      setClientes(prev => [...prev, r.data]);
      setForm(f => ({ ...f, clienteId: String(r.data.id) }));
      setModalCliente(false);
      setNovoCliente({ nome: '', telefone: '', email: '' });
      showToast('Cliente cadastrado!');
    } catch {
      showToast('Erro ao cadastrar cliente.', 'error');
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.clienteId || !form.procedimentoId || !form.profissionalId || !dataSelecionada || !horaSelecionada) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    setLoading(true);
    try {
      const dataHoraFormatada = `${dataSelecionada}T${horaSelecionada}:00`;

      await agendamentosAPI.criar({
        clienteId: Number(form.clienteId),
        profissionalId: Number(form.profissionalId),
        procedimentoId: Number(form.procedimentoId),
        dataHora: dataHoraFormatada,
        observacoes: form.observacoes,
      });

      showToast('Agendamento criado com sucesso!');

      setForm(formVazio);
      setDataSelecionada(new Date().toISOString().split('T')[0]);
      setHoraSelecionada('');
      setProfissionaisFiltrados(profissionais);

      setTimeout(() => nav('/agendamentos'), 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erro ao criar agendamento.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const proc = procedimentos.find(p => Number(p.id) === Number(form.procedimentoId));

  const horariosIndisponiveis = useMemo(() => {
    if (!form.profissionalId) return [];

    // Obter agendamentos do profissional selecionado no dia (ignorando cancelados)
    const ags = agendamentosDoDia.filter(ag =>
      Number(ag.profissional?.id) === Number(form.profissionalId) &&
      ag.status !== 'CANCELADO'
    );

    const indisponiveis = new Set();

    ags.forEach(ag => {
      // Extrair apenas a hora do agendamento, ex: "09:30"
      const dateObj = new Date(ag.dataHora);
      const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const duracao = ag.procedimento?.duracaoMinutos || 30;
      const blocos = getBlocksCount(duracao);

      const idx = HORARIOS.indexOf(horaStr);
      if (idx !== -1) {
        for (let i = 0; i < blocos; i++) {
          if (idx + i < HORARIOS.length) {
            indisponiveis.add(HORARIOS[idx + i]);
          }
        }
      }
    });

    return Array.from(indisponiveis);
  }, [agendamentosDoDia, form.profissionalId]);

  const isHorarioValido = (horaIndex) => {
    if (!proc) return !horariosIndisponiveis.includes(HORARIOS[horaIndex]);

    const blocosNecessarios = getBlocksCount(proc.duracaoMinutos);
    for (let i = 0; i < blocosNecessarios; i++) {
      const nextIdx = horaIndex + i;
      if (nextIdx >= HORARIOS.length) return false; // Não há tempo suficiente antes do fim do expediente
      if (horariosIndisponiveis.includes(HORARIOS[nextIdx])) return false; // Um dos blocos necessários está ocupado
    }
    return true;
  };

  return (
    <div className="max-w-2xl space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-rose-900 dark:text-rose-300">Novo Agendamento</h1>
        <p className="text-rose-500 dark:text-rose-400 mt-1">Preencha os dados para agendar um serviço</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3 sm:space-y-5">


        <div>
          <label className="label">Cliente *</label>
          <div className="flex gap-2">
            <select value={form.clienteId}
              onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}
              className="input" required>
              <option value="">Selecione um cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome} · {c.telefone}</option>
              ))}
            </select>
            <button type="button" onClick={() => setModalCliente(true)}
              className="shrink-0 btn-secondary flex items-center gap-1.5 text-sm">
              <Plus size={16} /> Novo
            </button>
          </div>
        </div>

        {modalCliente}

        <div>
          <label className="label">Serviço *</label>
          <select value={form.procedimentoId}
            onChange={e => handleProcedimentoChange(e.target.value)}
            className="input" required>
            <option value="">Selecione um serviço...</option>
            {procedimentos.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome} · R${Number(p.preco).toFixed(2)}
              </option>
            ))}
          </select>
        </div>


        <div>
          <label className="label">
            Profissional *
            {form.procedimentoId && profissionaisFiltrados.length === 0 && (
              <span className="ml-2 text-red-400 font-normal normal-case text-xs">
                Nenhum profissional realiza este serviço
              </span>
            )}
          </label>
          <select value={form.profissionalId}
            onChange={e => setForm(f => ({ ...f, profissionalId: e.target.value }))}
            className="input" required>
            <option value="">
              {!form.procedimentoId
                ? 'Selecione um serviço primeiro...'
                : profissionaisFiltrados.length === 0
                  ? 'Nenhum disponível para este serviço'
                  : 'Selecione um profissional...'}
            </option>
            {profissionaisFiltrados.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          {form.procedimentoId && profissionaisFiltrados.length > 0 && (
            <p className="text-xs text-rose-400 dark:text-rose-500 mt-1">
              {profissionaisFiltrados.length} profissional(is) disponível(is)
            </p>
          )}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="label">Data *</label>
            <input type="date" value={dataSelecionada}
              onChange={e => {
                setDataSelecionada(e.target.value);
                setHoraSelecionada('');
              }}
              className="input" required />
          </div>

          <div className="flex items-center gap-2 mt-auto pb-2">
            <Clock size={20} className="text-rose-500" />
            <span className="text-sm font-medium text-rose-800 dark:text-rose-300">
              {horaSelecionada ? `Horário escolhido: ${horaSelecionada}` : 'Nenhum horário selecionado'}
            </span>
          </div>
        </div>


        {form.profissionalId && dataSelecionada && (
          <div>
            <label className="label mb-2">Selecione um Horário Disponível *</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {HORARIOS.map((hora, idx) => {
                const valido = isHorarioValido(idx);
                const selecionado = horaSelecionada === hora;
                return (
                  valido && (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => setHoraSelecionada(hora)}
                      className={`py-2 px-1 text-sm font-medium rounded-lg transition-colors border
                        ${selecionado
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-rose-400 hover:text-rose-600'
                        }`}
                    >
                      {hora}
                    </button>
                  )
                );
              })}
            </div>
            {HORARIOS.filter((_, idx) => isHorarioValido(idx)).length === 0 && (
              <div className="text-sm text-rose-500 dark:text-rose-400 p-4 text-center border border-dashed border-rose-200 dark:border-rose-900/50 rounded-xl">
                Nenhum horário disponível para esta data com o procedimento selecionado.
              </div>
            )}
          </div>
        )}


        {proc && (
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-200 dark:bg-rose-800 rounded-xl flex items-center justify-center">
              <User size={18} className="text-rose-600 dark:text-rose-300" />
            </div>
            <div>
              <p className="font-semibold text-rose-800 dark:text-rose-200 text-sm">{proc.nome}</p>
              <p className="text-xs text-rose-500 dark:text-rose-400">
                ⏱ {proc.duracaoMinutos} min · 💰 R$ {Number(proc.preco).toFixed(2)}
              </p>
            </div>
          </div>
        )}


        <div>
          <label className="label">Observações</label>
          <textarea value={form.observacoes}
            onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            className="input resize-none" rows={3}
            placeholder="Alguma observação especial?" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="btn-primary flex-1 disabled:opacity-60">
            {loading ? 'Salvando...' : 'Confirmar Agendamento'}
          </button>
          <button type="button" onClick={() => nav(-1)} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>


      <Modal open={modalCliente} onClose={() => setModalCliente(false)} title="Novo Cliente">
        <div className="space-y-4">
          <div>
            <label className="label">Nome Completo *</label>
            <input className="input" value={novoCliente.nome}
              onChange={e => setNovoCliente(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Maria Silva" />
          </div>
          <div>
            <label className="label">Telefone / WhatsApp *</label>
            <input className="input" value={novoCliente.telefone}
              onChange={e => setNovoCliente(f => ({ ...f, telefone: e.target.value }))}
              placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className="label">E-mail (opcional)</label>
            <input type="email" className="input" value={novoCliente.email}
              onChange={e => setNovoCliente(f => ({ ...f, email: e.target.value }))}
              placeholder="email@exemplo.com" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={salvarCliente} className="btn-primary flex-1">Salvar Cliente</button>
            <button onClick={() => setModalCliente(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}