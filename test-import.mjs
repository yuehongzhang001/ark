// Load environment variables first
import { loadEnvLocal } from './__tests__/utils/envLoader.js';
loadEnvLocal();

console.log('Testing import');
import('./app/service/supabaseService.ts').then(m => {
  console.log('Module keys:', Object.keys(m));
  console.log('SupabaseService:', m.SupabaseService);
  if (m.SupabaseService) {
    console.log('Methods:', Object.getOwnPropertyNames(m.SupabaseService));
  }
}).catch(e => console.error(e));