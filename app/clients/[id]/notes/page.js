'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function NotesPage({ params }) {
  const resolvedParams = React.use(params)
  const clientId = resolvedParams.id

  const [client, setClient] = useState(null)
  const [profile, setProfile] = useState(null)
  const [notes, setNotes] = useState([])
  const [input, setInput] = useState('')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [savingSale, setSavingSale] = useState(false)

  const [saleForm, setSaleForm] = useState({
    liner: '',
    closer: '',
    triple: '',
    purchase_price: '',
    closing_cost: '',
    old_annual_points: '',
    new_annual_points: '',
    full_down: false,
    pender: false,
    out_of_pender_date: '',
    vlo: '',
    welcome_call_date: '',
    sale_type: 'upgrade',
    new_points_sold: '',
    years: ''
  })

  useEffect(() => {
    loadProfile()
    loadClient()
  }, [])

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      window.location.href = '/'
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()

    setProfile(data)
  }

  const loadClient = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      alert('Error loading notes: ' + error.message)
      return
    }

    setClient(data)
    setNotes(Array.isArray(data.notes) ? data.notes : [])
  }

  const getGrossVolume = () => {
    return Number(saleForm.purchase_price || 0) - Number(saleForm.closing_cost || 0)
  }

  const getNetVolume = () => {
    return getGrossVolume() / 1.16
  }

  const formatMoney = (value) => {
    return '$' + Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const addNote = () => {
    if (!input.trim()) return

    const newNote = {
      id: crypto.randomUUID(),
      text: input.trim(),
      author_name: profile?.full_name || 'Unknown User',
      created_at: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    setNotes([...notes, newNote])
    setInput('')
    setHasChanges(true)
  }

  const deleteNote = (noteId) => {
    setNotes(notes.filter((note) => note.id !== noteId))
    setHasChanges(true)
  }

const startEditingNote = (note) => {
setEditingNoteId(note.id)
setEditingNoteText(note.text || '')
}

const saveScannerNoteEdit = () => {
if (!editingNoteId) return

setNotes(notes.map((note) => {
if (note.id !== editingNoteId) return note

return {
...note,
text: editingNoteText
}
}))

setEditingNoteId(null)
setEditingNoteText('')
setHasChanges(true)
}

  const saveNotesAndExit = async () => {
    const { error } = await supabase
      .from('clients')
      .update({ notes })
      .eq('id', clientId)

    if (error) {
      alert('Error saving notes: ' + error.message)
      return
    }

    window.location.href = `/clients/${clientId}`
  }

  const updateSaleForm = (field, value) => {
    if (field === 'full_down') {
      setSaleForm({
        ...saleForm,
        full_down: value,
        pender: value ? false : saleForm.pender
      })
      return
    }

    if (field === 'pender') {
      setSaleForm({
        ...saleForm,
        pender: value,
        full_down: value ? false : saleForm.full_down
      })
      return
    }

    if (field === 'sale_type') {
      setSaleForm({
        ...saleForm,
        sale_type: value
      })
      return
    }

    const updated = {
  ...saleForm,
  [field]: value
}

const oldPoints =
  field === 'old_annual_points'
    ? Number(value || 0)
    : Number(updated.old_annual_points || 0)

const newPoints =
  field === 'new_annual_points'
    ? Number(value || 0)
    : Number(updated.new_annual_points || 0)

updated.new_points_sold =
  newPoints > oldPoints ? newPoints - oldPoints : 0

// limpiar fecha si no es pender
if (!updated.pender) {
  updated.out_of_pender_date = ''
}

setSaleForm(updated)
  }

  const addYearsToToday = (years) => {
    const today = new Date()
    const expiration = new Date(today)
    expiration.setFullYear(today.getFullYear() + Number(years || 0))

    return {
      purchaseDate: today.toISOString().split('T')[0],
      expirationDate: expiration.toISOString().split('T')[0]
    }
  }

  const updateContractAfterSale = async (sale) => {

  // 1. Obtener contrato actual
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('client_id', clientId)
    const contract = contracts?.[0]

  if (!contract) return null

  const previousPoints = contract.annual_points
  const previousType = contract.tour_type

  const newPoints = Number(sale.new_annual_points || 0)

  // 2. Actualizar contrato a Q
  await supabase
    .from('contracts')
    .update({
      annual_points: newPoints,
      tour_type: 'Q'
    })
    .eq('id', contract.id)

  // 3. Guardar rollback en la venta
  await supabase
    .from('sales')
    .update({
      previous_annual_points: previousPoints,
      previous_tour_type: previousType,
      upgraded_contract_id: contract.id,
      points_added: newPoints - previousPoints
    })
    .eq('id', sale.id)

  return {
    contractId: contract.id,
    previousPoints,
    previousType
  }

    const contract35 = (contracts || []).find((contract) =>
      String(contract.contract_number || '').startsWith('35-')
    )

    if (saleForm.sale_type === 'upgrade') {
      if (!contract35) {
        alert('Sale saved, but no 35- contract was found to upgrade.')
        return
      }

      await supabase
        .from('contracts')
        .update({
          annual_points: Number(contract35.annual_points || 0) + newPointsSold,
          contract_years: years,
          purchase_date: purchaseDate,
          expiration_date: expirationDate,
          years_remaining: years,
          tour_type: 'Q'
        })
        .eq('id', contract35.id)

      return
    }

    if (saleForm.sale_type === 'new') {
      if (contract35) {
        await supabase
          .from('contracts')
          .update({
            annual_points: Number(contract35.annual_points || 0) + newPointsSold,
            contract_years: years,
            purchase_date: purchaseDate,
            expiration_date: expirationDate,
            years_remaining: years,
            tour_type: 'Q'
          })
          .eq('id', contract35.id)

        return
      }

      await supabase.from('contracts').insert({
        client_id: clientId,
        contract_label: 35,
        contract_number: '35-AUTO',
        annual_points: newPointsSold,
        purchase_date: purchaseDate,
        expiration_date: expirationDate,
        contract_years: years,
        years_remaining: years,
        pending_balance: 0,
        interest_rate: 0,
        current_monthly_payment: 0,
        annual_maintenance_increase: 0,
        total_paid: 0,
        hidden_from_calendar: false,
        tour_type: 'Q'
      })
    }
  }

  const forceClientContractsToQ = async () => {
    await supabase
      .from('contracts')
      .update({ tour_type: 'Q' })
      .eq('client_id', clientId)
  }

  const saveSale = async () => {
    if (!saleForm.full_down && !saleForm.pender) {
      alert('Select Full Down or Pender.')
      return
    }

    if (saleForm.sale_type !== 'new' && saleForm.sale_type !== 'upgrade') {
      alert('Select New or Upgrade.')
      return
    }

    setSavingSale(true)

    const { data: userData } = await supabase.auth.getUser()

    const grossVolume = getGrossVolume()
    const netVolume = getNetVolume()

    const { data: insertedSale, error } = await supabase
  .from('sales')
  .insert({
      client_id: clientId,
      seller_id: userData.user.id,
      liner: saleForm.liner,
      closer: saleForm.closer,
      triple: saleForm.triple,
      purchase_price: Number(saleForm.purchase_price || 0),
      closing_cost: Number(saleForm.closing_cost || 0),
      gross_volume: grossVolume,
      net_volume: netVolume,
      old_annual_points: Number(saleForm.old_annual_points || 0),
      new_annual_points: Number(saleForm.new_annual_points || 0),
      full_down: saleForm.full_down,
      pender: saleForm.pender,
      out_of_pender_date: saleForm.out_of_pender_date || null,
      vlo: saleForm.vlo || null,
      welcome_call_date: saleForm.welcome_call_date || null,
      sale_type: saleForm.sale_type,
      new_points_sold: Number(saleForm.new_points_sold || 0),
      years: Number(saleForm.years || 0)
    })
    .select()
.single()

    if (error) {
      setSavingSale(false)
      alert('Error saving sale: ' + error.message)
      return
    }

    const rollback = await updateContractAfterSale(insertedSale)

if (insertedSale?.id) {
  await supabase
    .from('sales')
    .update({
      upgraded_contract_id: rollback.upgraded_contract_id,
      previous_annual_points: rollback.previous_annual_points,
      previous_tour_type: rollback.previous_tour_type,
      points_added: rollback.points_added
    })
    .eq('id', insertedSale.id)
}
    await forceClientContractsToQ()

    setSavingSale(false)
    setShowSaleModal(false)

    setSaleForm({
      liner: '',
      closer: '',
      triple: '',
      purchase_price: '',
      closing_cost: '',
      old_annual_points: '',
      new_annual_points: '',
      full_down: false,
      pender: false,
      out_of_pender_date: '',
      vlo: '',
      welcome_call_date: '',
      sale_type: 'upgrade',
      new_points_sold: '',
      years: ''
    })

    alert('Sale registered')
  }

  return (
    <div style={page}>
      <div style={topBrand}>
        <img src="/logo.png" alt="logo" style={logo} />

        <div>
          <h1 style={brandTitle}>Client Notes</h1>
          <p style={brandSub}>Follow-up record, sale execution and certificate access</p>
        </div>
      </div>

      <div style={shell}>
        <div style={header}>
          <div>
            <h2 style={clientName}>{client?.full_name || 'Loading client...'}</h2>
            <div style={goldLine} />
            <p style={clientMeta}>
              Notes archive · Internal follow-up file · {profile?.full_name || 'User'}
            </p>
          </div>

          <div style={actions}>
            {client?.pending_certificate_enabled!==false&& (
            <button
              onClick={() => window.location.href = `/clients/${clientId}/certificate`}
              style={pendingButton}
            >
              Pending Certificate
            </button>
            )}

            <button
  onClick={async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('annual_points')
      .eq('client_id', clientId)
      .like('contract_number', '35-%')
      .limit(1)
      .maybeSingle()

    if (error) {
      alert('Could not load current annual points: ' + error.message)
      return
    }

    const points = Number(data?.annual_points || 0)

    setSaleForm({
      ...saleForm,
      old_annual_points: String(points)
    })

    setShowSaleModal(true)
  }}
  style={executeButton}
>
  Execute
</button>

            <button
              onClick={() => window.location.href = `/clients/${clientId}`}
              style={darkButton}
            >
              Back
            </button>
          </div>
        </div>

        <div style={chatBox}>
          {notes.length === 0 && (
            <div style={emptyNotes}>
              No notes yet. Add the first internal follow-up note below.
            </div>
          )}

          {notes.map((note) => (
<div key={note.id} style={noteBubble}>

{editingNoteId === note.id ? (
<>
<input
type="text"
value={note.created_at || ''}
onChange={(e) => {
setNotes(notes.map((n) =>
n.id === note.id
? { ...n, created_at: e.target.value }
: n
))
setHasChanges(true)
}}
style={{
width: '100%',
marginBottom: 8,
padding: 10,
borderRadius: 10,
border: '1px solid #c9a86a',
background: '#111827',
color: 'white',
fontWeight: 'bold'
}}
/>

<input
type="text"
value={note.author_name || ''}
onChange={(e) => {
setNotes(notes.map((n) =>
n.id === note.id
? { ...n, author_name: e.target.value }
: n
))
setHasChanges(true)
}}
style={{
width: '100%',
marginBottom: 10,
padding: 10,
borderRadius: 10,
border: '1px solid #c9a86a',
background: '#111827',
color: 'white',
fontWeight: 'bold'
}}
/>

<textarea
value={editingNoteText}
autoFocus
onChange={(e) => {
setEditingNoteText(e.target.value)
setNotes(notes.map((n) =>
n.id === note.id
? { ...n, text: e.target.value }
: n
))
setHasChanges(true)
}}
style={{
...textarea,
marginBottom: 0,
minHeight: 140,
background: '#111827',
border: '1px solid #c9a86a'
}}
/>
</>
) : (
<>
<div style={noteDate}>
{note.created_at}
{note.author_name ? ` · ${note.author_name}` : ''}
</div>

<div
onClick={() => startEditingNote(note)}
style={{
...noteText,
cursor: 'text'
}}
>
{note.text}
</div>
</>
)}

<button onClick={() => deleteNote(note.id)} style={deleteNoteButton}>
Delete note
</button>

</div>
))}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a client note..."
          rows={4}
          style={textarea}
        />

        <div style={footerActions}>
          <button onClick={addNote} style={greenButton}>
            Submit Note
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.href = `/clients/${clientId}`}
              style={darkButton}
            >
              Exit Without Saving
            </button>

            <button onClick={saveNotesAndExit} style={goldButton}>
              Save and Exit
            </button>
          </div>
        </div>

        {hasChanges && <p style={unsavedText}>Unsaved note changes.</p>}
      </div>

      {showSaleModal && (
        <div style={overlay}>
          <div style={modal}>
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>Execute Sale</h2>
                <div style={goldLine} />
                <p style={modalSub}>{client?.full_name}</p>
              </div>

              <button onClick={() => setShowSaleModal(false)} style={xButton}>
                ×
              </button>
            </div>

            <div style={modalGrid}>
              <SaleField label="Front" value={saleForm.liner} onChange={(v) => updateSaleForm('liner', v)} />
              <SaleField label="Closer" value={saleForm.closer} onChange={(v) => updateSaleForm('closer', v)} />
              <SaleField label="Triple" value={saleForm.triple} onChange={(v) => updateSaleForm('triple', v)} />

              <SaleField label="Purchase Price" value={saleForm.purchase_price} onChange={(v) => updateSaleForm('purchase_price', v)} />
              <SaleField label="Closing Cost" value={saleForm.closing_cost} onChange={(v) => updateSaleForm('closing_cost', v)} />

              <ReadOnlyBox label="Sales Gross Volume" value={formatMoney(getGrossVolume())} />
              <ReadOnlyBox label="Net Volume" value={formatMoney(getNetVolume())} />

              <div>
  <label style={modalLabel}>Previous Annual Points</label>
  <input
    type="text"
    value={
      typeof saleForm.old_annual_points === 'object'
        ? ''
        : saleForm.old_annual_points || ''
    }
    onChange={(e) =>
      setSaleForm({
        ...saleForm,
        old_annual_points: e.target.value
      })
    }
    style={modalInput}
  />
</div>
              <SaleField label="New Annual Points" value={saleForm.new_annual_points} onChange={(v) => updateSaleForm('new_annual_points', v)} />

              <SaleField label="New Points Sold" value={saleForm.new_points_sold} onChange={(v) => updateSaleForm('new_points_sold', v)} />
              <SaleField label="Years" value={saleForm.years} onChange={(v) => updateSaleForm('years', v)} />

             {saleForm.pender && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 'bold', color: '#c9a86a' }}>
      Out of Pender Date
    </label>
    <input
      type="date"
      value={saleForm.out_of_pender_date}
      onChange={(e) => updateSaleForm('out_of_pender_date', e.target.value)}
      style={{
        padding: 12,
        borderRadius: 10,
        border: '1px solid #374151',
        background: '#111827',
        color: '#ffffff',
        fontWeight: 'bold'
      }}
    />
  </div>
)}
              <SaleField label="VLO" value={saleForm.vlo} onChange={(v) => updateSaleForm('vlo', v)} />
              <SaleField label="Welcome Call Date" type="date" value={saleForm.welcome_call_date} onChange={(v) => updateSaleForm('welcome_call_date', v)} />
            </div>

            <div style={checkRow}>
              <label style={checkLabel}>
                <input
                  type="checkbox"
                  checked={saleForm.full_down}
                  onChange={(e) => updateSaleForm('full_down', e.target.checked)}
                />
                Full Down
              </label>

              <label style={checkLabel}>
                <input
                  type="checkbox"
                  checked={saleForm.pender}
                  onChange={(e) => updateSaleForm('pender', e.target.checked)}
                />
                Pender
              </label>
            </div>

            <div style={checkRow}>
              <label style={checkLabel}>
                <input
                  type="checkbox"
                  checked={saleForm.sale_type === 'new'}
                  onChange={() => updateSaleForm('sale_type', 'new')}
                />
                New
              </label>

              <label style={checkLabel}>
                <input
                  type="checkbox"
                  checked={saleForm.sale_type === 'upgrade'}
                  onChange={() => updateSaleForm('sale_type', 'upgrade')}
                />
                Upgrade
              </label>
            </div>

            <div style={modalActions}>
              <button onClick={() => setShowSaleModal(false)} style={darkButton}>
                Cancel
              </button>

              <button onClick={saveSale} disabled={savingSale} style={greenButton}>
                {savingSale ? 'Saving...' : 'Submit Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

function SaleField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={modalLabel}>{label}</label>
      <input
        type={type}
        value={typeof value === 'object' ? '' : value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={modalInput}
      />
    </div>
  )
}

