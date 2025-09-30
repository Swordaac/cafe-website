import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a client pointing to dummy values to avoid hard crash during local setup
    return createBrowserClient('http://localhost', 'public-anon-key')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}