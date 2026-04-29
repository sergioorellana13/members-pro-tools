'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const ACCESS_CODE = 'Salesheaven@'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const signup = async () => {
    setMessage('')
    setMessageType('')

    if (!fullName.trim() || !email.trim() || !password.trim() || !accessCode.trim()) {
      setMessage('Please complete all fields.')
      setMessageType('error')
      return
    }

    if (accessCode.trim() !== ACCESS_CODE) {
      setMessage('Invalid access code. Please contact the administrator.')
      setMessageType('error')
      return
    }

    setSaving(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    })

    if (error) {
      setSaving(false)

      if (error.message.includes('only request this after')) {
        setMessage('Security cooldown active. Please wait a few seconds and try again.')
      } else if (error.message.includes('email rate limit')) {
        setMessage('Email rate limit exceeded. Please wait a few minutes and try again.')
      } else {
        setMessage(error.message)
      }

      setMessageType('error')
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName.trim(),
          approved: true,
          role: 'seller'
        })

      if (profileError) {
        setSaving(false)
        setMessage(profileError.message)
        setMessageType('error')
        return
      }
    }

    setSaving(false)
    setMessage('Account created and approved. Redirecting to dashboard...')
    setMessageType('success')

    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1000)
  }

  return (
    <div style={page}>
      <div style={card}>
        <img src="/logo.png" alt="logo" style={logo} />

        <h1 style={title}>Request Access</h1>
        <div style={goldLine} />

        <p style={subtitle}>
          Create your internal account using the private access code provided by the administrator.
        </p>

        {message && (
          <div style={messageType === 'success' ? successBox : errorBox}>
            {message}
          </div>
        )}

        <Field label="Full Name" value={fullName} onChange={setFullName} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        <Field label="Access Code" value={accessCode} onChange={setAccessCode} type="password" onEnter={signup} />

        <button onClick={signup} disabled={saving} style={saving ? disabledButton : goldButton}>
          {saving ? 'Creating Account...' : 'Create Account'}
        </button>

        <button onClick={() => window.location.href = '/'} style={darkButton}>
          Back to Login
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
  width: 460,
  background: '#0f172a',
  borderRadius: 28,
  padding: 38,
  boxShadow: '0 24px 70px rgba(15,23,42,0.25)',
  color: '#f9fafb'
}

const logo = {
  width: 175,
  display: 'block',
  margin: '0 auto 24px',
  objectFit: 'contain'
}

const title = {
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: 1.7,
  fontSize: 30,
  margin: 0
}

const goldLine = {
  width: 64,
  height: 3,
  background: '#c9a86a',
  margin: '16px auto 22px'
}

const subtitle = {
  color: '#9ca3af',
  textAlign: 'center',
  lineHeight: 1.5,
  marginBottom: 28,
  fontSize: 14
}

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
  padding: 14,
  borderRadius: 12,
  border: '1px solid #374151',
  background: '#111827',
  color: '#f9fafb',
  outline: 'none',
  fontSize: 15
}

const goldButton = {
  width: '100%',
  padding: 14,
  background: '#c9a86a',
  color: '#111827',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: 8
}

const disabledButton = {
  ...goldButton,
  opacity: 0.6,
  cursor: 'not-allowed'
}

const darkButton = {
  width: '100%',
  padding: 14,
  background: '#374151',
  color: 'white',
  border: 'none',
  borderRadius: 12,
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
  fontSize: 14,
  lineHeight: 1.4
}

const successBox = {
  background: 'rgba(22,163,74,0.16)',
  border: '1px solid rgba(74,222,128,0.5)',
  color: '#bbf7d0',
  padding: 14,
  borderRadius: 14,
  marginBottom: 18,
  fontSize: 14,
  lineHeight: 1.4
}