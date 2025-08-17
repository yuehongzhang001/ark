// Load environment variables first
import { loadEnvLocal } from './__tests__/utils/envLoader.js';
loadEnvLocal();

console.log('Testing import in debug script');

// Dynamically import the SupabaseService
import('./app/service/supabaseService.ts').then(supabaseModule => {
  console.log('Module loaded');
  console.log('Module keys:', Object.keys(supabaseModule));
  
  const { SupabaseService } = supabaseModule;
  console.log('SupabaseService:', SupabaseService);
  
  if (SupabaseService) {
    console.log('Methods:', Object.getOwnPropertyNames(SupabaseService));
    console.log('upsertDailyPrices method exists:', typeof SupabaseService.upsertDailyPrices);
    
    // Try to call the method
    try {
      console.log('Attempting to call upsertDailyPrices...');
      const testPriceData = [{
        symbol: 'TSLA',
        date: '2023-01-01',
        price: 150.00,
        ts: Date.now()
      }];
      
      // This should work now
      console.log('About to call upsertDailyPrices');
      SupabaseService.upsertDailyPrices(testPriceData)
        .then(result => console.log('Success:', result))
        .catch(error => console.error('Error calling upsertDailyPrices:', error));
    } catch (e) {
      console.error('Exception when calling upsertDailyPrices:', e);
    }
  }
}).catch(e => console.error('Import error:', e));