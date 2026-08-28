export default function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-3 sm:p-6 border-b border-rose-100 dark:border-gray-800">
                    <h2 className="font-display text-base sm:text-xl font-semibold text-rose-900 dark:text-rose-300">{title}</h2>
                    <button onClick={onClose} className="text-rose-400 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-300 text-2xl leading-none">&times;</button>
                </div>
                <div className="p-3 sm:p-6">{children}</div>
            </div>
        </div>
    );
}