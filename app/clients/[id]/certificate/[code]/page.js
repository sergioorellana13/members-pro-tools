'use client'

import { useParams } from 'next/navigation'

export default function CertificatePage() {
  const { code } = useParams()

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div style={container}>
      <div style={card}>
        
        <img 
          src="/logo.png" 
          alt="Certificate Logo"
          style={logo}
        />

        <h2 style={title}>Verified Certificate</h2>

        <div style={line}></div>

        <p><strong>Promo type:</strong> Price Freeze Certificate</p>
        <p><strong>Code:</strong> {code}</p>
        <p><strong>Expires on:</strong> {today}</p>
        <p><strong>Authorization:</strong> CoVP33216</p>

      </div>
    </div>
  )
}
const container = {
  minHeight: '100vh',
  background: '#0f172a',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const card = {
  background: '#ffffff',
  padding: 30,
  borderRadius: 16,
  width: 340,
  textAlign: 'center',
  boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
}

const logo = {
  width: 90,
  marginBottom: 10
}

const title = {
  marginBottom: 10
}

const line = {
  height: 2,
  background: '#e5e7eb',
  margin: '15px 0'
}
