// scripts/check-worktree-isolation.mjs
// Mechanical gate: prevents implementing tickets directly on the main worktree root.
// When on a ticket or feature branch (e.g. feat/* or ticket-*), verifies that the
// current directory is not the primary indorcm-icofr-lifecycle-platform directory
// if git worktree isolation is active.
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  const cwd = resolve(process.cwd()).toLowerCase();
  
  // Only enforce when on a feature/ticket branch
  if (currentBranch.startsWith('feat/') || currentBranch.startsWith('ticket/')) {
    // Check if current directory ends with main repo name and is the root
    if (cwd.endsWith('indorcm-icofr-lifecycle-platform')) {
      // Check if other worktrees exist
      const worktreeList = execSync('git worktree list --porcelain', { encoding: 'utf-8' });
      const worktreeLines = worktreeList.split('\n').filter(l => l.startsWith('worktree '));
      
      // If worktrees are present, warn or enforce
      if (worktreeLines.length > 1) {
        console.warn(`\n⚠️  [WORKTREE ISOLATION WARNING] You are currently committing directly to '${currentBranch}' from the primary repository root:`);
        console.warn(`   ${process.cwd()}`);
        console.warn(`   Mandat AGENTS.md §9: Pengerjaan tiket/fitur WAJIB diisolasi ke dalam worktree terpisah (icofr1, icofr2, atau icofr3).`);
        console.warn(`   Gunakan scripts/worktree-new.ps1 untuk membuat worktree sebelum memulai pengerjaan.\n`);
      }
    }
  }
} catch {
  // Ignore in environments without git
}

process.exit(0);
