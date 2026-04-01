/**
 * Force Reload Mock Data Script
 * 
 * This script clears all existing data and forces re-seeding from mock-data.ts
 * Run this in browser console (F12 → Console) or use the button below
 */

async function forceReloadMockData() {
  console.log('🔄 Starting force reload of mock data...');
  
  try {
    // Clear localStorage
    console.log('🗑️ Clearing localStorage...');
    localStorage.clear();
    
    // Force re-seed from backend
    console.log('🔄 Triggering FORCE RE-SEED...');
    const seedResponse = await fetch('/api/dev/force-seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Role': 'Line 2'
      }
    });
    
    if (!seedResponse.ok) {
      throw new Error('Force seed failed: ' + seedResponse.statusText);
    }
    
    const seedResult = await seedResponse.json();
    console.log('✅ Force re-seed complete!');
    console.log('   - RCMs:', seedResult.rcmCount);
    console.log('   - Controls:', seedResult.controlCount);
    
    // Load and verify data
    console.log('🔄 Loading data to verify...');
    const response = await fetch('/api/rcm', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Role': 'Line 2'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ RCM data loaded:', data.data?.items?.length || 0, 'RCMs');
      
      // Load controls
      const controlsResponse = await fetch('/api/controls', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Role': 'Line 2'
        }
      });
      const controlsData = await controlsResponse.json();
      console.log('✅ Control data loaded:', controlsData.data?.items?.length || 0, 'controls');
      
      // Load deficiencies
      const deficienciesResponse = await fetch('/api/deficiencies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Role': 'Line 2'
        }
      });
      const deficienciesData = await deficienciesResponse.json();
      console.log('✅ Deficiency data loaded:', deficienciesData.data?.items?.length || 0, 'deficiencies');
      
      // Load risk library
      const riskResponse = await fetch('/api/risklibrary', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Role': 'Line 2'
        }
      });
      const riskData = await riskResponse.json();
      console.log('✅ Risk library loaded:', riskData.data?.items?.length || 0, 'risks');
      
      console.log('🎉 Force reload complete!');
      console.log('📊 Summary:');
      console.log('   - RCMs:', data.data?.items?.length || 0);
      console.log('   - Controls:', controlsData.data?.items?.length || 0);
      console.log('   - Deficiencies:', deficienciesData.data?.items?.length || 0);
      console.log('   - Risks:', riskData.data?.items?.length || 0);
      
      // Show first RCM as sample
      if (data.data?.items?.length > 0) {
        console.log('📋 Sample RCM (first one):');
        console.log(data.data.items[0]);
      }
      
      console.log('✅ Data loaded successfully!');
      console.log('ℹ️  DO NOT refresh - data is already loaded');
      console.log('👉 Navigate to /rcm to see the 8 coal mining RCMs');
      
      // DON'T auto-refresh - let user check console first
      // Commented out for debugging
      // setTimeout(() => {
      //   console.log('🔄 Auto-refreshing page...');
      //   window.location.reload();
      // }, 2000);
      
    } else {
      console.error('❌ Failed to load RCM data:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error during force reload:', error);
  }
}

// Auto-run if script is loaded
console.log('📦 Mock Data Force Reload Script Loaded');
console.log('👉 Run forceReloadMockData() in console to reload data');

// Export for global access
window.forceReloadMockData = forceReloadMockData;
