// Debugging script for FSLI significance logic
// Run this to verify if the server data is indeed filtered
import { api } from '../src/lib/api-client';

async function debugFSLI() {
  console.log('Fetching active simulation...');
  // Simulating the backend call logic found in BPMPage.tsx (activeSim query)
  // Since I cannot run the actual worker, I will simulate the structure based on types
  // You can run this in your environment or console
  
  // Assuming the user runs this in a browser console or a node script with access
  const list = await fetch('/api/simulations?year=2025').then(r => r.json());
  const activeSim = list.items.filter((s: any) => s.status === 'Approved')[0];

  if (!activeSim) {
    console.error('No approved simulation found!');
    return;
  }

  console.log('Significant Accounts count:', activeSim.significantAccounts?.length);
  activeSim.significantAccounts?.forEach((sa: any, i: number) => {
    console.log(`${i+1}: ${sa.name} (Balance: ${sa.balance})`);
  });
}

debugFSLI();
