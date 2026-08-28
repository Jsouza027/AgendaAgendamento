import { useEffect, useState } from 'react';
import { procedimentosAPI } from '../api/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';

const vazio = { nome: '', descricao: '', duracaoMinutos: 60, preco: '', ativo: true };

export default function Procedimentos() {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletandoId, setDeletandoId] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const carregar = () => procedimentosAPI.listar().then(r => setLista(r.data));

  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => { setForm(vazio); setEditId(null); setModal(true); };

  const abrirEditar = (p) => {
    setForm({
      nome: p.nome,
      descricao: p.descricao || '',
      duracaoMinutos: p.duracaoMinutos,
      preco: p.preco,
      ativo: p.ativo
    });
    setEditId(p.id);
    setModal(true);
  };

  const salvar = async () => {
    // Validações
    if (!form.nome.trim()) {
      showToast('O nome do serviço é obrigatório.', 'error');
      return;
    }
    if (!form.preco || Number(form.preco) <= 0) {
      showToast('Informe um preço válido.', 'error');
      return;
    }
    if (!form.duracaoMinutos || Number(form.duracaoMinutos) <= 0) {
      showToast('Informe uma duração válida.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        duracaoMinutos: Number(form.duracaoMinutos),
        preco: Number(form.preco),
        ativo: form.ativo ?? true,
      };

      if (editId) {
        await procedimentosAPI.atualizar(editId, payload);
      } else {
        await procedimentosAPI.criar(payload);
      }

      showToast(editId ? 'Serviço atualizado!' : 'Serviço cadastrado!');
      setModal(false);
      carregar();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erro ao salvar serviço.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fecharModal = () => {
    if (!loading) setModal(false);
  };

  const deletar = async (p) => {
    if (!confirm(`Remover o serviço "${p.nome}"? Esta ação não poderá ser desfeita.`)) return;
    setDeletandoId(p.id);
    try {
      await procedimentosAPI.deletar(p.id);
      showToast(`Serviço "${p.nome}" removido.`);
      carregar();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erro ao remover serviço.';
      showToast(msg, 'error');
    } finally {
      setDeletandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-rose-900 dark:text-rose-300">Serviços</h1>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {lista.map(p => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display font-semibold text-rose-900 dark:text-rose-300 text-lg">{p.nome}</h3>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(p)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-800 rounded-lg"
                  title="Editar serviço">
                  <Pencil size={14} />
                </button>
                <button onClick={() => deletar(p)}
                  disabled={deletandoId === p.id}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40"
                  title="Remover serviço">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {p.descricao && (
              <p className="text-sm text-rose-500 dark:text-rose-400 mb-3">{p.descricao}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <Clock size={14} /> {p.duracaoMinutos} min
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-300">
                <DollarSign size={14} /> R$ {Number(p.preco).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
        {lista.length === 0 && (
          <div className="col-span-3 card text-center py-12 text-rose-400 dark:text-rose-500">
            Nenhum serviço cadastrado ainda.
          </div>
        )}
      </div>

      <Modal open={modal} onClose={fecharModal} title={editId ? 'Editar Serviço' : 'Novo Serviço'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome do Serviço *</label>
            <input
              className="input"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Manicure, Chapinha..."
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Descrição opcional do serviço"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duração (min) *</label>
              <input
                type="number"
                min="1"
                className="input"
                value={form.duracaoMinutos}
                onChange={e => setForm(f => ({ ...f, duracaoMinutos: e.target.value }))}
                placeholder="60"
              />
            </div>
            <div>
              <label className="label">Preço (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.preco}
                onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={salvar} disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={fecharModal} disabled={loading} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}