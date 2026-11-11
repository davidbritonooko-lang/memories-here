import React from 'react';
import type { Metadata } from 'next';
import { MomentDetailView } from '@/features/moments';

export const metadata: Metadata = {
  title: 'Moment — Peshie Her World',
};

export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MomentDetailView momentId={id} />;
}
