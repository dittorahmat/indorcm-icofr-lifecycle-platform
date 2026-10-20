import type { ReactNode } from 'react';

export interface PeruriUseCase {
  id: string;
  title: string;
  icon: ReactNode;
  desc: string;
  status: 'LIVE' | 'BETA';
  color: string;
  precision: string;
}
