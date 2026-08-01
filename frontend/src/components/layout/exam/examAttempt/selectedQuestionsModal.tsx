'use client';

import { useEffect, useState } from 'react';
import { X, ListChecks } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthProvider';
import { getSelectedQuestions, ApiError } from '@/src/lib/api/exam-attempts';

interface SelectedQuestionsModalProps {
  attemptId: string;
  onClose: () => void;
}

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function SelectedQuestionsModal({ attemptId, onClose }: SelectedQuestionsModalProps) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getSelectedQuestions(attemptId, accessToken);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load questions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, accessToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#161C3A] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center">
              <ListChecks size={16} />
            </span>
            <h2 className="text-[15px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
              Selected questions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#8891B8] hover:text-[#F2F4FA] hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <p className="text-[13px] text-[#565F8C] text-center py-6">Loading…</p>
          )}
          {!loading && error && (
            <p className="text-[13px] text-[#FF6B6B] text-center py-6">{error}</p>
          )}
          {!loading && !error && data && (
            <div className="space-y-4">
              {Object.entries(data).map(([category, ids]) => (
                <div key={category}>
                  <p
                    className="text-[11px] uppercase tracking-wide text-[#565F8C] mb-2"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {categoryLabel(category)} ({ids.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ids.map((id) => (
                      <span
                        key={id}
                        className="text-[11px] text-[#AAB2D4] bg-[#0B0F26] border border-white/[0.08] rounded px-2 py-1"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(data).length === 0 && (
                <p className="text-[13px] text-[#565F8C] text-center py-6">No questions recorded.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}