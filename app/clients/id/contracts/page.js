'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ContractsPage({ params }) {
  const clientId = params.id

  const emptyContract = (label) => ({
    contract_label: label,
    contract_number: '',
    annual_points: '',
    purchase_date: '',
    contract_years: '',
    pending_balance: '',
    interest_rate: '',
    current_monthly_payment: '',
    annual_maintenance_increase: '',
    years_remaining: '',
    total_paid: ''
  })

  const [contracts, setContracts] = useState([
    emptyContract(1),
    emptyContract(2),
    emptyContract(3)
  ])

  const updateContract = (index, field, value) => {
    const copy = [...contracts]
    copy[index][field] = value
    setContracts(copy)
  }

  const saveContracts = async () => {
    const validContracts = contracts
      .filter(c => c.contract_number.trim() !== '')
      .map(c => ({
        client_id: clientId,
        contract_label: c.contract_label,
        contract_number: c.contract_number,
        annual_points: Number(c.annual_points),
        purchase_date: c.purchase_date || null,
        contract_years: Number(c.contract_years),
        pending_balance: Number(c.pending_balance),
        interest_rate: Number(c.interest_rate),
        current_monthly_payment: Number(c.current_monthly_payment),
        annual_maintenance_increase: Number(c.annual_maintenance_increase),
        years_remaining: Number(c.years_remaining),
        total_paid: Number(c.total_paid)
      }))

    if (validContracts.length === 0) {
      alert('Agrega al menos un contrato')
      return
    }

    const { error } = await supabase
      .from('contracts')
      .insert(validContracts)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Contratos guardados')
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>Contracts</h1>

      {contracts.map((contract, index) => (
        <div
          key={index}
          style={{
            border: '1px solid #ccc',
            padding: 20,
            marginBottom: 20
          }}
        >
          <h2>Contract {index + 1}</h2>

          <input placeholder="Contract number" onChange={(e) => updateContract(index, 'contract_number', e.target.value)} />
          <br /><br />

          <input placeholder="Annual points" onChange={(e) => updateContract(index, 'annual_points', e.target.value)} />
          <br /><br />

          <input type="date" placeholder="Purchase date" onChange={(e) => updateContract(index, 'purchase_date', e.target.value)} />
          <br /><br />

          <input placeholder="Years of contract" onChange={(e) => updateContract(index, 'contract_years', e.target.value)} />
          <br /><br />

          <input placeholder="Pending balance USD" onChange={(e) => updateContract(index, 'pending_balance', e.target.value)} />
          <br /><br />

          <input placeholder="Interest rate %" onChange={(e) => updateContract(index, 'interest_rate', e.target.value)} />
          <br /><br />

          <input placeholder="Current monthly payment USD" onChange={(e) => updateContract(index, 'current_monthly_payment', e.target.value)} />
          <br /><br />

          <input placeholder="Annual maintenance increase %" onChange={(e) => updateContract(index, 'annual_maintenance_increase', e.target.value)} />
          <br /><br />

          <input placeholder="Years remaining" onChange={(e) => updateContract(index, 'years_remaining', e.target.value)} />
          <br /><br />

          <input placeholder="Total paid USD" onChange={(e) => updateContract(index, 'total_paid', e.target.value)} />
        </div>
      ))}

      <button onClick={saveContracts} style={{ padding: 12 }}>
        Save Contracts
      </button>
    </div>
  )
}