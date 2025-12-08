import React from 'react';
import { MainHeader } from '@/components/layout/MainHeader';
export function DeficiencyBoard() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl font-bold mb-6">Deficiency Board</h1>
            <p className="text-muted-foreground">This feature is coming in Phase 2.</p>
          </div>
        </div>
      </main>
    </div>
  );
}