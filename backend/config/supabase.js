const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Get Supabase client instance
const getSupabaseClient = () => {
  try {
    return initializeSupabase();
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

module.exports = {
  initializeSupabase,
  getSupabaseClient
};