function ReadOnlyBox({ label, value }) {
  return (
    <div>
      <label style={modalLabel}>{label}</label>
      <div style={readOnlyBox}>{value}</div>
    </div>
  )
}

const page = { minHeight: '100vh', background: '#ffffff', padding: 40, fontFamily: 'Helvetica Neue, Arial, sans-serif', color: '#f9fafb' }
const topBrand = { maxWidth: 1050, margin: '0 auto 28px', display: 'flex', alignItems: 'center', gap: 24 }
const logo = { width: 170, objectFit: 'contain' }
const brandTitle = { margin: 0, color: '#111827', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 30 }
const brandSub = { color: '#6b7280', margin: '6px 0 0' }
const shell = { maxWidth: 1050, margin: '0 auto', background: '#0f172a', borderRadius: 28, padding: 34, border: '1px solid #1e293b', boxShadow: '0 24px 70px rgba(15,23,42,0.25)' }
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 26 }
const clientName = { margin: 0, color: '#c9a86a', fontSize: 27 }
const goldLine = { width: 64, height: 3, background: '#c9a86a', margin: '12px 0' }
const clientMeta = { color: '#9ca3af', margin: 0 }
const actions = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const chatBox = { minHeight: 360, maxHeight: 480, overflowY: 'auto', background: '#111827', border: '1px solid #1f2937', borderRadius: 18, padding: 18, marginBottom: 18 }
const emptyNotes = { color: '#9ca3af', textAlign: 'center', paddingTop: 130 }
const noteBubble = { background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: 14, marginBottom: 12 }
const noteDate = { color: '#c9a86a', fontSize: 12, marginBottom: 6, letterSpacing: 0.5 }
const noteText = { lineHeight: 1.5, whiteSpace: 'pre-wrap' }
const deleteNoteButton = { marginTop: 10, background: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 'bold' }
const textarea = { width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 14, border: '1px solid #374151', background: '#111827', color: 'white', resize: 'vertical', marginBottom: 14, outline: 'none' }
const footerActions = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }
const unsavedText = { color: '#facc15', marginTop: 15 }
const darkButton = { padding: '12px 16px', background: '#374151', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const goldButton = { padding: '12px 16px', background: '#c9a86a', color: '#111827', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const greenButton = { padding: '12px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const executeButton = greenButton
const pendingButton = { padding: '12px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', animation: 'blink 1s infinite' }
const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 10,
  zIndex: 9999
}

const modal = {
  width: '100%',
  maxWidth: 500,
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#0f172a',
  border: '1px solid #1f2937',
  borderRadius: 16,
  padding: 16,
  margin: '0 auto',
  boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
}
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }
const modalTitle = { margin: 0, textTransform: 'uppercase', letterSpacing: 1.4 }
const modalSub = { color: '#9ca3af', margin: 0 }
const xButton = { background: 'transparent', color: 'white', border: 'none', fontSize: 30, cursor: 'pointer' }
const modalGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 14
}
const modalLabel = { display: 'block', color: '#c9a86a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, fontWeight: 'bold' }
const modalInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 16,
  borderRadius: 12,
  border: '1px solid #374151',
  fontSize: 16,
  background: '#111827',
  color: 'white'
}
const readOnlyBox = { width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 10, border: '1px solid #374151', background: '#1f2937', color: '#c9a86a', fontWeight: 'bold' }
const checkRow = { display: 'flex', gap: 22, marginTop: 20, background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 14 }
const checkLabel = { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' }
const modalActions = {
  position: 'sticky',
  bottom: 0,
  background: '#0f172a',
  padding: '12px',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  borderTop: '1px solid #1f2937',
  marginTop: 20
}