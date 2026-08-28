const cores = {
  PENDENTE:   'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  CONFIRMADO: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  CONCLUIDO:  'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  CANCELADO:  'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  FALTOU:     'bg-red-500 text-white border-red-600 dark:bg-red-700 dark:text-white dark:border-red-800',
};
const labels = {
  PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado',
  CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
  FALTOU: 'Faltou'
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cores[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}