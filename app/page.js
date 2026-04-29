'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const login = async () => {
    setMessage('')
    setLoading(true)

    await supabase.auth.signOut()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (error) {
      setLoading(false)
      setMessage(error.message)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setMessage('No approval profile found for this user.')
      return
    }

    if (!profile.approved) {
      window.location.href = '/pending'
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div style={page}>
      <div style={card}>
        <img src="/logo.png" alt="logo" style={logo} />

        <h1 style={title}>Members Pro Tools</h1>
        <div style={goldLine} />
        <p style={subtitle}>Villa Group Access Portal</p>

        {message && <div style={errorBox}>{message}</div>}

        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" onEnter={login} />

        <button onClick={login} disabled={loading} style={goldButton}>
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <button onClick={() => window.location.href = '/signup'} style={darkButton}>
          Request Access
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', onEnter }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) onEnter()
        }}
        style={inputStyle}
      />
    </div>
  )
}

const page = {
  minHeight: '100vh',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
  fontFamily: 'Helvetica Neue, Arial, sans-serif'
}

const card = {
  width: 440,
  background: '#0f172a',
  borderRadius: 28,
  padding: 36,
  boxShadow: '0 24px 70px rgba(15,23,42,0.25)',
  color: '#f9fafb'
}

const logo = { width: 170, display: 'block', margin: '0 auto 24px' }
const title = { textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }
const goldLine = { width: 64, height: 3, background: '#c9a86a', margin: '14px auto' }
const subtitle = { color: '#9ca3af', textAlign: 'center', marginBottom: 28 }

const labelStyle = {
  display: 'block',
  color: '#c9a86a',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 7,
  fontWeight: 'bold'
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 13,
  borderRadius: 10,
  border: '1px solid #374151',
  background: '#111827',
  color: '#f9fafb',
  outline: 'none'
}

const goldButton = {
  width: '100%',
  padding: 14,
  background: '#c9a86a',
  color: '#111827',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: 8
}

const darkButton = {
  width: '100%',
  padding: 14,
  background: '#374151',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: 12
}

const errorBox = {
  background: 'rgba(220,38,38,0.16)',
  border: '1px solid rgba(248,113,113,0.5)',
  color: '#fecaca',
  padding: 14,
  borderRadius: 14,
  marginBottom: 18,
  fontSize: 14
}