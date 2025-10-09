'use client'

import { config } from '@/lib/config'

export function DebugEnv() {
  const debugInfo = config.debugInfo
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      background: 'red', 
      color: 'white', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <div>API_URL: {debugInfo.apiBaseUrl}</div>
      <div>NODE_ENV: {debugInfo.nodeEnv}</div>
      <div>Is Client: {debugInfo.isClient ? 'Yes' : 'No'}</div>
      <div>Has Env Var: {debugInfo.hasEnvVar ? 'Yes' : 'No'}</div>
    </div>
  )
}
