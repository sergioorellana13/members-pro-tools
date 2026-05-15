'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
export default function WorkspacePage() {
const today = new Date()
const [user, setUser] = useState(null)
const [profile, setProfile] = useState(null)
const [month, setMonth] = useState(today.getMonth())
const [year, setYear] = useState(today.getFullYear())
const [sales, setSales] = useState([])
const [contracts, setContracts] = useState([])
const [allContracts, setAllContracts] = useState([])
const [loading, setLoading] = useState(false)
const [statAdjustments, setStatAdjustments] = useState([])
const [selectedSale, setSelectedSale] = useState(null)
const [selectedTour, setSelectedTour] = useState(null)
const [selectedDay, setSelectedDay] = useState(null)
const [saleDraft, setSaleDraft] = useState(null)
const [editMode, setEditMode] = useState(false)
const [showAddTour, setShowAddTour] = useState(false)
const [tourSearch, setTourSearch] = useState('')
const [tourMatches, setTourMatches] = useState([])
const [tourTypeForAdd, setTourTypeForAdd] = useState('Q')
const [showAddNote, setShowAddNote] = useState(false)
const [noteTarget, setNoteTarget] = useState(null)
const [noteInput, setNoteInput] = useState('')
const [showStatsModal, setShowStatsModal] = useState(false)
const [manualStats, setManualStats] = useState({
qs: '',
sales: '',
current_fulldown_volume: '',
current_pender_volume: '',
})
const [tourRoleForm, setTourRoleForm] = useState({
q_liner: '',
q_closer: '',
q_triple: ''
})
const emptySaleForm = {
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
years: '',
client_photo_url: ''
}
const [showAddSale, setShowAddSale] = useState(false)
const [newSaleForm, setNewSaleForm] = useState(emptySaleForm)
const [noTourDays, setNoTourDays] = useState([])
const [uploadingPhoto, setUploadingPhoto] = useState(false)
useEffect(() => {
loadWorkspace()
}, [month, year])
const formatDate = (date) => {
const y = date.getFullYear()
const m = String(date.getMonth() + 1).padStart(2, '0')
const d = String(date.getDate()).padStart(2, '0')
return `${y}-${m}-${d}`
}
const formatMoney = (value) =>
'$' +
Number(value || 0).toLocaleString('en-US', {
maximumFractionDigits: 0
})
const formatMoneyDetailed = (value) =>
'$' +
Number(value || 0).toLocaleString('en-US', {
minimumFractionDigits: 2,
maximumFractionDigits: 2
})
const getGrossVolumeFromForm = (form) => {
return Number(form.purchase_price || 0) - Number(form.closing_cost || 0)
}
const getNetVolumeFromForm = (form) => {
return getGrossVolumeFromForm(form) / 1.16
}
const getNetVolume = (sale) => {
if (sale.net_volume !== null && sale.net_volume !== undefined) {
return Number(sale.net_volume || 0)
}
const gross =
Number(sale.gross_volume || 0) ||
Number(sale.purchase_price || 0) - Number(sale.closing_cost || 0)
return gross / 1.16
}
const isManagerOrAdmin = () => {
return profile?.role === 'manager' || profile?.role === 'admin'
}
const getAssignedVolume = (sale) => {
const net = getNetVolume(sale)
if (profile?.role === 'manager') {
return net
}
const hasCloser = sale.closer && sale.closer.trim() !== ''
const hasTriple = sale.triple && sale.triple.trim() !== ''
if (!hasCloser && !hasTriple) return net * 0.70
if (hasCloser && !hasTriple) return (net * 0.80) / 2
if (hasCloser && hasTriple) return (net * 0.80) / 3
return 0
}
const getSalesYearRange = () => {
const fiscalStartYear =
today.getMonth() === 11 ? today.getFullYear() : today.getFullYear() - 1
return {
start: new Date(fiscalStartYear, 11, 1),
end: new Date(fiscalStartYear + 1, 10, 30, 23, 59, 59)
}
}
const loadWorkspace = async () => {
setLoading(true)
const { data: userData } = await supabase.auth.getUser()
if (!userData.user) {
window.location.href = '/'
return
}
const currentUser = userData.user
setUser(currentUser)
const { data: profileData } = await supabase
.from('profiles')
.select('*')
.eq('id', currentUser.id)
.single()
setProfile(profileData)
const monthStart = new Date(year, month, 1)
const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
const fiscal = getSalesYearRange()
let salesQuery = supabase
.from('sales')
.select('*, clients(full_name)')
.gte('created_at', fiscal.start.toISOString())
.lte('created_at', fiscal.end.toISOString())
if (profileData?.role !== 'manager' && profileData?.role !== 'admin') {
salesQuery = salesQuery.eq('seller_id', currentUser.id)
}
const { data: salesData, error: salesError } = await salesQuery
if (salesError) {
alert('Error loading sales: ' + salesError.message)
setLoading(false)
return
}
setSales(salesData || [])
const { data: adjustmentsData, error: adjustmentsError } = await supabase
.from('stat_adjustments')
.select('*')
// .eq('user_id', currentUser.id)
.gte('created_at', fiscal.start.toISOString())
.lte('created_at', fiscal.end.toISOString())
if (adjustmentsError) {
alert('Error loading stat adjustments: ' + adjustmentsError.message)
setLoading(false)
return
}
setStatAdjustments(adjustmentsData || [])
const { data: contractsData, error: contractsError } = await supabase
.from('contracts')
.select('*, clients(full_name)')
.gte('created_at', monthStart.toISOString())
.lte('created_at', monthEnd.toISOString())
.eq('hidden_from_calendar', false)
if (contractsError) {
alert('Error loading contracts: ' + contractsError.message)
setLoading(false)
return
}
const { data: noTourData, error: noTourError } = await supabase
.from('no_tour_days')
.select('*')
.gte('date', formatDate(monthStart))
.lte('date', formatDate(monthEnd))
if (noTourError) {
alert('Error loading no tour days: ' + noTourError.message)
setLoading(false)
return
}
setNoTourDays(noTourData || [])
setContracts(contractsData || [])
const { data: allContractsData } = await supabase
.from('contracts')
.select('*, clients(full_name)')
setAllContracts(allContractsData || [])
setLoading(false)
}
const monthName = new Date(year, month).toLocaleString('en-US', {
month: 'long'
})
const firstDay = new Date(year, month, 1).getDay()
const daysInMonth = new Date(year, month + 1, 0).getDate()
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const fiscal = getSalesYearRange()
const isSameMonth = (date) =>
date.getFullYear() === year && date.getMonth() === month
const isQTour = (contract) => {
return !contract.tour_type || contract.tour_type === 'Q'
}
const monthlySales = sales.filter((sale) =>
isSameMonth(new Date(sale.created_at))
)
const monthlyFullDownVolume = monthlySales
.filter((sale) => sale.full_down)
.reduce((sum, sale) => sum + getAssignedVolume(sale), 0)
const monthlyPenderVolume = monthlySales
.filter((sale) => sale.pender)
.reduce((sum, sale) => sum + getAssignedVolume(sale), 0)

// NO EJECUTABLE
// PRIORITY: MONTHLY TOTAL VOLUME KPI
// DO NOT DELETE
// Este KPI suma Full Down Assigned Volume + Pender Assigned Volume.
const monthlyTotalAssignedVolume =
monthlyFullDownVolume + monthlyPenderVolume

const monthlyTourClientIds = [
...new Set(
contracts
.filter((contract) => !contract.hidden_from_calendar && isQTour(contract))
.map((contract) => contract.client_id)
)
]
const monthlyTourCount = monthlyTourClientIds.length
const monthlySaleCount =
[
...new Set(
monthlySales
.filter((sale) => sale.full_down || sale.pender)
.map((sale) => sale.client_id)
)
].length
const monthlyClosingPercentage =
monthlyTourCount > 0 ? (monthlySaleCount / monthlyTourCount) * 100 : 0
const monthlyEfficiency =
monthlyTourCount > 0 ? monthlyTotalAssignedVolume / monthlyTourCount : 0
const yearFullDownVolume = sales
.filter((sale) => sale.full_down)
.reduce((sum, sale) => sum + getAssignedVolume(sale), 0)
const yearPenderVolume = sales
.filter((sale) => sale.pender)
.reduce((sum, sale) => sum + getAssignedVolume(sale), 0)
const manualYearQs = statAdjustments.reduce(
(sum, item) => sum + Number(item.qs || 0),
0
)
const manualYearSales = statAdjustments.reduce(
(sum, item) => sum + Number(item.sales || 0),
0
)
const manualYearFullDownVolume = statAdjustments.reduce(
(sum, item) => sum + Number(item.current_fulldown_volume || 0),
0
)
const manualYearPenderVolume = statAdjustments.reduce(
(sum, item) => sum + Number(item.current_pender_volume || 0),
0
)
const yearFullDownTotal = yearFullDownVolume + manualYearFullDownVolume
const yearPenderTotal = yearPenderVolume + manualYearPenderVolume

// NO EJECUTABLE
// PRIORITY: YEAR TOTAL VOLUME KPI
// DO NOT DELETE
// Este KPI suma Year Full Down + Year Pender, incluyendo ajustes manuales.
const yearTotalVolume = yearFullDownTotal + yearPenderTotal

const yearTourClientIds = [
...new Set(
allContracts
.filter((contract) => {
if (contract.hidden_from_calendar) return false
if (!isQTour(contract)) return false
const created = new Date(contract.created_at)
return created >= fiscal.start && created <= fiscal.end
})
.map((contract) => contract.client_id)
)
]
const yearTourCount = yearTourClientIds.length
const yearSaleCount = [
...new Set(
sales
.filter((sale) => sale.full_down || sale.pender)
.map((sale) => sale.client_id)
)
].length
const adjustedYearTourCount = yearTourCount + manualYearQs
const adjustedYearSaleCount = yearSaleCount + manualYearSales
const yearClosingPercentage =
adjustedYearTourCount > 0
? (adjustedYearSaleCount / adjustedYearTourCount) * 100
: 0
const yearEfficiency =
adjustedYearTourCount > 0 ? yearTotalVolume / adjustedYearTourCount : 0
const getAllContractsForClient = (clientId) => {
return allContracts
.filter((contract) => contract.client_id === clientId)
.map((contract) => contract.contract_number)
}
const getDayItems = (day) => {
const selectedDate = new Date(year, month, day)
const selectedString = formatDate(selectedDate)
const itemsByClient = new Map()
contracts.forEach((contract) => {
const created = new Date(contract.created_at)
const isThisDay =
created.getFullYear() === year &&
created.getMonth() === month &&
created.getDate() === day
if (!isThisDay) return
const key = contract.client_id
if (!itemsByClient.has(key)) {
itemsByClient.set(key, {
type: 'tour',
client_id: contract.client_id,
client_name: contract.clients?.full_name || 'Client',
contract_numbers: [],
contract_ids: [],
tour_type: contract.tour_type || 'Q',
tour_date: selectedString,
purchase_price: null,
status: null,
sale: null
})
}
itemsByClient.get(key).contract_numbers.push(contract.contract_number)
itemsByClient.get(key).contract_ids.push(contract.id)
})
sales.forEach((sale) => {
const created = new Date(sale.created_at)
const createdMatches =
created.getFullYear() === year &&
created.getMonth() === month &&
created.getDate() === day
const outMatches =
sale.pender && sale.out_of_pender_date === selectedString
if (!createdMatches && !outMatches) return
const key = sale.client_id
const saleContracts = getAllContractsForClient(sale.client_id)
if (!itemsByClient.has(key)) {
itemsByClient.set(key, {
type: 'sale',
client_id: sale.client_id,
client_name: sale.clients?.full_name || 'Client',
contract_numbers: saleContracts,
contract_ids: [],
tour_type: 'Q',
tour_date: selectedString,
purchase_price: Number(sale.purchase_price || 0),
status: sale.full_down ? 'full_down' : 'pender',
sale
})
} else {
const existing = itemsByClient.get(key)
itemsByClient.set(key, {
...existing,
type: 'sale',
tour_type: 'Q',
tour_date: selectedString,
purchase_price: Number(sale.purchase_price || 0),
status: sale.full_down ? 'full_down' : 'pender',
sale,
contract_numbers:
existing.contract_numbers.length > 0
? existing.contract_numbers
: saleContracts
})
}
})
const finalItems = Array.from(itemsByClient.values())
sales.forEach((sale) => {
if (!sale.welcome_call_date) return
if (sale.welcome_call_date !== selectedString) return
finalItems.push({
type: 'welcome_call',
client_id: sale.client_id,
client_name: sale.clients?.full_name || 'Client',
contract_numbers: getAllContractsForClient(sale.client_id),
contract_ids: [],
tour_type: 'Q',
tour_date: selectedString,
sale_date: formatDate(new Date(sale.created_at)),
purchase_price: Number(sale.purchase_price || 0),
status: null,
sale
})
})
const noTourForDay = noTourDays.filter((item) => {
const d = new Date(item.date + 'T12:00:00')
return (
d.getFullYear() === year &&
d.getMonth() === month &&
d.getDate() === day
)
})
noTourForDay.forEach((item) => {
finalItems.push({
type: 'no_tour',
id: item.id,
client_id: null,
client_name: 'NO TOUR',
contract_numbers: [],
contract_ids: [],
tour_type: 'NO TOUR',
tour_date: item.date,
purchase_price: null,
status: null,
sale: null
})
})
return finalItems
}
const getDayStatus = (items) => {
if (items.some((item) => item.status === 'full_down')) return 'full_down'
if (items.some((item) => item.status === 'pender')) return 'pender'
return null
}
const openDayBubble = (day) => {
setSelectedDay(day)
setShowAddTour(true)
setTourTypeForAdd('Q')
setTourSearch('')
setTourMatches([])
}
const searchTour = async () => {
const q = tourSearch.trim()
if (!q) {
setTourMatches([])
return
}
const { data: clientMatches } = await supabase
.from('clients')
.select('*')
.ilike('full_name', `%${q}%`)
const { data: contractMatches } = await supabase
.from('contracts')
.select('*, clients(full_name)')
.ilike('contract_number', `%${q}%`)
const clientIds = [
...new Set([
...(clientMatches || []).map((c) => c.id),
...(contractMatches || []).map((c) => c.client_id)
])
]
if (clientIds.length === 0) {
setTourMatches([])
return
}
const { data: contractsForClients } = await supabase
.from('contracts')
.select('*, clients(full_name)')
.in('client_id', clientIds)
const grouped = new Map()
;(contractsForClients || []).forEach((contract) => {
if (!grouped.has(contract.client_id)) {
grouped.set(contract.client_id, {
client_id: contract.client_id,
client_name: contract.clients?.full_name || 'Client',
contracts: []
})
}
grouped.get(contract.client_id).contracts.push(contract)
})
setTourMatches(Array.from(grouped.values()))
}
const addTourToDay = async (match) => {
if (!selectedDay) return
const selectedDateString = formatDate(new Date(year, month, selectedDay))
const safeTimestamp = `${selectedDateString}T12:00:00`
const ids = match.contracts.map((contract) => contract.id)
const { error } = await supabase
.from('contracts')
.update({
created_at: safeTimestamp,
hidden_from_calendar: false,
tour_type: tourTypeForAdd
})
.in('id', ids)
if (error) {
alert('Error adding tour: ' + error.message)
return
}
setShowAddTour(false)
setSelectedDay(null)
setTourSearch('')
setTourMatches([])
await loadWorkspace()
}
const addNoTourToDay = async () => {
if (!selectedDay || !user) return
const selectedDateString = formatDate(new Date(year, month, selectedDay))
const alreadyExists = noTourDays.some((item) => item.date === selectedDateString)
if (alreadyExists) {
alert('NO TOUR already exists for this day.')
return
}
const { error } = await supabase
.from('no_tour_days')
.insert({
user_id: user.id,
date: selectedDateString
})
if (error) {
alert('Error adding NO TOUR: ' + error.message)
return
}
setShowAddTour(false)
setSelectedDay(null)
await loadWorkspace()
}
const removeNoTourDay = async (id) => {
const confirmDelete = confirm('Remove NO TOUR for this day?')
if (!confirmDelete) return
const { error } = await supabase
.from('no_tour_days')
.delete()
.eq('id', id)
if (error) {
alert('Error removing NO TOUR: ' + error.message)
return
}
await loadWorkspace()
}
const openSaleBubble = (sale) => {
setSelectedSale(sale)
setSelectedTour(null)
setSaleDraft({
liner: sale.liner || '',
closer: sale.closer || '',
triple: sale.triple || '',
purchase_price: String(sale.purchase_price || ''),
closing_cost: String(sale.closing_cost || ''),
old_annual_points: String(sale.old_annual_points || ''),
new_annual_points: String(sale.new_annual_points || ''),
full_down: Boolean(sale.full_down),
pender: Boolean(sale.pender),
out_of_pender_date: sale.out_of_pender_date || '',
vlo: sale.vlo || '',
welcome_call_date: sale.welcome_call_date || '',
sale_type: sale.sale_type || 'upgrade',
new_points_sold: String(sale.new_points_sold || ''),
years: String(sale.years || '')
})
setEditMode(false)
}
const openTourBubble = (tour) => {
setSelectedTour(tour)
setSelectedSale(null)
setSaleDraft(null)
setEditMode(false)
setShowAddSale(false)
const currentAnnualPoints =
allContracts.find((contract) => contract.client_id === tour.client_id && String(contract.contract_number || '').startsWith('35-'))?.annual_points || ''
setNewSaleForm({
...emptySaleForm,
old_annual_points: String(currentAnnualPoints)
})
}
const closeBubble = () => {
setSelectedSale(null)
setSelectedTour(null)
setSelectedDay(null)
setSaleDraft(null)
setEditMode(false)
setShowAddTour(false)
setShowAddSale(false)
setShowAddNote(false)
setNoteTarget(null)
setNoteInput('')
setNewSaleForm(emptySaleForm)
}
const updateDraft = (field, value) => {
const updated = {
...saleDraft,
[field]: value
}
if (field === 'full_down') {
updated.full_down = value
updated.pender = value ? false : updated.pender
if (value) updated.out_of_pender_date = ''
}
if (field === 'pender') {
updated.pender = value
updated.full_down = value ? false : updated.full_down
}
if (field === 'sale_type') {
updated.sale_type = value
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
newPoints > oldPoints ? String(newPoints - oldPoints) : '0'
setSaleDraft(updated)
}
const updateNewSaleForm = (field, value) => {
const updated = {
...newSaleForm,
[field]: value
}
if (field === 'full_down') {
updated.full_down = value
updated.pender = value ? false : updated.pender
if (value) updated.out_of_pender_date = ''
}
if (field === 'pender') {
updated.pender = value
updated.full_down = value ? false : updated.full_down
}
if (field === 'sale_type') {
updated.sale_type = value
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
newPoints > oldPoints ? String(newPoints - oldPoints) : '0'
setNewSaleForm(updated)
}
const addYearsToDate = (baseDateString, years) => {
const base = new Date(`${baseDateString}T12:00:00`)
const expiration = new Date(base)
expiration.setFullYear(base.getFullYear() + Number(years || 0))
return {
purchaseDate: formatDate(base),
expirationDate: formatDate(expiration)
}
}
const updateContractsAfterSale = async (clientId, form, contractIds = [], saleDate = null) => {
const newPointsSold = Number(form.new_points_sold || 0)
const years = Number(form.years || 0)
const rollback = {
upgraded_contract_id: null,
previous_annual_points: 0,
previous_tour_type: null,
points_added: newPointsSold
}
const baseDate = saleDate || formatDate(new Date())
const { purchaseDate, expirationDate } = addYearsToDate(baseDate, years)
const { data: clientContracts, error } = await supabase
.from('contracts')
.select('*')
.eq('client_id', clientId)
if (error) {
alert('Sale saved, but contract update failed: ' + error.message)
return rollback
}
const contract35 = (clientContracts || []).find((contract) =>
String(contract.contract_number || '').startsWith('35-')
)
const originalTourType =
(clientContracts || []).find((c) => contractIds.includes(c.id))?.tour_type || 'Q'
rollback.previous_tour_type = originalTourType
if (newPointsSold > 0 && years > 0) {
if (contract35) {
rollback.upgraded_contract_id = contract35.id
rollback.previous_annual_points = Number(contract35.annual_points || 0)
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
} else if (form.sale_type === 'new') {
const { data: newContract } = await supabase
.from('contracts')
.insert({
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
.select()
.single()
rollback.upgraded_contract_id = newContract?.id || null
rollback.previous_annual_points = 0
}
}
if (contractIds.length > 0) {
await supabase
.from('contracts')
.update({ tour_type: 'Q' })
.in('id', contractIds)
}
return rollback
}
const saveSaleChanges = async () => {
if (!selectedSale || !saleDraft) return
const grossVolume = getGrossVolumeFromForm(saleDraft)
const netVolume = getNetVolumeFromForm(saleDraft)
const payload = {
liner: saleDraft.liner,
closer: saleDraft.closer,
triple: saleDraft.triple,
purchase_price: Number(saleDraft.purchase_price || 0),
closing_cost: Number(saleDraft.closing_cost || 0),
gross_volume: grossVolume,
net_volume: netVolume,
old_annual_points: Number(saleDraft.old_annual_points || 0),
new_annual_points: Number(saleDraft.new_annual_points || 0),
full_down: saleDraft.full_down,
pender: saleDraft.pender,
out_of_pender_date: saleDraft.out_of_pender_date || null,
vlo: saleDraft.vlo || null,
welcome_call_date: saleDraft.welcome_call_date || null,
sale_type: saleDraft.sale_type,
new_points_sold: Number(saleDraft.new_points_sold || 0),
years: Number(saleDraft.years || 0)
}
const { error } = await supabase
.from('sales')
.update(payload)
.eq('id', selectedSale.id)
if (error) {
alert('Error saving sale: ' + error.message)
return
}
await loadWorkspace()
closeBubble()
}
const uploadClientPhoto = async (file) => {
if (!file) return
try {
setUploadingPhoto(true)
const fileExt = file.name.split('.').pop()
const fileName = `${Date.now()}.${fileExt}`
const { error: uploadError } = await supabase.storage
.from('sale-photos')
.upload(fileName, file)
if (uploadError) {
alert('Error uploading image: ' + uploadError.message)
return
}
const { data } = supabase.storage
.from('sale-photos')
.getPublicUrl(fileName)
setNewSaleForm({
...newSaleForm,
client_photo_url: data.publicUrl
})
} catch (err) {
alert('Error uploading image')
} finally {
setUploadingPhoto(false)
}
}
const saveNewSaleFromTour = async () => {
if (!selectedTour || !user) return
if (!newSaleForm.full_down && !newSaleForm.pender) {
alert('Select Full Down or Pender.')
return
}
const saleDate = selectedTour.tour_date || formatDate(new Date(year, month, 1))
const safeTimestamp = `${saleDate}T12:00:00`
const grossVolume = getGrossVolumeFromForm(newSaleForm)
const netVolume = getNetVolumeFromForm(newSaleForm)
const { data: insertedSale, error } = await supabase
.from('sales')
.insert({
client_id: selectedTour.client_id,
seller_id: user.id,
liner: newSaleForm.liner,
closer: newSaleForm.closer,
triple: newSaleForm.triple,
purchase_price: Number(newSaleForm.purchase_price || 0),
closing_cost: Number(newSaleForm.closing_cost || 0),
gross_volume: grossVolume,
net_volume: netVolume,
old_annual_points: Number(newSaleForm.old_annual_points || 0),
new_annual_points: Number(newSaleForm.new_annual_points || 0),
full_down: newSaleForm.full_down,
pender: newSaleForm.pender,
out_of_pender_date: newSaleForm.out_of_pender_date || null,
vlo: newSaleForm.vlo || null,
welcome_call_date: newSaleForm.welcome_call_date || null,
sale_type: newSaleForm.sale_type || 'upgrade',
new_points_sold: Number(newSaleForm.new_points_sold || 0),
years: Number(newSaleForm.years || 0),
client_photo_url: newSaleForm.client_photo_url || null,
created_at: safeTimestamp
})
.select()
.single()
if (error) {
alert('Error adding sale: ' + error.message)
return
}
const rollback = await updateContractsAfterSale(
selectedTour.client_id,
newSaleForm,
selectedTour.contract_ids || [],
saleDate
)
if (insertedSale?.id) {
await supabase
.from('sales')
.update(rollback)
.eq('id', insertedSale.id)
}
await loadWorkspace()
closeBubble()
}
const cancelSale = async (saleParam = null) => {
const saleToCancel = saleParam || selectedSale
if (!saleToCancel?.id) {
alert('No sale selected to cancel.')
return
}
const confirmDelete = confirm('Cancel this sale?')
if (!confirmDelete) return
if (saleToCancel.upgraded_contract_id) {
const { error: contractError } = await supabase
.from('contracts')
.update({
annual_points: saleToCancel.previous_annual_points || 0,
tour_type: saleToCancel.previous_tour_type || 'Ct'
})
.eq('id', saleToCancel.upgraded_contract_id)
if (contractError) {
alert('Error restoring contract: ' + contractError.message)
return
}
}
const { data: deletedSale, error: deleteError } = await supabase
.from('sales')
.delete()
.eq('id', saleToCancel.id)
.select()
if (deleteError) {
alert('Error canceling sale: ' + deleteError.message)
return
}
if (!deletedSale || deletedSale.length === 0) {
alert('Sale was not deleted. Check permissions or sale id.')
return
}
alert('Sale cancelled and contract restored.')
await loadWorkspace()
closeBubble()
}
const hideTourFromCalendar = async () => {
if (!selectedTour) return
const confirmHide = confirm(
'Remove this tour from the calendar? This will not delete the client or contract records.'
)
if (!confirmHide) return
const ids = selectedTour.contract_ids || []
if (ids.length === 0) {
alert('No contract records found for this tour.')
return
}
const { error } = await supabase
.from('contracts')
.update({ hidden_from_calendar: true })
.in('id', ids)
if (error) {
alert('Error removing tour from calendar: ' + error.message)
return
}
await loadWorkspace()
closeBubble()
}
const updateTourType = async (type) => {
if (!selectedTour) return
const ids = selectedTour.contract_ids || []
if (ids.length === 0) return
const { error } = await supabase
.from('contracts')
.update({ tour_type: type })
.in('id', ids)
if (error) {
alert('Error updating tour type: ' + error.message)
return
}
setSelectedTour({
...selectedTour,
tour_type: type
})
await loadWorkspace()
}
const openAddNote = (target) => {
setNoteTarget(target)
setShowAddNote(true)
setNoteInput('')
}
function getAssignedQCredit(contract) {
if (!isQTour(contract)) return 0
if (isManagerOrAdmin()) return 1
const hasLiner = contract.q_liner && contract.q_liner.trim() !== ''
const hasCloser = contract.q_closer && contract.q_closer.trim() !== ''
const hasTriple = contract.q_triple && contract.q_triple.trim() !== ''
if (!hasLiner && !hasCloser && !hasTriple) return 1
if (hasLiner && !hasCloser && !hasTriple) {
return nameMatchesCurrentUser(contract.q_liner) ? 0.70 : 0
}
if (hasLiner && hasCloser && !hasTriple) {
if (nameMatchesCurrentUser(contract.q_liner)) return 0.40
if (nameMatchesCurrentUser(contract.q_closer)) return 0.40
return 0
}
if (hasLiner && hasCloser && hasTriple) {
if (nameMatchesCurrentUser(contract.q_liner)) return 0.20
if (nameMatchesCurrentUser(contract.q_closer)) return 0.20
if (nameMatchesCurrentUser(contract.q_triple)) return 0.20
return 0
}
return 0
}
const saveCalendarNote = async () => {
if (!noteTarget || !noteInput.trim()) return
const { data: clientData, error: clientError } = await supabase
.from('clients')
.select('notes')
.eq('id', noteTarget.client_id)
.single()
if (clientError) {
alert('Error loading client notes: ' + clientError.message)
return
}
const existingNotes = Array.isArray(clientData.notes) ? clientData.notes : []
const newNote = {
id: crypto.randomUUID(),
text: noteInput.trim(),
author_name: profile?.full_name || 'Unknown User',
created_at: new Date().toLocaleString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric',
hour: '2-digit',
minute: '2-digit'
})
}
const { error } = await supabase
.from('clients')
.update({ notes: [...existingNotes, newNote] })
.eq('id', noteTarget.client_id)
if (error) {
alert('Error saving note: ' + error.message)
return
}
setShowAddNote(false)
setNoteTarget(null)
setNoteInput('')
alert('Note saved')
}
const saveManualStats = async () => {
const { data: { user: currentUser } } = await supabase.auth.getUser()
if (!currentUser) {
alert('No user session')
return
}
const { data: insertedStats, error } = await supabase
.from('stat_adjustments')
.insert({
user_id: currentUser.id,
qs: Number(manualStats.qs || 0),
sales: Number(manualStats.sales || 0),
current_fulldown_volume: Number(manualStats.current_fulldown_volume || 0),
current_pender_volume: Number(manualStats.current_pender_volume || 0)
})
.select()
if (error) {
alert('Error saving stats: ' + error.message)
return
}
alert('Inserted stats:')
if (error) {
alert('Error saving stats: ' + error.message)
return
}
alert('Stats saved.')
setManualStats({
qs: '',
sales: '',
current_fulldown_volume: '',
current_pender_volume: ''
})
setShowStatsModal(false)
await loadWorkspace()
}
return (
<div style={page}>
<div style={topBrand}>
<img src="/logo.png" alt="logo" style={logo} />
<div>
<h1 style={brandTitle}>My Workspace</h1>
<p style={brandSub}>Monthly sales, tours and execution dashboard</p>
</div>
<div style={yearStatsBox}>
<YearStat label="Year Full Down" value={formatMoney(yearFullDownTotal)} color="#22c55e" />
<YearStat label="Year Pender" value={formatMoney(yearPenderTotal)} color="#facc15" />
<YearStat label="Year Total Volume" value={formatMoney(yearTotalVolume)} color="#c9a86a" />
<YearStat label="Year Closing %" value={`${yearClosingPercentage.toFixed(1)}%`} color="#c9a86a" />
<YearStat label="Year Efficiency" value={formatMoney(yearEfficiency)} color="#c9a86a" />
</div>
</div>
<div style={shell}>
<div style={header}>
<div>
<h2 style={sectionTitle}>
{monthName} {year}
</h2>
<div style={goldLine} />
<p style={muted}>
{profile?.full_name || user?.email || 'Loading user'} · Workspace calendar
</p>
<div style={{ marginTop: 20, textAlign: 'right' }}>
<button
onClick={() => setShowStatsModal(true)}
style={{
fontSize: 12,
opacity: 0.7,
background: 'transparent',
border: '1px solid #c9a86a',
color: '#c9a86a',
padding: '6px 12px',
borderRadius: 10,
cursor: 'pointer'
}}
>
Update Stats
</button>
</div>
</div>
<div style={topActions}>
<select
value={month}
onChange={(e) => setMonth(Number(e.target.value))}
style={select}
>
{Array.from({ length: 12 }).map((_, i) => (
<option key={i} value={i}>
{new Date(2026, i).toLocaleString('en-US', { month: 'long' })}
</option>
))}
</select>
<select
value={year}
onChange={(e) => setYear(Number(e.target.value))}
style={select}
>
{[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
<option key={y} value={y}>
{y}
</option>
))}
</select>
<button
onClick={() => window.location.href = '/dashboard'}
style={darkButton}
>
Dashboard
</button>
</div>
</div>
<div style={metricBar}>
<div style={metricBox}>
<div style={metricLabel}>Full Down Volume</div>
<div style={metricValueGreen}>{formatMoney(monthlyFullDownVolume)}</div>
</div>
<div style={metricBox}>
<div style={metricLabel}>Pender Volume</div>
<div style={metricValueYellow}>{formatMoney(monthlyPenderVolume)}</div>
</div>
<div style={metricBox}>
<div style={metricLabel}>Month Total Volume</div>
<div style={metricValueGold}>{formatMoney(monthlyTotalAssignedVolume)}</div>
</div>
<div style={metricBox}>
<div style={metricLabel}>Closing Percentage</div>
<div style={metricValueGold}>{monthlyClosingPercentage.toFixed(1)}%</div>
</div>
<div style={metricBox}>
<div style={metricLabel}>Efficiency</div>
<div style={metricValueGold}>{formatMoney(monthlyEfficiency)}</div>
</div>
</div>
{loading && <p style={muted}>Loading workspace...</p>}
<div style={calendar}>
{weekDays.map((day) => (
<div key={day} style={dayHeader}>
{day}
</div>
))}
{Array.from({ length: firstDay }).map((_, i) => (
<div key={`empty-${i}`} style={emptyCell} />
))}
{Array.from({ length: daysInMonth }).map((_, i) => {
const day = i + 1
const items = getDayItems(day)
const dayStatus = getDayStatus(items)
return (
<div
key={day}
onClick={() => openDayBubble(day)}
style={{
...cell,
...(dayStatus === 'full_down' ? fullDownDay : {}),
...(dayStatus === 'pender' ? penderDay : {})
}}
>
<div style={dayNumber}>{day}</div>
{items.map((item, index) => (
<div
key={`${item.client_id}-${index}-${item.type}`}
onClick={async (e) => {
e.stopPropagation()
if (item.type === 'welcome_call') {
return
}
if (item.type === 'sale' && item.sale) {
openSaleBubble(item.sale)
} else {
openTourBubble(item)
}
}}
style={{
...calendarItem,
...(item.status === 'full_down' ? itemFullDown : {}),
...(item.status === 'pender' ? itemPender : {}),
...(item.tour_type === 'Ct' ? itemCt : {}),
...(item.type === 'welcome_call' ? itemWelcomeCall : {}),
cursor: 'pointer'
}}
>
{item.type === 'welcome_call' ? (
<>
<button
onClick={async (e) => {
e.stopPropagation()
const confirmDelete = confirm('Remove this Welcome Call notification?')
if (!confirmDelete) return
const { error } = await supabase
.from('sales')
.update({ welcome_call_date: null })
.eq('id', item.sale.id)
if (error) {
alert('Error removing Welcome Call: ' + error.message)
return
}
await loadWorkspace()
}}
style={welcomeCloseButton}
title="Remove Welcome Call"
>
×
</button>
<div style={welcomeTitle}>Welcome Call</div>
<div style={clientText}>{item.client_name}</div>
<div style={welcomeMeta}>{formatMoney(item.purchase_price)}</div>
<div style={welcomeMeta}>Sale Date: {item.sale_date}</div>
</>
) : (
<>
{item.type === 'no_tour' ? (
<>
<button
onClick={(e) => {
e.stopPropagation()
removeNoTourDay(item.id)
}}
style={{
position: 'absolute',
top: 4,
right: 6,
width: 18,
height: 18,
borderRadius: 999,
border: 'none',
background: '#dc2626',
color: 'white',
fontSize: 10,
cursor: 'pointer'
}}
>
×
</button>
<div style={itemTitle}>NO TOUR</div>
<div style={clientText}>No tour taken</div>
</>
) : (
<>
<div style={itemTitle}>
Tour / Contract {item.tour_type === 'Ct' ? '· Ct' : '· Q'}
</div>
<div style={clientText}>{item.client_name}</div>
<div style={contractText}>
{item.contract_numbers.length > 0
? item.contract_numbers.map((n) => `#${n}`).join(', ')
: 'No contract number'}
</div>
</>
)}
</>
)}
</div>
))}
</div>
)
})}
</div>
</div>
{showAddTour && (
<div style={overlay}>
<div style={saleBubble}>
<div style={bubbleHeader}>
<div>
<h2 style={bubbleTitle}>Add Tour</h2>
<div style={bubbleGoldLine} />
<p style={bubbleSub}>
Add existing member/contract to {monthName} {selectedDay}, {year}
</p>
</div>
<button onClick={closeBubble} style={closeButton}>
×
</button>
</div>
<div style={checkboxRow}>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={tourTypeForAdd === 'Q'}
onChange={() => setTourTypeForAdd('Q')}
/>
Q
</label>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={tourTypeForAdd === 'Ct'}
onChange={() => setTourTypeForAdd('Ct')}
/>
Ct
</label>
</div>
<button
onClick={addNoTourToDay}
style={darkButton}
>
NO TOUR
</button>
<div style={addTourSearchRow}>
<input
value={tourSearch}
onChange={(e) => setTourSearch(e.target.value)}
onKeyDown={(e) => {
if (e.key === 'Enter') searchTour()
}}
placeholder="Search by contract number, name or surname"
style={addTourInput}
/>
<button onClick={searchTour} style={blueButton}>
Search
</button>
</div>
<div style={{ marginTop: 18 }}>
{tourMatches.length === 0 && (
<div style={bubbleField}>
<div style={bubbleValue}>
No results yet. Search an existing client or contract.
</div>
</div>
)}
{tourMatches.map((match) => (
<div key={match.client_id} style={matchCard}>
<div>
<div style={bubbleLabel}>Client</div>
<div style={bubbleValue}>{match.client_name}</div>
<div style={{ ...bubbleLabel, marginTop: 10 }}>Contracts</div>
<div style={contractTextDark}>
{match.contracts.map((c) => `#${c.contract_number}`).join(', ')}
</div>
</div>
<button
onClick={() => addTourToDay(match)}
style={goldButton}
>
Add Tour
</button>
</div>
))}
</div>
</div>
</div>
)}
{selectedSale && saleDraft && (
<div style={overlay}>
<div style={saleBubble}>
<div style={bubbleHeader}>
<div>
<h2 style={bubbleTitle}>Sale File</h2>
<div style={bubbleGoldLine} />
<p style={bubbleSub}>
{selectedSale.clients?.full_name || 'Client'} ·{' '}
{saleDraft.full_down ? 'Full Down' : 'Pender'}
</p>
</div>
<button onClick={closeBubble} style={closeButton}>
×
</button>
</div>
<div style={saleStatusRow}>
<div style={statusPill}>
{saleDraft.full_down ? 'FULL DOWN' : 'PENDER'}
</div>
<div style={bubbleAmount}>
{formatMoney(saleDraft.purchase_price)}
</div>
</div>
{selectedSale.client_photo_url && (
<div style={clientPhotoBox}>
<div style={bubbleLabel}>Client Picture</div>
<img
src={selectedSale.client_photo_url}
alt="Client purchase"
style={clientPhotoImage}
/>
</div>
)}
<div style={bubbleGrid}>
<BubbleField label="liner" value={saleDraft.liner} editable={editMode} onChange={(v) => updateDraft('liner', v)} />
<BubbleField label="Closer" value={saleDraft.closer} editable={editMode} onChange={(v) => updateDraft('closer', v)} />
<BubbleField label="Triple" value={saleDraft.triple} editable={editMode} onChange={(v) => updateDraft('triple', v)} />
<BubbleField label="Purchase Price" value={saleDraft.purchase_price} editable={editMode} onChange={(v) => updateDraft('purchase_price', v)} />
<BubbleField label="Closing Cost" value={saleDraft.closing_cost} editable={editMode} onChange={(v) => updateDraft('closing_cost', v)} />
<StaticField label="Gross Volume" value={formatMoneyDetailed(getGrossVolumeFromForm(saleDraft))} />
<StaticField label="Net Volume" value={formatMoneyDetailed(getNetVolumeFromForm(saleDraft))} />
<BubbleField label="Old Annual Points" value={saleDraft.old_annual_points} editable={editMode} onChange={(v) => updateDraft('old_annual_points', v)} />
<BubbleField label="New Annual Points" value={saleDraft.new_annual_points} editable={editMode} onChange={(v) => updateDraft('new_annual_points', v)} />
<BubbleField label="New Points Sold" value={saleDraft.new_points_sold} editable={editMode} onChange={(v) => updateDraft('new_points_sold', v)} />
<BubbleField label="Years" value={saleDraft.years} editable={editMode} onChange={(v) => updateDraft('years', v)} />
{saleDraft.pender && (
<BubbleField
label="Out of Pender Date"
type="date"
value={saleDraft.out_of_pender_date}
editable={editMode}
onChange={(v) => updateDraft('out_of_pender_date', v)}
/>
)}
<BubbleField label="VLO" value={saleDraft.vlo} editable={editMode} onChange={(v) => updateDraft('vlo', v)} />
<BubbleField label="Welcome Call Date" type="date" value={saleDraft.welcome_call_date} editable={editMode} onChange={(v) => updateDraft('welcome_call_date', v)} />
</div>
{editMode && (
<>
<div style={checkboxRow}>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={saleDraft.full_down}
onChange={(e) => updateDraft('full_down', e.target.checked)}
/>
Full Down
</label>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={saleDraft.pender}
onChange={(e) => updateDraft('pender', e.target.checked)}
/>
Pender
</label>
</div>
<div style={checkboxRow}>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={saleDraft.sale_type === 'new'}
onChange={() => updateDraft('sale_type', 'new')}
/>
New
</label>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={saleDraft.sale_type === 'upgrade'}
onChange={() => updateDraft('sale_type', 'upgrade')}
/>
Upgrade
</label>
</div>
</>
)}
<div style={bubbleActions}>
<button
onClick={() =>
openAddNote({
client_id: selectedSale.client_id,
client_name: selectedSale.clients?.full_name || 'Client'
})
}
style={blueButton}
>
Add Note
</button>
<button onClick={() => cancelSale(selectedSale)} style={redButton}>
Cancel Sale
</button>
{!editMode && (
<button onClick={() => setEditMode(true)} style={blueButton}>
Edit
</button>
)}
<button
onClick={editMode ? saveSaleChanges : closeBubble}
style={goldButton}
>
{editMode ? 'Save Changes' : 'Close'}
</button>
</div>
</div>
</div>
)}
{selectedTour && (
<div style={overlay}>
<div style={saleBubble}>
<div style={bubbleHeader}>
<div>
<h2 style={bubbleTitle}>Tour File</h2>
<div style={bubbleGoldLine} />
<p style={bubbleSub}>Calendar tour record</p>
</div>
<button onClick={closeBubble} style={closeButton}>
×
</button>
</div>
<div style={bubbleGrid}>
<div style={bubbleField}>
<div style={bubbleLabel}>Client Name</div>
<div style={bubbleValue}>{selectedTour.client_name}</div>
</div>
<div style={bubbleField}>
<div style={bubbleLabel}>Contract Numbers</div>
<div style={bubbleValue}>
{selectedTour.contract_numbers.length > 0
? selectedTour.contract_numbers.map((n) => `#${n}`).join(', ')
: 'No contract number'}
</div>
</div>
<div style={bubbleField}>
<div style={bubbleLabel}>Tour Type</div>
<div style={bubbleValue}>{selectedTour.tour_type || 'Q'}</div>
</div>
</div>
<div style={checkboxRow}>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={(selectedTour.tour_type || 'Q') === 'Q'}
onChange={() => updateTourType('Q')}
/>
Q
</label>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={selectedTour.tour_type === 'Ct'}
onChange={() => updateTourType('Ct')}
/>
Ct
</label>
</div>
{showAddSale && (
<div style={{ marginTop: 24 }}>
<h3 style={addSaleTitle}>Add Sale</h3>
<div style={bubbleGrid}>
<SaleInput label="liner" value={newSaleForm.liner} onChange={(v) => updateNewSaleForm('liner', v)} />
<SaleInput label="Closer" value={newSaleForm.closer} onChange={(v) => updateNewSaleForm('closer', v)} />
<SaleInput label="Triple" value={newSaleForm.triple} onChange={(v) => updateNewSaleForm('triple', v)} />
<SaleInput label="Purchase Price" value={newSaleForm.purchase_price} onChange={(v) => updateNewSaleForm('purchase_price', v)} />
<SaleInput label="Closing Cost" value={newSaleForm.closing_cost} onChange={(v) => updateNewSaleForm('closing_cost', v)} />
<StaticField label="Gross Volume" value={formatMoneyDetailed(getGrossVolumeFromForm(newSaleForm))} />
<StaticField label="Net Volume" value={formatMoneyDetailed(getNetVolumeFromForm(newSaleForm))} />
<SaleInput label="Previous annual points" value={newSaleForm.old_annual_points} onChange={(v) => updateNewSaleForm('old_annual_points', v)} />
<SaleInput label="New Annual Points" value={newSaleForm.new_annual_points} onChange={(v) => updateNewSaleForm('new_annual_points', v)} />
<SaleInput label="New Points Sold" value={newSaleForm.new_points_sold} onChange={(v) => updateNewSaleForm('new_points_sold', v)} />
<SaleInput label="Years" value={newSaleForm.years} onChange={(v) => updateNewSaleForm('years', v)} />
{newSaleForm.pender && (
<SaleInput
label="Out of Pender Date"
type="date"
value={newSaleForm.out_of_pender_date}
onChange={(v) => updateNewSaleForm('out_of_pender_date', v)}
/>
)}
<SaleInput label="VLO" value={newSaleForm.vlo} onChange={(v) => updateNewSaleForm('vlo', v)} />
<SaleInput label="Welcome Call Date" type="date" value={newSaleForm.welcome_call_date} onChange={(v) => updateNewSaleForm('welcome_call_date', v)} />
<div style={bubbleField}>
<div style={bubbleLabel}>Client Picture</div>
{newSaleForm.client_photo_url && (
<img
src={newSaleForm.client_photo_url}
alt="client"
style={{
width: '100%',
borderRadius: 12,
marginBottom: 10,
border: '1px solid #d1d5db'
}}
/>
)}
<input
type="file"
accept="image/*"
capture="environment"
onChange={(e) => {
const file = e.target.files?.[0]
if (file) uploadClientPhoto(file)
}}
style={{ marginTop: 10 }}
/>
{uploadingPhoto && (
<div style={{ marginTop: 10, color: '#c9a86a' }}>
Uploading picture...
</div>
)}
</div>
</div>
<div style={checkboxRow}>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={newSaleForm.full_down}
onChange={(e) => updateNewSaleForm('full_down', e.target.checked)}
/>
Full Down
</label>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={newSaleForm.pender}
onChange={(e) => updateNewSaleForm('pender', e.target.checked)}
/>
Pender
</label>
</div>
<div style={checkboxRow}>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={newSaleForm.sale_type === 'new'}
onChange={() => updateNewSaleForm('sale_type', 'new')}
/>
New
</label>
<label style={checkboxLabel}>
<input
type="checkbox"
checked={newSaleForm.sale_type === 'upgrade'}
onChange={() => updateNewSaleForm('sale_type', 'upgrade')}
/>
Upgrade
</label>
</div>
</div>
)}
<div style={bubbleActions}>
<button
onClick={() =>
window.location.href = `/clients/${selectedTour.client_id}/notes`
}
style={blueButton}
>
Notes
</button>
<button
onClick={() =>
openAddNote({
client_id: selectedTour.client_id,
client_name: selectedTour.client_name
})
}
style={blueButton}
>
Add Note
</button>
{!showAddSale && (
<button
onClick={() => setShowAddSale(true)}
style={greenButton}
>
Add Sale
</button>
)}
{showAddSale && (
<button
onClick={saveNewSaleFromTour}
style={greenButton}
>
Submit Sale
</button>
)}
<button onClick={hideTourFromCalendar} style={redButton}>
Delete Tour
</button>
<button onClick={closeBubble} style={goldButton}>
Close
</button>
</div>
</div>
</div>
)}
{showAddNote && noteTarget && (
<div style={overlay}>
<div style={noteBubbleModal}>
<div style={bubbleHeader}>
<div>
<h2 style={bubbleTitle}>Add Note</h2>
<div style={bubbleGoldLine} />
<p style={bubbleSub}>{noteTarget.client_name}</p>
</div>
<button onClick={() => setShowAddNote(false)} style={closeButton}>
×
</button>
</div>
<textarea
value={noteInput}
onChange={(e) => setNoteInput(e.target.value)}
rows={5}
placeholder="Write note..."
style={noteTextarea}
/>
<div style={bubbleActions}>
<button onClick={() => setShowAddNote(false)} style={darkButton}>
Cancel
</button>
<button onClick={saveCalendarNote} style={greenButton}>
Save Note
</button>
</div>
</div>
</div>
)}
{showStatsModal && (
<div style={overlay}>
<div style={noteBubbleModal}>
<h2 style={bubbleTitle}>Manual Stats Override</h2>
<div style={bubbleGrid}>
<SaleInput
label="Qs"
value={manualStats.qs}
onChange={(v) => setManualStats({ ...manualStats, qs: v })}
/>
<SaleInput
label="Sales"
value={manualStats.sales}
onChange={(v) => setManualStats({ ...manualStats, sales: v })}
/>
<SaleInput
label="Current Full Down Volume (USD)"
value={manualStats.current_fulldown_volume}
onChange={(v) =>
setManualStats({ ...manualStats, current_fulldown_volume: v })
}
/>
<SaleInput
label="Current Pender Volume (USD)"
value={manualStats.current_pender_volume}
onChange={(v) =>
setManualStats({ ...manualStats, current_pender_volume: v })
}
/>
</div>
<div style={bubbleActions}>
<button
onClick={() => setShowStatsModal(false)}
style={darkButton}
>
Cancel
</button>
<button
onClick={saveManualStats}
style={goldButton}
>
Apply
</button>
</div>
</div>
</div>
)}
</div>
)
}
function YearStat({ label, value, color }) {
return (
<div style={yearStat}>
<div style={yearStatLabel}>{label}</div>
<div style={{ ...yearStatValue, color }}>{value}</div>
</div>
)
}
function BubbleField({ label, value, editable, onChange, type = 'text' }) {
return (
<div style={bubbleField}>
<div style={bubbleLabel}>{label}</div>
{editable ? (
<input
type={type}
value={value || ''}
onChange={(e) => onChange(e.target.value)}
style={bubbleInput}
/>
) : (
<div style={bubbleValue}>{value || '—'}</div>
)}
</div>
)
}
function SaleInput({ label, value, onChange, type = 'text' }) {
return (
<div style={bubbleField}>
<div style={bubbleLabel}>{label}</div>
<input
type={type}
value={value || ''}
onChange={(e) => onChange(e.target.value)}
style={bubbleInput}
/>
</div>
)
}
function StaticField({ label, value }) {
return (
<div style={bubbleField}>
<div style={bubbleLabel}>{label}</div>
<div style={bubbleValue}>{value}</div>
</div>
)
}
const page = { minHeight: '100vh', background: '#ffffff', padding: 40, fontFamily: 'Helvetica Neue, Arial, sans-serif' }
const topBrand = {
maxWidth: 1250,
margin: '0 auto 28px',
display: 'flex',
alignItems: 'center',
gap: 24,
flexWrap: 'wrap'
}
const logo = { width: 170, objectFit: 'contain' }
const brandTitle = { margin: 0, color: '#111827', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 30 }
const brandSub = { color: '#6b7280', margin: '6px 0 0' }
const yearStatsBox = { marginLeft: 'auto', background: '#0f172a', color: '#f9fafb', borderRadius: 18, padding: 16, minWidth: 650, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, boxShadow: '0 16px 40px rgba(15,23,42,0.22)' }
const yearStat = { textAlign: 'right' }
const yearStatLabel = { fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }
const yearStatValue = { fontSize: 18, fontWeight: 'bold' }
const shell = { maxWidth: 1250, margin: '0 auto', background: '#0f172a', borderRadius: 28, padding: 'clamp(18px, 4vw, 34px)', border: '1px solid #1e293b', boxShadow: '0 24px 70px rgba(15,23,42,0.25)', color: '#f9fafb' }
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }
const sectionTitle = { margin: 0, textTransform: 'uppercase', letterSpacing: 1.4, color: '#f9fafb' }
const goldLine = { width: 64, height: 3, background: '#c9a86a', margin: '12px 0' }
const muted = { color: '#9ca3af', margin: 0 }
const topActions = {
display: 'flex',
gap: 10,
flexWrap: 'wrap',
alignItems: 'center',
justifyContent: 'flex-end'
}
const select = { padding: '12px 14px', background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: 12, outline: 'none', fontWeight: 'bold' }
const metricBar = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, background: '#111827', border: '1px solid #1f2937', borderRadius: 18, padding: 14, marginBottom: 22 }
const metricBox = { textAlign: 'right' }
const metricLabel = { color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }
const metricValueGreen = { color: '#22c55e', fontSize: 22, fontWeight: 'bold' }
const metricValueYellow = { color: '#facc15', fontSize: 22, fontWeight: 'bold' }
const metricValueGold = { color: '#c9a86a', fontSize: 22, fontWeight: 'bold' }
const calendar = {
display: 'grid',
gridTemplateColumns: 'repeat(7, minmax(105px, 1fr))',
gap: 10,
overflowX: 'auto',
paddingBottom: 10
}
const dayHeader = { textAlign: 'center', color: '#c9a86a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, padding: 10 }
const emptyCell = { minHeight: 120 }
const cell = {
background: '#111827',
border: '1px solid #1f2937',
borderRadius: 16,
minHeight: 135,
minWidth: 105,
padding: 10,
overflow: 'hidden',
cursor: 'pointer'
}
const fullDownDay = { border: '2px solid #22c55e', boxShadow: '0 0 0 1px rgba(34,197,94,0.25), 0 12px 30px rgba(34,197,94,0.12)' }
const penderDay = { border: '2px solid #facc15', boxShadow: '0 0 0 1px rgba(250,204,21,0.25), 0 12px 30px rgba(250,204,21,0.1)' }
const dayNumber = { color: '#f9fafb', fontWeight: 'bold', marginBottom: 8 }
const calendarItem = { position: 'relative', width: '100%', textAlign: 'left', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, padding: 8, marginBottom: 7, fontSize: 11, lineHeight: 1.35, color: '#f9fafb' }
const itemFullDown = { border: '1px solid #22c55e', background: 'rgba(34,197,94,0.12)' }
const itemPender = { border: '1px solid #facc15', background: 'rgba(250,204,21,0.12)' }
const itemWelcomeCall = {
position: 'relative',
border: '1px solid #38bdf8',
background: 'linear-gradient(135deg, rgba(14,165,233,0.28), rgba(30,64,175,0.22))',
boxShadow: '0 10px 24px rgba(14,165,233,0.18)'
}
const welcomeTitle = {
color: '#7dd3fc',
fontWeight: 'bold',
textTransform: 'uppercase',
letterSpacing: 0.8,
marginBottom: 3
}
const welcomeMeta = {
color: '#bfdbfe',
fontWeight: 'bold',
marginTop: 4
}
const welcomeCloseButton = {
position: 'absolute',
top: 6,
right: 7,
width: 22,
height: 22,
borderRadius: 999,
border: '1px solid rgba(191,219,254,0.7)',
background: 'rgba(15,23,42,0.7)',
color: '#bfdbfe',
cursor: 'pointer',
fontWeight: 'bold',
lineHeight: '18px'
}
const itemCt = { opacity: 0.72, border: '1px dashed #94a3b8' }
const itemTitle = { color: '#c9a86a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }
const clientText = { color: '#f9fafb', fontWeight: 'bold' }
const contractText = { color: '#9ca3af' }
const saleVolume = { color: '#f9fafb', fontWeight: 'bold', marginTop: 4 }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.62)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 9999 }
const saleBubble = { width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', background: '#f8fafc', color: '#111827', borderRadius: 28, padding: 30, border: '1px solid #e5e7eb', boxShadow: '0 30px 90px rgba(0,0,0,0.35)' }
const noteBubbleModal = { width: '100%', maxWidth: 620, background: '#f8fafc', color: '#111827', borderRadius: 28, padding: 30, border: '1px solid #e5e7eb', boxShadow: '0 30px 90px rgba(0,0,0,0.35)' }
const bubbleHeader = { display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 22 }
const bubbleTitle = { margin: 0, textTransform: 'uppercase', letterSpacing: 1.5, color: '#111827' }
const bubbleGoldLine = { width: 64, height: 3, background: '#c9a86a', margin: '10px 0' }
const bubbleSub = { color: '#64748b', margin: 0 }
const closeButton = { background: '#111827', color: 'white', border: 'none', width: 38, height: 38, borderRadius: 999, cursor: 'pointer', fontSize: 24 }
const saleStatusRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e2e8f0', borderRadius: 18, padding: 16, marginBottom: 20 }
const clientPhotoBox = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 14, marginBottom: 20 }
const clientPhotoImage = { width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 14, border: '1px solid #d1d5db' }
const statusPill = { background: '#111827', color: '#c9a86a', borderRadius: 999, padding: '8px 14px', fontWeight: 'bold', letterSpacing: 1 }
const bubbleAmount = { fontSize: 30, fontWeight: 'bold', color: '#111827' }
const bubbleGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }
const bubbleField = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 14 }
const bubbleLabel = { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 'bold' }
const bubbleValue = { color: '#111827', fontWeight: 'bold', fontSize: 15 }
const bubbleInput = { width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', color: '#111827', background: '#ffffff', fontWeight: 'bold' }
const checkboxRow = { display: 'flex', gap: 20, marginTop: 18, background: '#e2e8f0', padding: 14, borderRadius: 16 }
const checkboxLabel = { fontWeight: 'bold', display: 'flex', gap: 8, alignItems: 'center' }
const bubbleActions = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, flexWrap: 'wrap' }
const addTourSearchRow = { display: 'flex', gap: 12, marginTop: 18 }
const addTourInput = { flex: 1, padding: 13, borderRadius: 12, border: '1px solid #cbd5e1', color: '#111827', background: '#ffffff', fontWeight: 'bold' }
const matchCard = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 16, marginBottom: 12 }
const contractTextDark = { color: '#475569', fontWeight: 'bold' }
const addSaleTitle = { marginTop: 0, color: '#111827', textTransform: 'uppercase', letterSpacing: 1.2 }
const noteTextarea = { width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 14, border: '1px solid #cbd5e1', resize: 'vertical', color: '#111827', outline: 'none', fontWeight: 'bold' }
const modeButton = { padding: '12px 16px', background: '#374151', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const darkButton = { ...modeButton, background: '#374151' }
const goldButton = { ...modeButton, background: '#c9a86a', color: '#111827' }
const blueButton = { ...modeButton, background: '#2563eb', color: 'white' }
const greenButton = { ...modeButton, background: '#16a34a', color: 'white' }
const redButton = { ...modeButton, background: '#dc2626', color: 'white' }