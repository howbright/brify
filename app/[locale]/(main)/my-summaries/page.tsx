// app/(main)/my-summaries/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { useRouter } from 'next/navigation';

type SummaryItem = {
  id: string;
  summary_text: string;
  detailed_summary_text: string;
  status: string;
  created_at: string;
};

export default function MySummariesPage() {
  const { session, isLoading } = useSession();
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [isLoading, session]);

  useEffect(() => {
    if (session?.user.id) {
      fetch(`/api/summaries?user_id=${session.user.id}`)
        .then(res => res.json())
        .then(data => setSummaries(data))
        .catch(err => console.error('요약 목록 불러오기 실패:', err));
    }
  }, [session]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">나의 정리함</h1>
      <ul className="space-y-4">
        {summaries.map(summary => (
          <li key={summary.id} className="p-4 border rounded shadow-sm">
            <p className="text-sm text-gray-500">{new Date(summary.created_at).toLocaleString()}</p>
            <p className="text-base">{summary.detailed_summary_text || '요약이 아직 없습니다.'}</p>
            <span className="text-xs text-blue-500">{summary.status}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
