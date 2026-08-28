import { useEffect, useState } from 'react';
import { profissionaisAPI, procedimentosAPI } from '../api/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';

const vazio = { nome: '', especialidades: '' };

export default function Profissionais() {
  const [lista, setLista] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalServicos, setModalServicos] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState(null);
  const [profSelecionado, setProfSelecionado] = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingServicos, setLoadingServicos] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const carregar = () => profissionaisAPI.todos().then(r => setLista(r.data));

  useEffect(() => {
    carregar();
    procedimentosAPI.listar().then(r => setProcedimentos(r.data));
  }, []);

  const abrirNovo = () => { setForm(vazio); setEditId(null); setModal(true); };

  const abrirEditar = (p) => {
    setForm({ nome: p.nome, especialidades: p.especialidades || '' });
    setEditId(p.id);
    setModal(true);
  };

  const abrirServicos = (prof) => {
    setProfSelecionado(prof);
    // Converte IDs para Number para garantir comparação correta
    const ids = (prof.procedimentos || []).map(p => Number(p.id));
    setServicosSelecionados(ids);
    setModalServicos(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      showToast('Nome é obrigatório.', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        especialidades: form.especialidades.trim(),
      };
      if (editId) {
        await profissionaisAPI.atualizar(editId, payload);
      } else {
        await profissionaisAPI.criar(payload);
      }
      showToast(editId ? 'Profissional atualizado!' : 'Profissional cadastrado!');
      setModal(false);
      carregar();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erro ao salvar profissional.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const salvarServicos = async () => {
    if (!profSelecionado) return;
    setLoadingServicos(true);
    try {
      // Garante que são números
      const ids = servicosSelecionados.map(id => Number(id));
      await profissionaisAPI.atualizarProcedimentos(profSelecionado.id, ids);
      showToast('Serviços atualizados com sucesso!');
      setModalServicos(false);
      carregar();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erro ao salvar serviços.';
      showToast(msg, 'error');
    } finally {
      setLoadingServicos(false);
    }
  };

  const deletar = async (id) => {
    if (!confirm('Desativar este profissional?')) return;
    try {
      await profissionaisAPI.deletar(id);
      showToast('Profissional desativado.');
      carregar();
    } catch {
      showToast('Erro ao desativar profissional.', 'error');
    }
  };

  const reativar = async (prof) => {
    try {
      await profissionaisAPI.atualizar(prof.id, { nome: prof.nome, especialidades: prof.especialidades, ativo: true });
      showToast('Profissional reativado!');
      carregar();
    } catch {
      showToast('Erro ao reativar profissional.', 'error');
    }
  };

  const toggleServico = (id) => {
    const numId = Number(id);
    setServicosSelecionados(prev =>
      prev.includes(numId) ? prev.filter(s => s !== numId) : [...prev, numId]
    );
  };

  const ativos = lista.filter(p => p.ativo);
  const inativos = lista.filter(p => !p.ativo);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-rose-900 dark:text-rose-300">Profissionais</h1>
          <p className="text-rose-500 dark:text-rose-400 mt-1">Gerencie a equipe e os serviços de cada profissional</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Profissional
        </button>
      </div>

      <div className="space-y-3">
        {ativos.length === 0 && (
          <div className="card text-center py-12 text-rose-400 dark:text-rose-500">
            Nenhum profissional ativo cadastrado.
          </div>
        )}
        {ativos.map(prof => (
          <div key={prof.id} className="card">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center font-display font-bold text-rose-600 dark:text-rose-400 text-lg shrink-0">
                  {prof.nome.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-rose-900 dark:text-rose-200">{prof.nome}</p>
                  {prof.especialidades && (
                    <p className="text-sm text-rose-500 dark:text-rose-400">{prof.especialidades}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {prof.procedimentos?.length > 0 ? (
                      prof.procedimentos.map(p => (
                        <span key={p.id}
                          className="text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
                          {p.nome}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-rose-300 dark:text-rose-600 italic">
                        Nenhum serviço vinculado — clique em ⚙ para adicionar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button onClick={() => abrirServicos(prof)}
                  title="Gerenciar serviços"
                  className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg">
                  <Settings size={16} />
                </button>
                <button onClick={() => abrirEditar(prof)}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-800 rounded-lg">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deletar(prof.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


      {inativos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-rose-400 dark:text-rose-600 uppercase tracking-wider mb-3">
            Inativos ({inativos.length})
          </p>
          <div className="space-y-2">
            {inativos.map(prof => (
              <div key={prof.id} className="card opacity-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                    {prof.nome.charAt(0)}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{prof.nome}</p>
                </div>
                <button onClick={() => reativar(prof)} className="text-xs btn-secondary py-1.5">
                  Reativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      <Modal open={modal} onClose={() => !loading && setModal(false)}
        title={editId ? 'Editar Profissional' : 'Novo Profissional'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Ana Paula" />
          </div>
          <div>
            <label className="label">Descrição / Especialidades</label>
            <input className="input" value={form.especialidades}
              onChange={e => setForm(f => ({ ...f, especialidades: e.target.value }))}
              placeholder="Ex: Especialista em coloração e cortes" />
          </div>
          <p className="text-xs text-rose-400 dark:text-rose-500">
            💡 Após salvar, use o botão <strong>⚙</strong> para vincular os serviços que este profissional realiza.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={salvar} disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setModal(false)} disabled={loading} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>


      <Modal open={modalServicos} onClose={() => !loadingServicos && setModalServicos(false)}
        title={`Serviços — ${profSelecionado?.nome}`}>
        <div className="space-y-4">
          <p className="text-sm text-rose-500 dark:text-rose-400">
            Marque os serviços que <strong>{profSelecionado?.nome}</strong> realiza.
            Apenas estes aparecerão ao criar um agendamento.
          </p>

          {procedimentos.length === 0 ? (
            <p className="text-center text-rose-400 dark:text-rose-500 py-6 text-sm">
              Nenhum serviço cadastrado. Cadastre serviços primeiro.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {procedimentos.map(proc => {
                const marcado = servicosSelecionados.includes(Number(proc.id));
                return (
                  <label key={proc.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${marcado
                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'
                        : 'bg-white dark:bg-gray-800 border-rose-100 dark:border-gray-700 hover:bg-rose-50 dark:hover:bg-gray-700'
                      }`}>
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => toggleServico(proc.id)}
                      className="accent-rose-500 w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-rose-900 dark:text-rose-200 text-sm">{proc.nome}</p>
                      <p className="text-xs text-rose-400 dark:text-rose-500">
                        {proc.duracaoMinutos} min · R$ {Number(proc.preco).toFixed(2)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <p className="text-xs text-rose-400 dark:text-rose-500">
            {servicosSelecionados.length} serviço(s) selecionado(s)
          </p>

          <div className="flex gap-3 pt-2">
            <button onClick={salvarServicos} disabled={loadingServicos}
              className="btn-primary flex-1 disabled:opacity-60">
              {loadingServicos ? 'Salvando...' : 'Salvar Serviços'}
            </button>
            <button onClick={() => setModalServicos(false)} disabled={loadingServicos}
              className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}