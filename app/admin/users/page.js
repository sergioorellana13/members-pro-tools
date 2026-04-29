'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminUsersPage() {
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdmin()
  }, [])

  const loadAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      window.location.href = '/'
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()

    if (!profileData || profileData.role !== 'admin' || !profileData.approved) {
      window.location.href = '/dashboard'
      return
    }

    setProfile(profileData)
    await loadUsers()
    setLoading(false)
  }

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert('Error loading users: ' + error.message)
      return
    }

    setUsers(data || [])
  }

  const approveUser = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', id)

    if (error) {
      alert('Error approving user: ' + error.message)
      return
    }

    await loadUsers()
  }

  const blockUser = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: false })
      .eq('id', id)

    if (error) {
      alert('Error blocking user: ' + error.message)
      return
    }

    await loadUsers()
  }

  const makeAdmin = async (id) => {
    const confirmAdmin = confirm('Make this user an admin?')
    if (!confirmAdmin) return

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin', approved: true })
      .eq('id', id)

    if (error) {
      alert('Error updating role: ' + error.message)
      return
    }

    await loadUsers()
  }

  if (loading) {
    return <div style={page}>Loading admin panel...</div>
  }

  return (
    <div style={page}>
      <div style={topBrand}>
        <img src="/logo.png" alt="logo" style={logo} />

        <div>
          <h1 style={brandTitle}>User Approval</h1>
          <p style={brandSub}>Approve, block and manage internal access</p>
        </div>
      </div>

      <div style={shell}>
        <div style={header}>
          <div>
            <h2 style={sectionTitle}>Users</h2>
            <div style={goldLine} />
            <p style={muted}>Admin: {profile?.full_name || 'Administrator'}</p>
          </div>

          <button onClick={() => window.location.href = '/dashboard'} style={darkButton}>
            Dashboard
          </button>
        </div>

        {users.map((user) => (
          <div key={user.id} style={userCard}>
            <div>
              <h3 style={userName}>{user.full_name || 'Unnamed User'}</h3>
              <p style={userMeta}>
                Role: {user.role} · Status: {user.approved ? 'Approved' : 'Pending'}
              </p>
              <p style={smallId}>{user.id}</p>
            </div>

            <div style={actions}>
              {!user.approved && (
                <button onClick={() => approveUser(user.id)} style={greenButton}>
                  Approve
                </button>
              )}

              {user.approved && (
                <button onClick={() => blockUser(user.id)} style={redButton}>
                  Block
                </button>
              )}

              {user.role !== 'admin' && (
                <button onClick={() => makeAdmin(user.id)} style={goldButton}>
                  Make Admin
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const page = {
  minHeight: '100vh',
  background: '#ffffff',
  padding: 40,
  fontFamily: 'Helvetica Neue, Arial, sans-serif'
}

const topBrand = {
  maxWidth: 1150,
  margin: '0 auto 28px',
  display: 'flex',
  alignItems: 'center',
  gap: 24
}

const logo = { width: 170, objectFit: 'contain' }
const brandTitle = { margin: 0, color: '#111827', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 30 }
const brandSub = { color: '#6b7280', margin: '6px 0 0' }

const shell = {
  maxWidth: 1150,
  margin: '0 auto',
  background: '#0f172a',
  borderRadius: 28,
  padding: 34,
  border: '1px solid #1e293b',
  boxShadow: '0 24px 70px rgba(15,23,42,0.25)',
  color: '#f9fafb'
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap',
  marginBottom: 28
}

const sectionTitle = { margin: 0, textTransform: 'uppercase', letterSpacing: 1.4, color: '#f9fafb' }
const goldLine = { width: 64, height: 3, background: '#c9a86a', margin: '12px 0' }
const muted = { color: '#9ca3af', margin: 0 }

const userCard = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 18,
  padding: 20,
  marginBottom: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap'
}

const userName = { margin: 0, color: '#c9a86a' }
const userMeta = { color: '#9ca3af', margin: '8px 0' }
const smallId = { color: '#64748b', fontSize: 11, margin: 0 }

const actions = { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }

const darkButton = { padding: '12px 16px', background: '#374151', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const goldButton = { padding: '12px 16px', background: '#c9a86a', color: '#111827', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const greenButton = { padding: '12px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const redButton = { padding: '12px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }