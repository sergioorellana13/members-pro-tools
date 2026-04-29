'use client'

export default function PendingPage() {
  return (
    <div style={page}>
      <div style={card}>
        <img src="/logo.png" alt="logo" style={logo} />

        <h1 style={title}>Pending Approval</h1>
        <div style={goldLine} />

        <p style={text}>
          Your account has been created successfully. Access will be available once an administrator approves your account.
        </p>

        <button onClick={() => window.location.href = '/'} style={goldButton}>
          Back to Login
        </button>
      </div>
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
  width: 500,
  background: '#0f172a',
  borderRadius: 28,
  padding: 38,
  boxShadow: '0 24px 70px rgba(15,23,42,0.25)',
  color: '#f9fafb',
  textAlign: 'center'
}

const logo = { width: 170, marginBottom: 24 }
const title = { textTransform: 'uppercase', letterSpacing: 1.5 }
const goldLine = { width: 64, height: 3, background: '#c9a86a', margin: '14px auto 24px' }
const text = { color: '#cbd5e1', lineHeight: 1.6 }

const goldButton = {
  padding: 14,
  background: '#c9a86a',
  color: '#111827',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: 20
}