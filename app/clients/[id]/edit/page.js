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

const cleanNumber = (value) => {
if (value === null || value === undefined) return 0
return Number(String(value).replace(/,/g, '').replace(/\$/g, '').trim() || 0)
}

const calculateYearsRemaining = (expirationDate) => {
if (!expirationDate) return 0

const today = new Date()
const expiration = new Date(expirationDate + 'T12:00:00')

let years = expiration.getFullYear() - today.getFullYear()
const monthDiff = expiration.getMonth() - today.getMonth()
const dayDiff = expiration.getDate() - today.getDate()

if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
years -= 1
}

return Math.max(years, 0)
}

const calculateContractYears = (purchaseDate, expirationDate) => {
if (!purchaseDate || !expirationDate) return 0

const purchase = new Date(purchaseDate + 'T12:00:00')
const expiration = new Date(expirationDate + 'T12:00:00')

let years = expiration.getFullYear() - purchase.getFullYear()
const monthDiff = expiration.getMonth() - purchase.getMonth()
const dayDiff = expiration.getDate() - purchase.getDate()

if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
years -= 1
}

return Math.max(years, 0)
}

const calculateEveryOtherYearStats = (contract) => {
const useFrequency = String(contract.use_frequency || 'annual').toLowerCase()
const annualPoints = cleanNumber(contract.annual_points)
const purchaseDate = contract.purchase_date
const expirationDate = contract.expiration_date

if (useFrequency !== 'odd' && useFrequency !== 'even') {
const years = cleanNumber(contract.contract_years)
const remainingYears = cleanNumber(contract.years_remaining)

return {
total_uses: 0,
remaining_uses: 0,
total_points_purchased: annualPoints * years,
remaining_points: annualPoints * remainingYears
}
}

if (!purchaseDate || !expirationDate) {
return {
total_uses: cleanNumber(contract.total_uses),
remaining_uses: cleanNumber(contract.remaining_uses),
total_points_purchased: annualPoints * cleanNumber(contract.total_uses),
remaining_points: annualPoints * cleanNumber(contract.remaining_uses)
}
}

const purchaseYear = new Date(purchaseDate + 'T12:00:00').getFullYear()
const expirationYear = new Date(expirationDate + 'T12:00:00').getFullYear()
const currentYear = new Date().getFullYear()

let firstUseYear = purchaseYear

if (useFrequency === 'odd' && firstUseYear % 2 === 0) {
firstUseYear += 1
}

if (useFrequency === 'even' && firstUseYear % 2 !== 0) {
firstUseYear += 1
}

let totalUses = 0
let remainingUses = 0

for (let year = firstUseYear; year <= expirationYear; year++) {
const isUseYear =
(useFrequency === 'odd' && year % 2 !== 0) ||
(useFrequency === 'even' && year % 2 === 0)

if (isUseYear) {
totalUses += 1
if (year >= currentYear) {
remainingUses += 1
}
}
}

return {
first_use_date: `${firstUseYear}-01-01`,
total_uses: totalUses,
remaining_uses: remainingUses,
total_points_purchased: annualPoints * totalUses,
remaining_points: annualPoints * remainingUses
}
}

const updateClient = (field, value) => {
setClient({
...client,
[field]: value
})
}

const updateContract = (index, field, value) => {
const copy = [...contracts]

let updated = {
...copy[index],
[field]: value
}

const purchaseDate = updated.purchase_date
const expirationDate = updated.expiration_date

if (purchaseDate && expirationDate) {
updated.contract_years = calculateContractYears(purchaseDate, expirationDate)
updated.years_remaining = calculateYearsRemaining(expirationDate)
}

if (field === 'expiration_date' && expirationDate) {
updated.years_remaining = calculateYearsRemaining(expirationDate)
}

const usageStats = calculateEveryOtherYearStats(updated)

updated = {
...updated,
...usageStats
}

copy[index] = updated
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
contract_years: '',
purchase_date: '',
expiration_date: '',
pending_balance: '',
interest_rate: '',
last_payment_date: '',
current_monthly_payment: '',
annual_maintenance_increase: '',
years_remaining: '',
total_paid: '',
use_frequency: 'annual',
first_use_date: '',
total_uses: 0,
remaining_uses: 0,
total_points_purchased: 0,
remaining_points: 0
}
])
}

const deleteContract = async (index) => {
const contract = contracts[index]
const confirmDelete = confirm('Delete this contract permanently?')
if (!confirmDelete) return

if (contract.id) {
const { data: deletedData, error } = await supabase
.from('contracts')
.delete()
.eq('id', contract.id)
.select()

if (error) {
alert('Error deleting contract: ' + error.message)
return
}

if (!deletedData || deletedData.length === 0) {
alert('Contract was not deleted. Check permissions or contract id.')
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
certificate_date: client.certificate_date || null,
price_freeze_number: Number(client.price_freeze_number || 0.35)
})
.eq('id', clientId)

if (clientError) {
setSaving(false)
alert('Error saving client: ' + clientError.message)
return
}

for (const c of contracts) {
const usageStats = calculateEveryOtherYearStats(c)

const payload = {
client_id: clientId,
contract_label: Number(c.contract_label || 0),
contract_number: c.contract_number || '',
annual_points: Number(c.annual_points || 0),
contract_years: Number(c.contract_years || 0),
purchase_date: c.purchase_date || null,
expiration_date: c.expiration_date || null,
pending_balance: Number(c.pending_balance || 0),
interest_rate: Number(c.interest_rate || 0),
last_payment_date: c.last_payment_date || null,
current_monthly_payment: Number(c.current_monthly_payment || 0),
annual_maintenance_increase: Number(c.annual_maintenance_increase || 0),
years_remaining: Number(c.years_remaining || 0),
total_paid: Number(c.total_paid || 0),
use_frequency: c.use_frequency || 'annual',
first_use_date: usageStats.first_use_date || c.first_use_date || null,
total_uses: Number(usageStats.total_uses || 0),
remaining_uses: Number(usageStats.remaining_uses || 0),
total_points_purchased: Number(usageStats.total_points_purchased || 0),
remaining_points: Number(usageStats.remaining_points || 0)
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

<Field
label="Price Freeze Number"
value={client.price_freeze_number ?? '0.35'}
onChange={(v) => updateClient('price_freeze_number', v)}
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
label="Use Frequency"
value={contract.use_frequency || 'annual'}
onChange={(v) => updateContract(index, 'use_frequency', v.toLowerCase())}
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
label="Expiration Date"
type="date"
value={contract.expiration_date || ''}
onChange={(v) => updateContract(index, 'expiration_date', v)}
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

<ReadOnlyField
label="First Use Date"
value={contract.first_use_date || 'Annual'}
/>

<ReadOnlyField
label="Total Uses"
value={contract.use_frequency === 'odd' || contract.use_frequency === 'even'
? contract.total_uses
: contract.contract_years}
/>

<ReadOnlyField
label="Remaining Uses"
value={contract.use_frequency === 'odd' || contract.use_frequency === 'even'
? contract.remaining_uses
: contract.years_remaining}
/>

<ReadOnlyField
label="Total Points Purchased"
value={contract.total_points_purchased}
/>

<ReadOnlyField
label="Remaining Points"
value={contract.remaining_points}
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

const readOnlyStyle = {
width: '100%',
boxSizing: 'border-box',
padding: 13,
borderRadius: 10,
border: '1px solid #374151',
background: '#1f2937',
color: '#c9a86a',
fontWeight: 'bold',
minHeight: 43
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