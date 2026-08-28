import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all
      ${type === 'success' ? 'bg-white border-green-200 text-green-800' : 'bg-white border-red-200 text-red-800'}`}>
      {type === 'success'
        ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
        : <XCircle size={18} className="text-red-500 flex-shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  );
}