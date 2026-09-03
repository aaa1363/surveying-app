import React, { useEffect, useState } from 'react';
import { History, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { DocumentStatusHistory } from '../../../models';
import { documentAuditRepository } from '../../../repositories';
import { Badge } from '../../../components/ui/Badge';
import { toPersianDigits } from '../../../utils/formatters';

interface DocumentAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

export const DocumentAuditModal: React.FC<DocumentAuditModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [logs, setLogs] = useState<DocumentStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setIsLoading(true);
      documentAuditRepository.getAuditLog(documentId)
        .then((data) => setLogs(data))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, documentId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تاریخچه تغییرات و رخدادها: ${documentTitle}`}
      size="md"
    >
      <div className="space-y-4 text-right" dir="rtl">
        {isLoading ? (
          <p className="text-xs text-slate-500 text-center py-6">در حال دریافت لاگ تغییرات...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            هنوز رخدادی برای این سند ثبت نشده است.
          </div>
        ) : (
          <div className="relative border-r-2 border-slate-200 pr-4 space-y-4 mr-2">
            {logs.map((log) => (
              <div key={log.id} className="relative space-y-1">
                {/* Dot */}
                <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-white" />

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>تغییر وضعیت از <span className="text-slate-500 font-mono">[{log.fromStatus}]</span> به <span className="text-teal-700 font-mono">[{log.toStatus}]</span></span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {toPersianDigits(log.actionDateJalali)}
                  </span>
                </div>

                {log.reason && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-150">
                    {log.reason}
                  </p>
                )}

                <div className="text-[10px] text-slate-400">
                  ثبت سیستمی: {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
          >
            بستن
          </button>
        </div>
      </div>
    </Modal>
  );
};
