// Configuration for API endpoints
export const config = {
  // Use environment variable if available, otherwise fallback to localhost for development
  apiBaseUrl: typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.props?.pageProps?.apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
  
  // For debugging
  get debugInfo() {
    return {
      apiBaseUrl: this.apiBaseUrl,
      isClient: typeof window !== 'undefined',
      nodeEnv: process.env.NODE_ENV,
      hasEnvVar: !!process.env.NEXT_PUBLIC_API_URL
    }
  }
}
