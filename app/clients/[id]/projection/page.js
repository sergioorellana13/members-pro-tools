'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ProjectionPage({ params }) {
  const resolvedParams = React.use(params)
  const clientId = resolvedParams.id

  const [client, setClient] = useState(null)
  const [contracts, setContracts] = useState([])

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
      .select('*')
      .eq('client_id', clientId)
      .order('contract_label', { ascending: true })

    if (contractsError) {
      alert('Error loading contracts: ' + contractsError.message)
      return
    }

    setContracts(contractsData || [])
  }

  const money = (v) =>
    '$' + Number(v || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

  const numberFormat = (v) =>
    Number(v || 0).toLocaleString('en-US')

  const currentMonthYear = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const generateProjection = (contract) => {
    const years = Number(contract.years_remaining) || 0
    const increase = Number(contract.annual_maintenance_increase) || 0
    const base = (Number(contract.annual_points) || 0) * 0.525

    let rows = []

    for (let i = 0; i < years; i++) {
      const year = new Date().getFullYear() + i
      const value = base * Math.pow(1 + increase / 100, i)
      rows.push({ year, value })
    }

    return rows
  }

  const buildColumns = (projection) => {
    const columns = []

    for (let i = 0; i < projection.length; i += 10) {
      columns.push(projection.slice(i, i + 10))
    }

    return columns.slice(0, 5)
  }

  const nextTier = Number(client?.next_tier) || 0
  const rangeMax = nextTier > 0 ? nextTier - 1 : 0

  const combinedTotal = contracts.reduce((sum, contract) => {
    const projection = generateProjection(contract)
    return sum + projection.reduce((s, r) => s + r.value, 0)
  }, 0)

  const generatePDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const element = document.getElementById('pdf-report')

    html2pdf()
      .set({
        margin: 0.25,
        filename: 'Official_Projection_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'landscape'
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      })
      .from(element)
      .save()
  }

  const ReportCard = ({ isPdf = false }) => (
    <div
      id={isPdf ? 'pdf-report' : undefined}
      style={{
        width: isPdf ? '10.5in' : '100%',
        maxWidth: isPdf ? '10.5in' : 'none',
        background: '#111827',
        borderRadius: isPdf ? 0 : 18,
        padding: isPdf ? 28 : 35,
        border: isPdf ? 'none' : '1px solid #1f2937',
        color: '#f9fafb',
        position: 'relative',
        boxSizing: 'border-box',
        fontFamily: 'Helvetica Neue, Arial, sans-serif'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: isPdf ? 18 : 20,
          right: isPdf ? 22 : 25,
          fontSize: 11,
          color: '#9ca3af',
          letterSpacing: 1,
          opacity: 0.9
        }}
      >
        Last update: {currentMonthYear}
      </div>

      <div style={{ marginBottom: 24, paddingRight: 190 }}>
        <h1
          style={{
            fontSize: isPdf ? 21 : 26,
            margin: 0,
            marginBottom: 7,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 600
          }}
        >
          Projection for assessment incrementals
        </h1>

        <div
          style={{
            width: 64,
            height: 3,
            background: '#c9a86a',
            marginBottom: 12
          }}
        />

        <p
          style={{
            color: '#9ca3af',
            margin: 0,
            fontSize: isPdf ? 12 : 14,
            lineHeight: 1.45
          }}
        >
          All VPG contracts (1000 pts - {numberFormat(rangeMax)}) contracts from 2015-2025 capped at 7%, avg. Increase of 5%
        </p>
      </div>

      {contracts.map((contract) => {
        const projection = generateProjection(contract)
        const columns = buildColumns(projection)
        const total = projection.reduce((sum, r) => sum + r.value, 0)

        return (
          <div
            key={contract.id}
            style={{
              marginBottom: isPdf ? 24 : 40,
              pageBreakInside: 'avoid'
            }}
          >
            <h3
              style={{
                color: '#c9a86a',
                margin: '0 0 12px',
                fontSize: isPdf ? 14 : 18,
                letterSpacing: 0.5
              }}
            >
              Contract #{contract.contract_number}
            </h3>

            <div
              style={{
                display: 'flex',
                gap: isPdf ? 8 : 15,
                alignItems: 'stretch'
              }}
            >
              {columns.map((col, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: '#0f172a',
                    border: '1px solid #1f2937',
                    borderRadius: isPdf ? 8 : 12,
                    padding: isPdf ? 8 : 12,
                    minWidth: 0
                  }}
                >
                  {col.map((row) => (
                    <div
                      key={row.year}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: isPdf ? '4px 0' : '6px 0',
                        borderBottom: '1px solid #1f2937',
                        fontSize: isPdf ? 10.5 : 14,
                        lineHeight: 1.25
                      }}
                    >
                      <span>{row.year}</span>
                      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {money(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div
              style={{
                textAlign: 'right',
                marginTop: 10,
                fontWeight: 'bold',
                color: '#c9a86a',
                fontSize: isPdf ? 12 : 15
              }}
            >
              Contract Total: {money(total)}
            </div>
          </div>
        )
      })}

      <div
        style={{
          marginTop: isPdf ? 18 : 30,
          border: '2px solid #c9a86a',
          padding: isPdf ? 18 : 25,
          borderRadius: isPdf ? 10 : 14,
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          textAlign: 'right',
          pageBreakInside: 'avoid'
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#c9a86a',
            fontWeight: 'bold',
            letterSpacing: 1,
            fontSize: isPdf ? 11 : 14
          }}
        >
          Combined Promissory Note Balance
        </p>

        <h1
          style={{
            margin: '8px 0 0',
            fontSize: isPdf ? 28 : 36
          }}
        >
          {money(combinedTotal)}
        </h1>
      </div>
    </div>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'white',
        padding: 40,
        fontFamily: 'Helvetica Neue, Arial, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 1250,
          margin: '0 auto',
          display: 'flex',
          gap: 30,
          alignItems: 'flex-start'
        }}
      >
        <div
          style={{
            width: 250,
            minHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 20,
            paddingRight: 25,
            borderRight: '1px solid #e5e7eb'
          }}
        >
          <img
            src="/logo.png"
            alt="logo"
            style={{
              width: 220,
              objectFit: 'contain',
              marginBottom: 18
            }}
          />

          <div
            style={{
              width: 70,
              height: 3,
              background: '#c9a86a',
              marginBottom: 14
            }}
          />

          <div
            style={{
              fontSize: 11,
              color: '#6b7280',
              letterSpacing: 1.4,
              textAlign: 'center',
              textTransform: 'uppercase',
              lineHeight: 1.6
            }}
          >
            Member Assessment<br />
            Internal Review<br />
            Villa Group Access
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <ReportCard />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '-99999px',
          top: 0,
          background: 'white'
        }}
      >
        <ReportCard isPdf={true} />
      </div>

      <div
        style={{
          maxWidth: 1250,
          margin: '25px auto 0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}
      >
        <button
          onClick={() => window.location.href = `/clients/${clientId}`}
          style={{
            padding: '13px 18px',
            background: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Back to Client Detail
        </button>

        <button
          onClick={generatePDF}
          style={{
            padding: '13px 18px',
            background: '#c9a86a',
            color: '#111827',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Download Official Report
        </button>
      </div>
    </div>
  )
}