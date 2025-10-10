'use client'

import { config } from '@/lib/config'

export default function ApiDebug() {
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
      <div>API URL: {config.apiBaseUrl}</div>
      <div>NODE_ENV: {process.env.NODE_ENV}</div>
      <div>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'not set'}</div>
    </div>
  )
}
