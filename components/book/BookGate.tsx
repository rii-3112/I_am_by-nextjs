'use client';

import dynamic from 'next/dynamic';

const BookExperience = dynamic(() => import('./BookExperience'), {
  ssr: false,
  loading: () => <main className="h-svh bg-[#d4aa6c]" />,
});

export default function BookGate() {
  return <BookExperience />;
}
