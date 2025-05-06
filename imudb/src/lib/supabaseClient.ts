// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://egafcjssrrowwffyofdp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWZjanNzcnJvd3dmZnlvZmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzU5ODQsImV4cCI6MjA2MDIxMTk4NH0.PD6fcGHUKtFSlCr0VSIjIsKFqhnnnzKZG2qdDmlTVWM'
);