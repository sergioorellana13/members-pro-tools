'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ClientPage({ params }) {
  const resolvedParams = React.use(params)
  const clientId = resolvedParams.id

  const [client, setClient] = useState(null)
  const [contracts, setContracts] = useState([])
  const [showLoanModal, setShowLoanModal] = useState(false)

  useEffect(() => {
    getData()
  }, [])

  const getData = async () => {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError) {
      alert('Error loading client: ' + clientError.message)
      return
    }

    setClient(clientData)

    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('*, clients(full_name)')
      .eq('client_id', clientId)
      .order('contract_label', { ascending: true })

    if (contractsError) {
      alert('Error loading contracts: ' + contractsError.message)
      return
    }

    setContracts(contractsData || [])
  }

  const money = (value) => {
    const number = Number(value) || 0
    return '$' + number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const numberFormat = (value) => {
    const number = Number(value) || 0
    return number.toLocaleString('en-US')
  }

  const calculatePromissory = (contract) => {
    const annualPoints = Number(contract.annual_points) || 0
    const yearsRemaining = Number(contract.years_remaining) || 0
    const increase = Number(contract.annual_maintenance_increase) || 0
    const baseMaintenance = annualPoints * 0.525

    let total = 0

    for (let i = 0; i < yearsRemaining; i++) {
      total += baseMaintenance * Math.pow(1 + increase / 100, i)
    }

    return total
  }

  const calculateRemainingMonths = (lastPaymentDate) => {
    if (!lastPaymentDate) return 0

    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const end = new Date(lastPaymentDate)

    if (end < start) return 0

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1

    return Math.max(months, 0)
  }

  const calculateEstimatedInterest = (pendingBalance, interestRate, monthlyPayment, remainingMonths) => {
    let balance = Number(pendingBalance) || 0
    const monthlyRate = (Number(interestRate) || 0) / 100 / 12
    const payment = Number(monthlyPayment) || 0
    let totalInterest = 0

    if (balance <= 0 || monthlyRate <= 0 || remainingMonths <= 0) return 0

    for (let i = 0; i < remainingMonths; i++) {
      const interest = balance * monthlyRate
      totalInterest += interest
      balance = balance + interest - payment

      if (balance <= 0) break
    }

    return totalInterest
  }

  const totalAnnualPoints = contracts.reduce(
    (sum, c) => sum + (Number(c.annual_points) || 0),
    0
  )

  const totalMaintenanceFees = totalAnnualPoints * 0.525

  const totalPromissoryNoteBalance = contracts.reduce(
    (sum, c) => sum + calculatePromissory(c),
    0
  )

  return (
    <div style={page}>
      <div style={topBrand}>
        <img src="/logo.png" alt="logo" style={logo} />

        <div>
          <h1 style={brandTitle}>Member Account Managing</h1>
          <p style={brandSub}>Contract review and projection system</p>
        </div>
      </div>

      <div style={shell}>
        {client && (
          <div style={header}>
            <div>
              <h2 style={clientName}>{client.full_name}</h2>
              <div style={goldLine} />
              <p style={clientMeta}>
                Beneficiaries: {client.beneficiaries} · Prior presentations:{' '}
                {client.prior_presentations} · Next Tier:{' '}
              </p>
            </div>

            <div style={actions}>
              <button
                style={blueButton}
                onClick={() => window.location.href = `/clients/${clientId}/notes`}
              >
                Notes
              </button>

              <button
                style={goldButton}
                onClick={() => window.location.href = `/clients/${clientId}/edit`}
              >
                Edit Client
              </button>

              <button
                style={goldButton}
                onClick={() => setShowLoanModal(true)}
              >
                Loan Management
              </button>

              <button
                style={darkButton}
                onClick={() => window.location.href = '/dashboard'}
              >
                Dashboard
              </button>
            </div>
          </div>
        )}

        <h2 style={sectionTitle}>Contracts</h2>

        {contracts.length === 0 && (
          <div style={emptyBox}>No contracts found for this client.</div>
        )}

        {contracts.map((c) => {
          const annualPoints = Number(c.annual_points) || 0
          const contractYears = Number(c.contract_years) || 0
          const yearsRemaining = Number(c.years_remaining) || 0
          const totalPaid = Number(c.total_paid) || 0
          const priorPresentations = Number(client?.prior_presentations) || 0

          const totalPointsPurchased = annualPoints * contractYears
          const remainingPoints = annualPoints * yearsRemaining
          const maintenanceFee = annualPoints * 0.525
          const promissoryNoteBalance = calculatePromissory(c)

          const originalPricePerPoint =
            totalPointsPurchased > 0 ? totalPaid / totalPointsPurchased : 0

          const currentPricePerPoint =
            originalPricePerPoint +
            Number(client?.price_per_point_increase || 0) * priorPresentations

          return (
            <div key={c.id} style={contractCard}>
              <div style={contractHeader}>
                <div>
                  <h3 style={contractTitle}>Contract #{c.contract_number}</h3>
                  <p style={contractMeta}>
                    Purchase Date: {c.purchase_date || 'N/A'} · Years Remaining:{' '}
                    {yearsRemaining}
                  </p>
                </div>

                <div style={pointsBadge}>
                  {numberFormat(annualPoints)} annual pts
                </div>
              </div>

              <div style={grid}>
                <Metric label="Total Points Purchased" value={numberFormat(totalPointsPurchased)} />
                <Metric label="Remaining Points" value={numberFormat(remainingPoints)} />
                <Metric label="Investment to date" value={money(totalPaid)} />
                <Metric label="Current Maintenance Fee" value={money(maintenanceFee)} />
                <Metric label="Promissory Note Balance" value={money(promissoryNoteBalance)} />
                <Metric label="Original Price Per Point" value={money(originalPricePerPoint)} />
                <Metric label="Current Price Per Point" value={money(currentPricePerPoint)} />
              </div>
            </div>
          )
        })}

        {contracts.length > 1 && (
          <div style={summaryBox}>
            <h3 style={summaryTitle}>Combined Contract Summary</h3>

            <div style={grid}>
              <Metric label="Total Annual Points" value={numberFormat(totalAnnualPoints)} />
              <Metric label="Current Maintenance Fees" value={money(totalMaintenanceFees)} />
              <Metric label="Promissory Note Balance" value={money(totalPromissoryNoteBalance)} />
            </div>
          </div>
        )}

        <button
          style={projectionButton}
          onClick={() => window.location.href = `/clients/${clientId}/projection`}
        >
          Review Official Projection
        </button>
      </div>

      {showLoanModal && (
        <div style={overlay}>
          <div style={loanModal}>
            <button
              style={xButton}
              onClick={() => setShowLoanModal(false)}
            >
              ×
            </button>

            <h2 style={modalTitle}>Loan Management</h2>
            <div style={goldLine} />

            {contracts.length === 0 && (
              <div style={emptyBox}>No contracts found for this client.</div>
            )}

            {contracts.map((c) => {
              const pending = Number(c.pending_balance || 0)
              const rate = Number(c.interest_rate || 0)
              const monthly = Number(c.current_monthly_payment || 0)
              const remainingMonths = calculateRemainingMonths(c.last_payment_date)
              const estimatedInterest = calculateEstimatedInterest(
                pending,
                rate,
                monthly,
                remainingMonths
              )

              return (
                <div key={c.id} style={loanCard}>
                  <h3 style={contractTitle}>Contract #{c.contract_number}</h3>

                  <div style={grid}>
                    <Metric
                      label="Pending Balance"
                      value={pending <= 0 ? 'Paid in Full' : money(pending)}
                    />
                    <Metric
                      label="Interest Rate"
                      value={`${rate}%`}
                    />
                    <Metric
                      label="Remaining Months"
                      value={remainingMonths}
                    />
                    <Metric
                      label="Current Monthly Payment"
                      value={money(monthly)}
                    />
                  </div>

                  <div style={interestBox}>
                    <div style={metricLabel}>Estimated Interest Over Remaining Term</div>
                    <div style={interestValue}>{money(estimatedInterest)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div style={metricBox}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
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
  boxShadow: '0 24px 70px rgba(15,23,42,0.25)'
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  alignItems: 'flex-start',
  marginBottom: 30
}

const clientName = {
  margin: 0,
  color: '#c9a86a',
  fontSize: 28
}

const goldLine = {
  width: 70,
  height: 3,
  background: '#c9a86a',
  margin: '12px 0'
}

const clientMeta = {
  color: '#9ca3af',
  marginTop: 8
}

const actions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
}

const sectionTitle = {
  marginTop: 0,
  textTransform: 'uppercase',
  letterSpacing: 1.4,
  color: '#f9fafb'
}

const contractCard = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 18,
  padding: 24,
  marginBottom: 22,
  boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
}

const contractHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap',
  marginBottom: 18
}

const contractTitle = {
  margin: 0,
  color: '#c9a86a',
  fontSize: 21
}

const contractMeta = {
  color: '#9ca3af',
  margin: '6px 0 0'
}

const pointsBadge = {
  background: '#0f172a',
  border: '1px solid #1f2937',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#c9a86a',
  fontWeight: 'bold'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14
}

const metricBox = {
  background: '#0f172a',
  border: '1px solid #1f2937',
  borderRadius: 12,
  padding: 16
}

const metricLabel = {
  color: '#9ca3af',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 6
}

const metricValue = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#f9fafb'
}

const summaryBox = {
  border: '2px solid #c9a86a',
  background: 'linear-gradient(135deg, #1f2937, #111827)',
  borderRadius: 18,
  padding: 24,
  marginTop: 30
}

const summaryTitle = {
  marginTop: 0,
  color: '#c9a86a'
}

const emptyBox = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 14,
  padding: 25,
  color: '#9ca3af',
  textAlign: 'center'
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

const blueButton = {
  padding: '12px 16px',
  background: '#2563eb',
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

const projectionButton = {
  width: '100%',
  padding: 16,
  marginTop: 20,
  fontSize: 15,
  background: '#c9a86a',
  color: '#111827',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  fontWeight: 'bold'
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  padding: 20
}

const loanModal = {
  width: 'min(900px, 96vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#0f172a',
  border: '1px solid #c9a86a',
  borderRadius: 24,
  padding: 28,
  position: 'relative',
  boxShadow: '0 30px 90px rgba(0,0,0,0.55)'
}

const xButton = {
  position: 'absolute',
  top: 16,
  right: 18,
  background: 'transparent',
  border: 'none',
  color: '#ffffff',
  fontSize: 34,
  cursor: 'pointer',
  lineHeight: 1
}

const modalTitle = {
  margin: 0,
  color: '#f9fafb',
  textTransform: 'uppercase',
  letterSpacing: 1.4,
  fontSize: 26
}

const loanCard = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 18,
  padding: 22,
  marginTop: 22
}

const interestBox = {
  marginTop: 16,
  padding: 18,
  background: 'linear-gradient(135deg, #1f2937, #111827)',
  border: '1px solid #c9a86a',
  borderRadius: 14
}

const interestValue = {
  color: '#c9a86a',
  fontSize: 24,
  fontWeight: 'bold'
}
