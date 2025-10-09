// Configuration for API endpoints
export const config = {
  // Use environment variable if available, otherwise fallback based on environment
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://cafe-website-ce43.onrender.com/v1' 
      : 'http://localhost:4000/v1')
}
