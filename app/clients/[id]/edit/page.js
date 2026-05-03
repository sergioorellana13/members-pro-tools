'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function EditClientPage({ params }) {
  const resolvedParams = React.use(params)
  const clientId = resolvedParams.id

  const [client, setClient] = useState(null)
  const [contracts, setContracts] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError) {
      alert('Error loading client: ' + clientError.message)
      return
    }

    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('client_id', clientId)
      .order('contract_label', { ascending: true })

    if (contractsError) {
      alert('Error loading contracts: ' + contractsError.message)
      return
    }

    setClient(clientData)
    setContracts(contractsData || [])
  }

  const updateClient = (field, value) => {
    setClient({
      ...client,
      [field]: value
    })
  }

  const updateContract = (index, field, value) => {
    const copy = [...contracts]
    copy[index] = {
      ...copy[index],
      [field]: value
    }
    setContracts(copy)
  }

  const addContract = () => {
    const nextLabel = contracts.length + 1

    setContracts([
      ...contracts,
      {
        id: null,
        client_id: clientId,
        contract_label: nextLabel,
        contract_number: '',
        annual_points: '',
        purchase_date: '',
        pending_balance: '',
        interest_rate: '',
        last_payment_date: '',
        current_monthly_payment: '',
        annual_maintenance_increase: '',
        years_remaining: '',
        total_paid: ''
      }
    ])
  }

  const deleteContract = async (index) => {
    const contract = contracts[index]

    if (contract.id) {
      const confirmDelete = confirm('Delete this contract permanently?')
      if (!confirmDelete) return

      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id)

      if (error) {
        alert('Error deleting contract: ' + error.message)
        return
      }
    }

    const copy = contracts.filter((_, i) => i !== index)
    setContracts(copy)
  }

  const saveChanges = async () => {
    setSaving(true)

    const { error: clientError } = await supabase
      .from('clients')
      .update({
        full_name: client.full_name,
        beneficiaries: Number(client.beneficiaries || 0),
        prior_presentations: Number(client.prior_presentations || 0),
        next_tier: Number(client.next_tier || 0),
        price_per_point_increase: Number(client.price_per_point_increase || 0),
        benefits_to_add: client.benefits_to_add || '',
        certificate_date: client.certificate_date || null
      })
      .eq('id', clientId)

    if (clientError) {
      setSaving(false)
      alert('Error saving client: ' + clientError.message)
      return
    }

    for (const c of contracts) {
      const payload = {
        client_id: clientId,
        contract_label: Number(c.contract_label || 0),
        contract_number: c.contract_number || '',
        annual_points: Number(c.annual_points || 0),
        purchase_date: c.purchase_date || null,
        pending_balance: Number(c.pending_balance || 0),
        interest_rate: Number(c.interest_rate || 0),
        last_payment_date: c.last_payment_date || null,
        current_monthly_payment: Number(c.current_monthly_payment || 0),
        annual_maintenance_increase: Number(c.annual_maintenance_increase || 0),
        years_remaining: Number(c.years_remaining || 0),
        total_paid: Number(c.total_paid || 0)
      }

      if (c.id) {
        const { error } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', c.id)

        if (error) {
          setSaving(false)
          alert('Error saving contract: ' + error.message)
          return
        }
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert(payload)

        if (error) {
          setSaving(false)
          alert('Error adding contract: ' + error.message)
          return
        }
      }
    }

    setSaving(false)
    window.location.href = `/clients/${clientId}`
  }

  if (!client) {
    return (
      <div style={page}>
        <div style={shell}>Loading editor...</div>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={topBrand}>
        <img
          src="/logo.png"
          alt="logo"
          style={{
            width: 170,
            objectFit: 'contain'
          }}
        />

        <div>
          <h1 style={brandTitle}>Edit Member File</h1>
          <p style={brandSub}>Client and contract record management</p>
        </div>
      </div>

      <div style={shell}>
        <div style={sectionHeader}>
          <div>
            <h2 style={sectionTitle}>Client Information</h2>
            <div style={goldLine} />
          </div>

          <button
            onClick={() => window.location.href = '/dashboard'}
            style={darkButton}
          >
            Dashboard
          </button>
        </div>

        <div style={grid}>
          <Field
            label="Full Name"
            value={client.full_name}
            onChange={(v) => updateClient('full_name', v)}
          />

          <Field
            label="Beneficiaries"
            value={client.beneficiaries}
            onChange={(v) => updateClient('beneficiaries', v)}
          />

          <Field
            label="Prior Presentations"
            value={client.prior_presentations}
            onChange={(v) => updateClient('prior_presentations', v)}
          />

          <Field
            label="Price Per Point Increase"
            value={client.price_per_point_increase}
            onChange={(v) => updateClient('price_per_point_increase', v)}
          />

          <Field
            label="Benefits To Add"
            value={client.benefits_to_add}
            onChange={(v) => updateClient('benefits_to_add', v)}
          />

          <Field
            label="Next Tier"
            value={client.next_tier}
            onChange={(v) => updateClient('next_tier', v)}
          />

          <Field
            label="Certificate Date"
            type="date"
            value={client.certificate_date || ''}
            onChange={(v) => updateClient('certificate_date', v)}
          />
        </div>

        <div style={{ marginTop: 36 }}>
          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>Contracts</h2>
              <div style={goldLine} />
            </div>

            <button onClick={addContract} style={greenButton}>
              Add Contract
            </button>
          </div>

          {contracts.map((contract, index) => (
            <div key={contract.id || index} style={contractCard}>
              <div style={contractHeader}>
                <h3 style={{ margin: 0, color: '#c9a86a' }}>
                  Contract {index + 1}
                </h3>

                <button
                  onClick={() => deleteContract(index)}
                  style={redButton}
                >
                  Delete
                </button>
              </div>

              <div style={grid}>
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
                  label="Total Years"
                  value={contract.contract_years}
                  onChange={(v) => updateContract(index, 'contract_years', v)}
                />

                <Field
                  label="Purchase Date"
                  type="date"
                  value={contract.purchase_date || ''}
                  onChange={(v) => updateContract(index, 'purchase_date', v)}
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
                  value={contract.last_payment_date || ''}
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
                  label="Years Remaining"
                  value={contract.years_remaining}
                  onChange={(v) => updateContract(index, 'years_remaining', v)}
                />

                <Field
                  label="Total Paid USD"
                  value={contract.total_paid}
                  onChange={(v) => updateContract(index, 'total_paid', v)}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={footerActions}>
          <button
            onClick={() => window.location.href = `/clients/${clientId}`}
            style={darkButton}
          >
            Cancel
          </button>

          <button
            onClick={saveChanges}
            disabled={saving}
            style={goldButton}
          >
            {saving ? 'Saving...' : 'Save Complete File'}
          </button>
        </div>
      </div>
    </div>
  )
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

const page = {
  minHeight: '100vh',
  background: '#ffffff',
  padding: 40,
  fontFamily: 'Helvetica Neue, Arial, sans-serif',
  color: '#f9fafb'
}

const topBrand = {
  maxWidth: 1150,
  margin: '0 auto 28px',
  display: 'flex',
  alignItems: 'center',
  gap: 24
}

const brandTitle = {
  margin: 0,
  color: '#111827',
  textTransform: 'uppercase',
  letterSpacing: 1.4
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
  boxShadow: '0 24px 70px rgba(15,23,42,0.25)'
}

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  marginBottom: 22
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
  marginTop: 10
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 16
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
  marginBottom: 18
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
  background: '#111827',
  color: '#f9fafb',
  outline: 'none'
}

const footerActions = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 30
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