'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ContractsPage({ params }) {
  const resolvedParams = React.use(params)
  const clientId = resolvedParams.id

  const [client, setClient] = useState(null)
  const [contracts, setContracts] = useState([
    createEmptyContract(1)
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClient()
  }, [])

  const loadClient = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      alert('Error loading client: ' + error.message)
      return
    }

    setClient(data)
  }

  const calculateYearsRemaining = (expirationDate) => {
    if (!expirationDate) return 0

    const today = new Date()
    const expiration = new Date(expirationDate + 'T12:00:00')

    let years = expiration.getFullYear() - today.getFullYear()

    const monthDifference = expiration.getMonth() - today.getMonth()
    const dayDifference = expiration.getDate() - today.getDate()

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      years -= 1
    }

    return Math.max(years, 0)
  }

  const updateContract = (index, field, value) => {
    const copy = [...contracts]

    copy[index] = {
      ...copy[index],
      [field]: value
    }

    if (field === 'expiration_date') {
      copy[index].years_remaining = calculateYearsRemaining(value)
    }

    setContracts(copy)
  }

  const addContract = () => {
    setContracts([
      ...contracts,
      createEmptyContract(contracts.length + 1)
    ])
  }

  const removeContract = (index) => {
    if (contracts.length === 1) return
    setContracts(contracts.filter((_, i) => i !== index))
  }

  const saveContracts = async () => {
    setSaving(true)

    for (const contract of contracts) {
      if (!contract.contract_number.trim()) continue

      const { error } = await supabase.from('contracts').insert({
        client_id: clientId,
        contract_label: Number(contract.contract_label || 0),
        contract_number: contract.contract_number.trim(),
        annual_points: Number(contract.annual_points || 0),
        purchase_date: contract.purchase_date || null,
        expiration_date: contract.expiration_date || null,
        price_per_point_increase: Number(contract.price_per_point_increase || 0),
        benefits_to_add: contract.benefits_to_add || '',
        last_payment_date: contract.last_payment_date || null,
        pending_balance: Number(contract.pending_balance || 0),
        interest_rate: Number(contract.interest_rate || 0),
        current_monthly_payment: Number(contract.current_monthly_payment || 0),
        annual_maintenance_increase: Number(contract.annual_maintenance_increase || 0),
        years_remaining: calculateYearsRemaining(contract.expiration_date),
        total_paid: Number(contract.total_paid || 0),
        hidden_from_calendar: false
      })

      if (error) {
        setSaving(false)
        alert('Error saving contract: ' + error.message)
        return
      }
    }

    setSaving(false)
    window.location.href = `/clients/${clientId}`
  }

  return (
    <div style={page}>
      <div style={topBrand}>
        <img src="/logo.png" alt="logo" style={logo} />

        <div>
          <h1 style={brandTitle}>Contract Entry</h1>
          <p style={brandSub}>Add member contracts and membership expiration data</p>
        </div>
      </div>

      <div style={shell}>
        <div style={header}>
          <div>
            <h2 style={sectionTitle}>{client?.full_name || 'Loading client...'}</h2>
            <div style={goldLine} />
            <p style={muted}>
              The system calculates years remaining automatically from the expiration date.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/dashboard'}
            style={darkButton}
          >
            Dashboard
          </button>
        </div>

        {contracts.map((contract, index) => (
          <div key={index} style={contractCard}>
            <div style={contractHeader}>
              <h3 style={contractTitle}>Contract {index + 1}</h3>

              {contracts.length > 1 && (
                <button
                  onClick={() => removeContract(index)}
                  style={redButton}
                >
                  Remove
                </button>
              )}
            </div>

            <div style={formGrid}>
              <Field
                label="Contract Number"
                value={contract.contract_number}
                onChange={(v) => updateContract(index, 'contract_number', v)}
              />

              <Field
                label="Annual Points"
                value={contract.annual_points}
                onChange={(v) => updateContract(index, 'annual_points', v)}
              />

              <Field
                label="Purchase Date"
                type="date"
                value={contract.purchase_date}
                onChange={(v) => updateContract(index, 'purchase_date', v)}
              />

              <Field
                label="Expiration Date"
                type="date"
                value={contract.expiration_date}
                onChange={(v) => updateContract(index, 'expiration_date', v)}
              />

              <ReadOnlyField
                label="Years Remaining"
                value={contract.years_remaining}
              />

              <Field
  label="Price Per Point Increase"
  value={contract.price_per_point_increase}
  onChange={(v) => updateContract(index, 'price_per_point_increase', v)}
/>

<Field
  label="Benefits To Add"
  value={contract.benefits_to_add}
  onChange={(v) => updateContract(index, 'benefits_to_add', v)}
/>

              <Field
                label="Pending Balance"
                value={contract.pending_balance}
                onChange={(v) => updateContract(index, 'pending_balance', v)}
              />

              <Field
                label="Interest Rate %"
                value={contract.interest_rate}
                onChange={(v) => updateContract(index, 'interest_rate', v)}
              />

<Field
  label="Last Payment"
  type="date"
  value={contract.last_payment_date}
  onChange={(v) => updateContract(index, 'last_payment_date', v)}
/>

              <Field
                label="Current Monthly Payment"
                value={contract.current_monthly_payment}
                onChange={(v) => updateContract(index, 'current_monthly_payment', v)}
              />

              <Field
                label="Annual Maintenance Increase %"
                value={contract.annual_maintenance_increase}
                onChange={(v) => updateContract(index, 'annual_maintenance_increase', v)}
              />

              <Field
                label="Total Paid USD"
                value={contract.total_paid}
                onChange={(v) => updateContract(index, 'total_paid', v)}
              />
            </div>
          </div>
        ))}

        <div style={footerActions}>
          <button onClick={addContract} style={greenButton}>
            Add Another Contract
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.href = `/clients/${clientId}`}
              style={darkButton}
            >
              Cancel
            </button>

            <button onClick={saveContracts} disabled={saving} style={goldButton}>
              {saving ? 'Saving...' : 'Save Contracts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function createEmptyContract(label) {
  return {
    contract_label: label,
    contract_number: '',
    annual_points: '',
    purchase_date: '',
    expiration_date: '',
    price_per_point_increase: '',
    benefits_to_add: '',
    last_payment_date: '',
    pending_balance: '',
    interest_rate: '',
    current_monthly_payment: '',
    annual_maintenance_increase: '',
    years_remaining: 0,
    total_paid: ''
  }
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={readOnlyStyle}>{value || 0}</div>
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

const logo = {
  width: 170,
  objectFit: 'contain'
}

const brandTitle = {
  margin: 0,
  color: '#111827',
  textTransform: 'uppercase',
  letterSpacing: 1.5,
  fontSize: 30
}

const brandSub = {
  color: '#6b7280',
  margin: '6px 0 0'
}

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

const sectionTitle = {
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: 1.4,
  color: '#f9fafb'
}

const goldLine = {
  width: 64,
  height: 3,
  background: '#c9a86a',
  margin: '12px 0'
}

const muted = {
  color: '#9ca3af',
  margin: 0
}

const contractCard = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 20,
  padding: 24,
  marginBottom: 22
}

const contractHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20
}

const contractTitle = {
  margin: 0,
  color: '#c9a86a',
  textTransform: 'uppercase',
  letterSpacing: 1
}

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 16
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
  padding: 13,
  borderRadius: 10,
  border: '1px solid #374151',
  background: '#0f172a',
  color: '#f9fafb',
  outline: 'none'
}

const readOnlyStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 13,
  borderRadius: 10,
  border: '1px solid #374151',
  background: '#1f2937',
  color: '#c9a86a',
  fontWeight: 'bold'
}

const footerActions = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 28
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
  padding: '12px 18px',
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

const redButton = {
  padding: '10px 14px',
  background: '#dc2626',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold'
}