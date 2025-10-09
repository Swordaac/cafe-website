'use client'

import { useEffect, useState } from 'react'

export function DebugEnv() {
  const [debugInfo, setDebugInfo] = useState({
    apiBaseUrl: 'Loading...',
    nodeEnv: 'Loading...',
    isClient: false,
    hasEnvVar: false
  })

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    try {
      setDebugInfo({
        apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'NOT_SET',
        nodeEnv: process.env.NODE_ENV || 'NOT_SET',
        isClient: true,
        hasEnvVar: !!process.env.NEXT_PUBLIC_API_URL
      })
    } catch (error) {
      console.error('Debug error:', error)
      setDebugInfo({
        apiBaseUrl: 'ERROR',
        nodeEnv: 'ERROR',
        isClient: true,
        hasEnvVar: false
      })
    }
  }, [])
  
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
