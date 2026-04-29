'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    window.location.href = '/'
    return
  }

  const currentUser = userData.user
  setUser(currentUser)

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, approved')
    .eq('id', currentUser.id)
    .single()

  if (profileError || !profileData) {
    window.location.href = '/pending'
    return
  }

  setProfile(profileData)
}


  const handleSearch = async () => {
    const q = search.trim()

    if (!q) {
      setClients([])
      return
    }

    setLoading(true)

    const { data: clientsByName } = await supabase
      .from('clients')
      .select('*')
      .ilike('full_name', `%${q}%`)

    const { data: contractMatches } = await supabase
      .from('contracts')
      .select('client_id')
      .ilike('contract_number', `%${q}%`)

    const ids = [...new Set((contractMatches || []).map((c) => c.client_id))]

    let clientsByContract = []

    if (ids.length > 0) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .in('id', ids)

      clientsByContract = data || []
    }

    const combined = [...(clientsByName || []), ...clientsByContract]

    const unique = Array.from(
      new Map(combined.map((client) => [client.id, client])).values()
    )

    setClients(unique)
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica Neue, Arial, sans-serif',
        color: '#f9fafb'
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 28
          }}
        >
          <img
            src="/logo.png"
            alt="logo"
            style={{
              width: 180,
              objectFit: 'contain'
            }}
          />

          <div>
            <h1
              style={{
                margin: 0,
                color: '#111827',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                fontSize: 28
              }}
            >
              Members Pro Tools
            </h1>

            <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
              Villa Group Access Portal
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#0f172a',
            borderRadius: 28,
            padding: 34,
            boxShadow: '0 24px 70px rgba(15,23,42,0.25)',
            border: '1px solid #1e293b'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              alignItems: 'flex-start',
              marginBottom: 28
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  textTransform: 'uppercase',
                  letterSpacing: 1.4,
                  color: '#f9fafb'
                }}
              >
                Client Search
              </h2>

              <div
                style={{
                  width: 64,
                  height: 3,
                  background: '#c9a86a',
                  margin: '12px 0'
                }}
              />

              <p style={{ color: '#9ca3af', margin: 0 }}>
                {profile?.full_name || user?.email || 'Loading user'} · {profile?.role || 'loading'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.href = '/workspace'}
                style={goldButton}
              >
                Workspace
              </button>

              <button
                onClick={() => window.location.href = '/clients/new'}
                style={greenButton}
              >
                Add New
              </button>

              <button onClick={logout} style={darkButton}>
                Logout
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              background: '#111827',
              border: '1px solid #1f2937',
              padding: 16,
              borderRadius: 18,
              marginBottom: 26
            }}
          >
            <input
              placeholder="Search by contract number, surname or full name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                border: '1px solid #374151',
                background: '#0f172a',
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none'
              }}
            />

            <button onClick={handleSearch} style={goldButton}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {clients.length === 0 && (
            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 18,
                padding: 34,
                textAlign: 'center',
                color: '#9ca3af'
              }}
            >
              Search to display matching client records.
            </div>
          )}

          {clients.map((client) => (
            <div
              key={client.id}
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 18,
                padding: 22,
                marginBottom: 16,
                boxShadow: '0 12px 34px rgba(0,0,0,0.22)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20,
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: '#c9a86a',
                      fontSize: 22
                    }}
                  >
                    {client.full_name}
                  </h3>

                  <p style={{ margin: '8px 0 0', color: '#9ca3af' }}>
                    Beneficiaries: {client.beneficiaries} · Next Tier:{' '}
                    {Number(client.next_tier || 0).toLocaleString('en-US')} pts
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => window.location.href = `/clients/${client.id}`}
                    style={darkButton}
                  >
                    Open Contracts
                  </button>

                  <button
                    onClick={() => window.location.href = `/clients/${client.id}/notes`}
                    style={blueButton}
                  >
                    Read Notes
                  </button>

                  <button
                    onClick={() => window.location.href = `/clients/${client.id}/edit`}
                    style={goldButton}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const darkButton = {
  padding: '12px 16px',
  background: '#374151',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold'
}

const goldButton = {
  padding: '12px 16px',
  background: '#c9a86a',
  color: '#111827',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold'
}

const greenButton = {
  padding: '12px 16px',
  background: '#16a34a',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold'
}

const blueButton = {
  padding: '12px 16px',
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold'
}