'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    setProfile(profileData)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      {user && <p>Email: {user.email}</p>}
      {profile && <p>Role: {profile.role}</p>}
    </div>
  )
}
