import { createClient } from '@/lib/supabase'

/**
 * Robust sign out function that handles 403 errors and other issues
 * Falls back to clearing local state even if Supabase sign out fails
 */
export async function signOutUser(): Promise<void> {
  let supabaseSignOutSuccess = false
  
  try {
    const supabase = createClient()
    
    // Try to sign out from Supabase with a timeout
    const signOutPromise = supabase.auth.signOut()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sign out timeout')), 5000)
    )
    
    const result = await Promise.race([signOutPromise, timeoutPromise]) as any
    
    if (result?.error) {
      console.warn('Supabase sign out error:', result.error.message)
    } else {
      supabaseSignOutSuccess = true
    }
  } catch (error) {
    console.warn('Sign out error (continuing anyway):', error)
    // Don't throw - we'll handle this gracefully
  }
  
  // Always clear local storage and redirect, regardless of Supabase response
  try {
    // Clear all Supabase-related localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
    
    // Also clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (storageError) {
    console.warn('Error clearing storage:', storageError)
  }
  
  // If Supabase sign out failed, try the direct approach
  if (!supabaseSignOutSuccess) {
    try {
      await signOutUserDirect()
    } catch (error) {
      console.warn('Direct sign out also failed:', error)
    }
  }
  
  // Force redirect to home page
  window.location.href = '/'
}

/**
 * Alternative sign out that uses a more direct approach
 * This bypasses some potential CORS issues
 */
export async function signOutUserDirect(): Promise<void> {
  try {
    const supabase = createClient()
    
    // Try the signOut method with scope parameter
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    
    if (error) {
      console.warn('Direct sign out error:', error.message)
    }
  } catch (error) {
    console.warn('Direct sign out error (continuing anyway):', error)
  }
  
  // Clear local state
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })
  } catch (storageError) {
    console.warn('Error clearing localStorage:', storageError)
  }
  
  // Force redirect
  window.location.href = '/'
}

/**
 * Emergency fallback sign out that doesn't use Supabase at all
 * Use this if the 403 error persists
 */
export async function signOutUserFallback(): Promise<void> {
  try {
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear cookies (if possible)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  } catch (error) {
    console.warn('Error in fallback sign out:', error)
  }
  
  // Force redirect
  window.location.href = '/'
}
