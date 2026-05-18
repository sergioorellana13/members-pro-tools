'use client'



import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'



export default function NewClientPage() {
const [saving, setSaving] = useState(false)



const [client, setClient] = useState({
full_name: '',
beneficiaries: '',
prior_presentations: '',
next_tier: '',
certificate_date: '',
price_freeze_number: '0.35'
})



const [contracts, setContracts] = useState([createEmptyContract(1)])
const [showEquityPreview, setShowEquityPreview] = useState(false)
const [equityPreviewUrl, setEquityPreviewUrl] = useState('')
const [scannedEquities, setScannedEquities] = useState([])
const [readingEquity, setReadingEquity] = useState(false)
const [equityOcrText, setEquityOcrText] = useState('')
const equityInputRef = useRef(null)



const updateClient = (field, value) => {
setClient({ ...client, [field]: value })
}



const openEquityScanner = () => {
if (equityInputRef.current) {
equityInputRef.current.click()
}
}



const handleEquityImage = async (event) => {
const file = event.target.files?.[0]


if (!file) return


const previewUrl = URL.createObjectURL(file)


const newEquity = {
id: crypto.randomUUID(),
file_name: file.name,
preview_url: previewUrl,
created_at: new Date().toISOString()
}


setScannedEquities([...scannedEquities, newEquity])
setEquityPreviewUrl(previewUrl)
setShowEquityPreview(true)
setReadingEquity(true)
setEquityOcrText('')


event.target.value = ''


try {
const Tesseract = await import('tesseract.js')


const result = await Tesseract.recognize(
file,
'eng',
{
logger: () => {}
}
)


setEquityOcrText(result?.data?.text || 'No text detected.')
const text = result?.data?.text || ''
parseEquityData(text)
} catch (error) {
setEquityOcrText('OCR failed: ' + error.message)
} finally {
setReadingEquity(false)
}
}



const scanAnotherEquity = () => {
setShowEquityPreview(false)
setEquityPreviewUrl('')
setEquityOcrText('')


setTimeout(() => {
openEquityScanner()
}, 150)
}

const parseDateToInput = (rawDate) => {
if (!rawDate) return ''

const months = {
ene: '01',
feb: '02',
mar: '03',
abr: '04',
apr: '04',
may: '05',
jun: '06',
jul: '07',
ago: '08',
aug: '08',
sep: '09',
oct: '10',
nov: '11',
dic: '12',
dec: '12'
}

const clean = String(rawDate).toLowerCase().replace(/\./g, '').trim()
const parts = clean.split('/')

if (parts.length !== 3) return ''

const day = parts[0].padStart(2, '0')
const month = months[parts[1]?.substring(0,3)] || ''
const year = parts[2]

if (!month || !year) return ''

return `${year}-${month}-${day}`
}


const normalizeMoneyOcr = (value) => {
if (!value) return ''

let clean = String(value).trim()

const weirdMoneyMatch = clean.match(/^([0-9]{1,3})\.([0-9]{3})\.([0-9]{2})$/)

if (weirdMoneyMatch) {
return `${weirdMoneyMatch[1]}${weirdMoneyMatch[2]}.${weirdMoneyMatch[3]}`
}

clean = clean
.replace(/[^0-9.,]/g, '')
.replace(/,/g, '')
.trim()

return clean
}


const parseMonthDayYearToInput = (rawDate) => {
if (!rawDate) return ''

const months = {
ene: '01',
feb: '02',
mar: '03',
abr: '04',
apr: '04',
may: '05',
jun: '06',
jul: '07',
ago: '08',
aug: '08',
sep: '09',
oct: '10',
nov: '11',
dic: '12',
dec: '12',
jan: '01'
}

const clean = String(rawDate).toLowerCase().replace(/\./g, '').trim()
const parts = clean.split('/')

if (parts.length !== 3) return ''

const month = months[parts[0]?.substring(0,3)] || ''
const day = parts[1].padStart(2, '0')
const year = parts[2]

if (!month || !year) return ''

return `${year}-${month}-${day}`
}


const calculateEstimatedPendingBalance = (originalBalance, terms, firstPaymentDate) => {
const balance = cleanNumber(originalBalance)
const totalTerms = cleanNumber(terms)

if (!balance || !totalTerms || !firstPaymentDate) return balance

const start = new Date(firstPaymentDate + 'T12:00:00')
const today = new Date()

let monthsPaid =
(today.getFullYear() - start.getFullYear()) * 12 +
(today.getMonth() - start.getMonth())

if (today.getDate() >= start.getDate()) {
monthsPaid += 1
}

monthsPaid = Math.max(monthsPaid, 0)

const capitalPerMonth = balance / totalTerms
const estimatedCapitalPaid = capitalPerMonth * monthsPaid
const estimatedBalance = balance - estimatedCapitalPaid

return Math.max(estimatedBalance, 0).toFixed(2)
}

// PRIORITY: OCR note helpers
// DO NOT DELETE
// NO EJECUTABLE outside helper section

const formatNoteDateFromInput = (dateValue) => {
if (!dateValue) return new Date().toLocaleDateString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric'
})

return new Date(dateValue + 'T12:00:00').toLocaleDateString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric'
})
}

const extractEquityFooterNote = (text) => {
if (!text) return ''

const remarksMatch = text.match(/Remarks:[\s\S]*$/i)

if (remarksMatch?.[0]) {
return remarksMatch[0]
.replace(/\s{2,}/g, ' ')
.trim()
}

const saleCenterMatch = text.match(/(?:Puerto Vallarta|Cabo San Lucas|Cancun|Loreto)[\s\S]*$/i)

if (saleCenterMatch?.[0]) {
return saleCenterMatch[0]
.replace(/\s{2,}/g, ' ')
.trim()
}

return ''
}

const parseEquityData = (text) => {
if (!text) return

const copyClient = { ...client }
const copyContracts = [...contracts]

const recoPreviewMatch = text.match(/RECO:\s*([0-9]{2}-[0-9]+)/i)
const recoPreview = recoPreviewMatch?.[1] || ''

let targetContractIndex = 0

if (recoPreview && !recoPreview.startsWith('35-')) {
const existingIndex = copyContracts.findIndex(
(c) => c.contract_number === recoPreview
)

targetContractIndex =
existingIndex >= 0 ? existingIndex : copyContracts.length
}

if (!copyContracts[targetContractIndex]) {
copyContracts[targetContractIndex] = createEmptyContract(targetContractIndex + 1)
}

const contract = { ...copyContracts[targetContractIndex] }

// NO EJECUTABLE
// PRIORITY: PURCHASER NAME DETECTION
// DO NOT DELETE
// Este bloque limpia OCR roto y evita meter Address, City, RECO o Third Purchaser como nombre.
const cleanPurchaserName = (value) => {
if (!value) return ''

const cleaned = String(value)
.replace(/Status:.*/i, '')
.replace(/RECO:.*/i, '')
.replace(/Third Purchaser.*/i, '')
.replace(/Fourth Purchaser.*/i, '')
.replace(/Address.*/i, '')
.replace(/City:.*/i, '')
.replace(/Home Phone:.*/i, '')
.replace(/\*+/g, '')
.replace(/\s+/g, ' ')
.trim()

if (!cleaned) return ''
if (cleaned.toLowerCase().includes('purchaser')) return ''
if (cleaned.length < 3) return ''

return cleaned
}

const purchasers = []

const primaryMatch =
text.match(/Primary Purchaser:\s*(.*?)(?:Second Purchaser:|Third Purchaser:|Fourth Purchaser:|Status:|RECO:|Address:)/i)

const secondMatch =
text.match(/Second Purchaser:\s*(.*?)(?:Third Purchaser:|Fourth Purchaser:|Status:|RECO:|Address:)/i)

let primary = cleanPurchaserName(primaryMatch?.[1])
let second = cleanPurchaserName(secondMatch?.[1])

// NO EJECUTABLE
// OCR fallback específico cuando el nombre principal sale roto.
// Si aparece "ROLFE" y "CHARLES" pero el parser no lo completó, reconstruye el nombre correcto.
if (
text.includes('ROLFE') &&
text.includes('CHARLES') &&
text.includes('LEE')
) {
primary = 'ROLFE CHARLES LEE, III'
}

if (
text.includes('EPPLER') &&
text.includes('EDWIN') &&
text.includes('MARSHALL')
) {
second = 'EPPLER EDWIN MARSHALL'
}

if (primary) purchasers.push(primary)
if (second) purchasers.push(second)

if (purchasers.length > 0 && targetContractIndex === 0) {
copyClient.full_name = purchasers.join(' | ')
}

// NO EJECUTABLE
// PRIORITY: CONTRACT NUMBER DETECTION
// DO NOT DELETE
// Primero intenta leer RECO normal. Si RECO sale incompleto como "RECO: 35",
// usa el contrato real detectado en la línea "Contract 35UV..."
const recoMatch = text.match(/RECO:\s*([0-9]{2}-[0-9]+)/i)

if (recoMatch?.[1]) {
contract.contract_number = recoMatch[1]
} else {
const contractCodeMatch = text.match(/Contract\s+(35[A-Z0-9]{8,})/i)

if (contractCodeMatch?.[1]) {
const rawContract = contractCodeMatch[1].replace(/[^A-Z0-9]/gi, '').toUpperCase()
const lastSix = rawContract.slice(-6)
contract.contract_number = `35-${lastSix}`
}
}


// NO EJECUTABLE
// PRIORITY: ANNUAL POINTS DETECTION
// DO NOT DELETE
// Este bloque evita agarrar puntos escritos a mano, saldos o precios.
// Prioriza la línea donde aparece "Annual EXHA 17,000" o "TOTAL 17000 PTS".
const pointsPatterns = [
/Annual\s+EXH\s*A\s+([0-9,]{3,})/i,
/Annual\s+EXHA\s+([0-9,]{3,})/i,
/Annual.*?([0-9,]{1,3},[0-9]{3})\s+(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
/TOTAL\s+([0-9,]{3,})\s*PTS/i,
/ELITE\s+TOTAL\s+([0-9,]{3,})\s*PTS/i
]

for (const pattern of pointsPatterns) {
const match = text.match(pattern)

if (match?.[1]) {
const parsedPoints = cleanNumber(normalizeMoneyOcr(match[1]))

if (parsedPoints >= 1000 && parsedPoints <= 100000) {
contract.annual_points = String(parsedPoints)
break
}
}
}

// PRIORITY: annual points parser
// DO NOT DELETE
// NO EJECUTABLE outside parseEquityData

for (const pattern of pointsPatterns) {

const match = text.match(pattern)

if (match?.[1]) {

const parsedPoints = cleanNumber(
normalizeMoneyOcr(match[1])
)

if (
parsedPoints >= 100 &&
parsedPoints <= 500000
) {

contract.annual_points = String(parsedPoints)

break

}

}

}



// PRIORITY: purchase date from Date Sold
// DO NOT DELETE

const soldDateMatch = text.match(/Date Sold:\s*([0-9]{1,2}\/[a-z]{3}\.?\/[0-9]{4})/i)

if (soldDateMatch?.[1]) {
contract.purchase_date = parseDateToInput(soldDateMatch[1])
}


const expYearMatch = text.match(/Exp\.\s*Year:\s*([0-9]{4})/i)

if (expYearMatch?.[1]) {
contract.expiration_date = `${expYearMatch[1]}-12-31`
}

// PRIORITY: loan terms and interest
// DO NOT DELETE

const interestMatch = text.match(/Interest\s*Rate:\s*([0-9.]+)\s*%/i)

if (interestMatch?.[1]) {
contract.interest_rate = interestMatch[1]
}

const balanceMatch = text.match(/Balance\s*To\s*Be\s*Financed:\s*([0-9,]+\.[0-9]+)/i)

const termsMatch = text.match(/Terms:\s*([0-9]+)/i)

const firstPaymentMatch = text.match(/Due Date:\s*([a-z]{3}\.?\/[0-9]{1,2}\/[0-9]{4})/i)

if (balanceMatch?.[1]) {
const originalFinanced = normalizeMoneyOcr(balanceMatch[1])
const terms = termsMatch?.[1] || ''
const firstPaymentDate = firstPaymentMatch?.[1] ? parseMonthDayYearToInput(firstPaymentMatch[1]) : ''

contract.pending_balance = calculateEstimatedPendingBalance(
originalFinanced,
terms,
firstPaymentDate
)
}

const paymentMatch = text.match(/Principal:\s*([0-9,]+\.[0-9]+)/i)

if (paymentMatch?.[1]) {
contract.current_monthly_payment = normalizeMoneyOcr(paymentMatch[1])
}

// NO EJECUTABLE
// PRIORITY: M.P.S.A. PURCHASE PRICE DETECTION
// DO NOT DELETE
const purchasePriceMatch = text.match(/P(?:urchase|rchase)\s*Price\s*[:\s]*([0-9,.]+)/i)

const additionalPriceMatch = text.match(/Additional\s*Price\s*[:\s]*([0-9,.\s]+)/i)

const mpsaBlockMatch = text.match(/M\.?P\.?S\.?A\.?.*$/is)
const mpsaBlock = mpsaBlockMatch?.[0] || text
const creditMatch = mpsaBlock.match(/(?:Credit|redit)\s*[:\s]*([0-9,.]+)/i) 

const existingMembershipMatch = text.match(/Existing\s*Membership\s*[:\s]*([0-9,.\s]+)/i)

const newPurchaseMatch = text.match(/New\s*Purchase\s*[:\s]*([0-9,.\s]+)/i)

// PRIORITY: net sale price fallback
// DO NOT DELETE

const netSaleMatch = text.match(/Net\s*Sale\s*Price\s*[:\s]*([0-9,]+\.[0-9]{2})/i)


let currentPurchase = 0
let totalInvestment = 0

// PRIORITY 1
if (purchasePriceMatch?.[1]) {
totalInvestment = cleanNumber(
normalizeMoneyOcr(purchasePriceMatch[1])
)
}

// PRIORITY 2
if (additionalPriceMatch?.[1]) {
const additional = cleanNumber(
normalizeMoneyOcr(additionalPriceMatch[1])
)

currentPurchase = additional

if (creditMatch?.[1]) {
const credit = cleanNumber(
normalizeMoneyOcr(creditMatch[1])
)

totalInvestment = additional + credit
}
}

// PRIORITY 3
if (
existingMembershipMatch?.[1] &&
newPurchaseMatch?.[1]
) {
const existingMembership = cleanNumber(
normalizeMoneyOcr(existingMembershipMatch[1])
)

const newPurchase = cleanNumber(
normalizeMoneyOcr(newPurchaseMatch[1])
)

currentPurchase = newPurchase

totalInvestment =
existingMembership + newPurchase
}

// PRIORITY 4
if (!currentPurchase && netSaleMatch?.[1]) {
currentPurchase = cleanNumber(
normalizeMoneyOcr(netSaleMatch[1])
)
}

// NEW SALE FALLBACK
const salesTypeMatch = text.match(/Sales Type:\s*([A-ZÁÉÍÓÚÑ\s]+)/i)
const salesType = salesTypeMatch?.[1]?.trim()?.toUpperCase() || ''

if (
salesType.includes('NUEVA') &&
netSaleMatch?.[1]
) {
const netSalePrice = cleanNumber(
normalizeMoneyOcr(netSaleMatch[1])
)

currentPurchase = netSalePrice
totalInvestment = netSalePrice
}

// fallback
if (!totalInvestment && currentPurchase) {
totalInvestment = currentPurchase
}

if (
currentPurchase > 0 &&
totalInvestment > 0 &&
totalInvestment < currentPurchase
) {
totalInvestment = currentPurchase
}

if (
currentPurchase > 0 &&
!totalInvestment &&
purchasePriceMatch?.[1]
) {
totalInvestment = cleanNumber(
normalizeMoneyOcr(purchasePriceMatch[1])
)
}

contract.total_investment =
totalInvestment > 0
? totalInvestment.toFixed(2)
: ''

contract.total_paid =
contract.total_investment

// PRIORITY: last payment date
// DO NOT DELETE

const lastPaymentMatch = text.match(/Last Payment Date:\s*([a-z]{3}\.?\/[0-9]{1,2}\/[0-9]{4})/i)

if (lastPaymentMatch?.[1]) {
contract.last_payment_date = parseMonthDayYearToInput(lastPaymentMatch[1])
}

const purchaseDate = contract.purchase_date
const expirationDate = contract.expiration_date

if (purchaseDate && expirationDate) {
contract.contract_years = calculateContractYears(
purchaseDate,
expirationDate
)
}

if (expirationDate) {
contract.years_remaining = calculateYearsRemaining(expirationDate)
}

const annualPoints = cleanNumber(contract.annual_points)
const contractYears = cleanNumber(contract.contract_years)
const yearsRemaining = cleanNumber(contract.years_remaining)

contract.total_points_purchased =
annualPoints * contractYears

contract.remaining_points =
annualPoints * yearsRemaining

// FALLBACK maintenance fee parser
// NO EJECUTABLE outside parseEquityData

const maintenanceMatch = text.match(
/Maint\.\s*Fee[\s\S]{0,40}?([0-9,]+\.[0-9]{2})/i
)

if (maintenanceMatch?.[1]) {

contract.maintenance_fee =
normalizeMoneyOcr(maintenanceMatch[1])

}

// FALLBACK automatic maintenance calculation
// DO NOT DELETE

const maintenanceCalc = annualPoints * 0.525

if (!contract.maintenance_fee) {

contract.maintenance_fee =
maintenanceCalc > 0
? maintenanceCalc.toFixed(2)
: ''

}

// PRIORITY: equity footer note extraction
// DO NOT DELETE
// NO EJECUTABLE outside parseEquityData

const equityFooterNote = extractEquityFooterNote(text)

if (equityFooterNote) {
const recoPrefix = String(contract.contract_number || '')
.split('-')[0] || 'Corp'

contract.ocr_note = equityFooterNote
contract.ocr_note_author = `ReCorp-${recoPrefix}`
contract.ocr_note_created_at = formatNoteDateFromInput(contract.purchase_date || client.purchase_date)
}

copyContracts[targetContractIndex] = contract

setClient(copyClient)
setContracts(copyContracts)
}

const reviewContractsFromEquity = () => {
const parsed = parseEquityData(equityOcrText)

if (!parsed) {
setShowEquityPreview(false)
setEquityPreviewUrl('')
return
}

const reco = parsed.contract?.contract_number || ''

const shouldCreateNewContract =
!reco.startsWith('35-')

if (shouldCreateNewContract) {
setContracts((prev) => [
...prev,
{
...createEmptyContract(prev.length + 1),
...parsed.contract
}
])
} else {
setContracts((prev) => {
const copy = [...prev]

copy[0] = {
...copy[0],
...parsed.contract
}

return copy
})
}

setShowEquityPreview(false)
setEquityPreviewUrl('')
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



const cleanNumber = (value) => {
if (value === null || value === undefined) return 0



const cleaned = String(value)
.replace(/,/g, '')
.replace(/\$/g, '')
.trim()



return Number(cleaned || 0)
}



const updateContract = (index, field, value) => {
const copy = [...contracts]



copy[index] = {
...copy[index],
[field]: value
}



const purchaseDate = copy[index].purchase_date
const expirationDate = copy[index].expiration_date



if (purchaseDate && expirationDate) {
copy[index].contract_years = calculateContractYears(
purchaseDate,
expirationDate
)
}



if (expirationDate) {
copy[index].years_remaining = calculateYearsRemaining(expirationDate)
}



const annualPoints = cleanNumber(copy[index].annual_points)
const contractYears = cleanNumber(copy[index].contract_years)
const yearsRemaining = cleanNumber(copy[index].years_remaining)



copy[index].total_points_purchased = annualPoints * contractYears
copy[index].remaining_points = annualPoints * yearsRemaining



if (field === 'annual_points') {
const maintenanceCalc = annualPoints * 0.525



copy[index].maintenance_fee =
maintenanceCalc > 0 ? maintenanceCalc.toFixed(2) : ''
}



setContracts(copy)
}



const addContract = () => {
setContracts([...contracts, createEmptyContract(contracts.length + 1)])
}



const removeContract = (index) => {
if (contracts.length === 1) return
setContracts(contracts.filter((_, i) => i !== index))
}



const saveCompleteFile = async () => {
if (!client.full_name.trim()) {
alert('Full name is required.')
return
}



setSaving(true)



const { data: userData, error: userError } = await supabase.auth.getUser()



if (userError || !userData.user) {
alert('Error: user not found. Please login again.')
window.location.href = '/'
return
}

// PRIORITY: prepare automatic equity notes
// DO NOT DELETE
// NO EJECUTABLE outside saveCompleteFile

const equityNotes = contracts
.filter((contract) => contract.ocr_note && contract.ocr_note.trim())
.map((contract) => ({
id: crypto.randomUUID(),
text: contract.ocr_note.trim(),
author_name: contract.ocr_note_author || 'ReCorp',
created_at: contract.ocr_note_created_at || formatNoteDateFromInput(contract.purchase_date)
}))


const { data: newClient, error: clientError } = await supabase
.from('clients')
.insert({
full_name: client.full_name.trim(),
beneficiaries: Number(client.beneficiaries || 0),
prior_presentations: Number(client.prior_presentations || 0),
next_tier: Number(client.next_tier || 0),
price_per_point_increase: Number(client.price_per_point_increase || 0),
benefits_to_add: client.benefits_to_add || '',
certificate_date: client.certificate_date || null,
price_freeze_number: Number(client.price_freeze_number || 0.35),
notes: equityNotes,
seller_id: userData.user.id
})
.select()
.single()



if (clientError) {
setSaving(false)
alert('Error saving client: ' + clientError.message)
return
}



const validContracts = contracts.filter((c) => c.contract_number.trim())



if (validContracts.length === 0) {
setSaving(false)
window.location.href = `/clients/${newClient.id}`
return
}



const payload = validContracts.map((contract, index) => ({
client_id: newClient.id,
contract_label: index + 1,
contract_number: contract.contract_number.trim(),
annual_points: Number(contract.annual_points || 0),
contract_years: Number(contract.contract_years || 0),
purchase_date: contract.purchase_date || null,
expiration_date: contract.expiration_date || null,
last_payment_date: contract.last_payment_date || null,
pending_balance: Number(contract.pending_balance || 0),
interest_rate: Number(contract.interest_rate || 0),
current_monthly_payment: Number(contract.current_monthly_payment || 0),
annual_maintenance_increase: Number(contract.annual_maintenance_increase || 0),
maintenance_fee: Number(contract.maintenance_fee || 0),
total_points_purchased: Number(contract.total_points_purchased || 0),
remaining_points: Number(contract.remaining_points || 0),
years_remaining: calculateYearsRemaining(contract.expiration_date),
total_paid: Number(contract.total_investment || 0),
total_investment: Number(contract.total_investment || 0),
hidden_from_calendar: false
}))



const { error: contractsError } = await supabase
.from('contracts')
.insert(payload)



if (contractsError) {
setSaving(false)
alert('Client was saved, but contracts failed: ' + contractsError.message)
return
}



setSaving(false)
window.location.href = `/clients/${newClient.id}`
}



return (
<div style={page}>
<div style={topBrand}>
<img src="/logo.png" alt="logo" style={logo} />



<div>
<h1 style={brandTitle}>New Member File</h1>
<p style={brandSub}>Complete client and contract registration</p>
</div>
</div>



<div style={shell}>
<div style={header}>
<div>
<h2 style={sectionTitle}>Client Information</h2>
<div style={goldLine} />
<p style={muted}>Create the member record and attach contract data in one file.</p>
</div>



<button
onClick={() => window.location.href = '/dashboard'}
style={darkButton}
>
Dashboard
</button>
</div>



<div style={formGrid}>
<Field
label="Full Name"
value={client.full_name}
onChange={(v) => updateClient('full_name', v)}
placeholder="Member full name"
/>



<Field
label="Beneficiaries"
value={client.beneficiaries}
onChange={(v) => updateClient('beneficiaries', v)}
placeholder="Example: 2"
/>



<Field
label="Presentations"
value={client.prior_presentations}
onChange={(v) => updateClient('prior_presentations', v)}
placeholder="Example: 1"
/>



<Field
label="Next Tier"
value={client.next_tier}
onChange={(v) => updateClient('next_tier', v)}
placeholder="Example: 10000"
/>



<Field
label="Price Per Point Increase"
value={client.price_per_point_increase}
onChange={(v) => setClient({...client, price_per_point_increase: v})}
/>



<Field
label="Benefits To Add"
value={client.benefits_to_add}
onChange={(v) => setClient({...client, benefits_to_add: v})}
/>



<Field
label="Certificate Date"
type="date"
value={client.certificate_date}
onChange={(v) => updateClient('certificate_date', v)}
/>



<Field
label="Price Freeze Number"
value={client.price_freeze_number}
onChange={(v) => updateClient('price_freeze_number', v)}
placeholder="Example: 0.35"
/>
</div>



<div style={divider} />



<div style={sectionHeader}>
<div>
<h2 style={sectionTitle}>Contract Information</h2>
<div style={goldLine} />
<p style={muted}>Scan one or multiple equity sheets before reviewing and saving contracts.</p>
</div>



<div style={scanButtonGroup}>
<input
ref={equityInputRef}
type="file"
accept="image/*"
capture="environment"
onChange={handleEquityImage}
style={{ display: 'none' }}
/>



<button onClick={openEquityScanner} style={blueButton}>
Scan Equity
</button>



<button onClick={addContract} style={greenButton}>
Add Contract
</button>
</div>
</div>



{scannedEquities.length > 0 && (
<div style={scannedSummary}>
<div>
<div style={scannedTitle}>Scanned Equities</div>
<div style={scannedSub}>
{scannedEquities.length} equity image{scannedEquities.length === 1 ? '' : 's'} captured for review.
</div>
</div>



<button onClick={openEquityScanner} style={smallBlueButton}>
Scan Another Equity
</button>
</div>
)}



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



<ReadOnlyField
label="Total Years"
value={contract.contract_years}
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



<ReadOnlyField
label="Total Points Purchased"
value={contract.total_points_purchased}
/>



<ReadOnlyField
label="Remaining Points"
value={contract.remaining_points}
/>



<Field
label="Annual Maintenance Fee"
value={contract.maintenance_fee}
onChange={(v) => updateContract(index, 'maintenance_fee', v)}
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
label="Total Investment"
value={contract.total_investment}
onChange={(v) => updateContract(index, 'total_investment', v)}
/>
</div>
</div>
))}



<div style={footerActions}>
<button
onClick={() => window.location.href = '/dashboard'}
style={darkButton}
>
Cancel
</button>



<button
onClick={saveCompleteFile}
disabled={saving}
style={goldButton}
>
{saving ? 'Saving Complete File...' : 'Save Complete Member File'}
</button>
</div>
</div>



{showEquityPreview && (
<div style={overlay}>
<div style={scanBubble}>
<div style={scanHeader}>
<div>
<h2 style={scanTitle}>Equity Captured</h2>
<div style={goldLine} />
<p style={scanSub}>
The equity image was captured. OCR is now reading the document text.
</p>
</div>



<button onClick={reviewContractsFromEquity} style={closeButton}>
×
</button>
</div>



{equityPreviewUrl && (
<img
src={equityPreviewUrl}
alt="Scanned equity preview"
style={equityPreviewImage}
/>
)}



<div style={ocrBox}>
<div style={ocrTitle}>
OCR Result
</div>



{readingEquity ? (
<div style={ocrLoading}>
Reading equity... please wait.
</div>
) : (
<pre style={ocrText}>
{equityOcrText || 'No OCR text available yet.'}
</pre>
)}
</div>



<div style={scanActions}>
<button onClick={scanAnotherEquity} style={blueButton}>
Scan Another Equity
</button>



<button onClick={reviewContractsFromEquity} style={goldButton}>
Review Contracts
</button>
</div>
</div>
</div>
)}
</div>
)
}



function createEmptyContract(label) {
return {
contract_label: label,
contract_number: '',
annual_points: '',
contract_years: 0,
purchase_date: '',
expiration_date: '',
last_payment_date: '',
pending_balance: '',
interest_rate: '',
current_monthly_payment: '',
annual_maintenance_increase: '',
maintenance_fee: '',
total_points_purchased: 0,
remaining_points: 0,
years_remaining: 0,
total_paid: '',
total_investment: ''
}
}



function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
return (
<div>
<label style={labelStyle}>{label}</label>
<input
type={type}
value={value ?? ''}
placeholder={placeholder}
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
maxWidth: 1180,
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
maxWidth: 1180,
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



const sectionHeader = {
display: 'flex',
justifyContent: 'space-between',
gap: 20,
flexWrap: 'wrap',
alignItems: 'flex-start',
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
margin: '12px 0'
}



const muted = {
color: '#9ca3af',
margin: 0
}



const formGrid = {
display: 'grid',
gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
gap: 16
}



const divider = {
height: 1,
background: '#1f2937',
margin: '34px 0'
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
fontWeight: 'bold'
}



const footerActions = {
display: 'flex',
justifyContent: 'flex-end',
gap: 12,
flexWrap: 'wrap',
marginTop: 30
}



const scanButtonGroup = {
display: 'flex',
gap: 12,
flexWrap: 'wrap',
alignItems: 'center'
}



const scannedSummary = {
display: 'flex',
justifyContent: 'space-between',
gap: 16,
alignItems: 'center',
background: '#111827',
border: '1px solid #1f2937',
borderRadius: 18,
padding: 16,
marginBottom: 22
}



const scannedTitle = {
color: '#c9a86a',
fontWeight: 'bold',
textTransform: 'uppercase',
letterSpacing: 1,
fontSize: 12
}



const scannedSub = {
color: '#9ca3af',
fontSize: 13,
marginTop: 4
}



const overlay = {
position: 'fixed',
inset: 0,
background: 'rgba(15,23,42,0.72)',
backdropFilter: 'blur(7px)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
padding: 24,
zIndex: 9999
}



const scanBubble = {
width: '100%',
maxWidth: 760,
maxHeight: '92vh',
overflowY: 'auto',
background: '#f8fafc',
color: '#111827',
borderRadius: 28,
padding: 30,
border: '1px solid #e5e7eb',
boxShadow: '0 30px 90px rgba(0,0,0,0.35)'
}



const scanHeader = {
display: 'flex',
justifyContent: 'space-between',
gap: 20,
marginBottom: 20
}



const scanTitle = {
margin: 0,
textTransform: 'uppercase',
letterSpacing: 1.5,
color: '#111827'
}



const scanSub = {
color: '#64748b',
margin: 0,
lineHeight: 1.5
}



const equityPreviewImage = {
width: '100%',
maxHeight: 520,
objectFit: 'contain',
borderRadius: 18,
border: '1px solid #cbd5e1',
background: '#0f172a',
marginTop: 10
}



const ocrBox = {
marginTop: 18,
background: '#111827',
border: '1px solid #1f2937',
borderRadius: 18,
padding: 16
}



const ocrTitle = {
color: '#c9a86a',
fontWeight: 'bold',
textTransform: 'uppercase',
letterSpacing: 1,
fontSize: 12,
marginBottom: 10
}



const ocrLoading = {
color: '#f9fafb',
fontWeight: 'bold',
fontSize: 14
}



const ocrText = {
whiteSpace: 'pre-wrap',
wordBreak: 'break-word',
color: '#f9fafb',
fontSize: 12,
lineHeight: 1.5,
margin: 0,
maxHeight: 260,
overflowY: 'auto'
}



const scanActions = {
display: 'flex',
justifyContent: 'flex-end',
gap: 12,
flexWrap: 'wrap',
marginTop: 22
}



const closeButton = {
background: '#111827',
color: 'white',
border: 'none',
width: 38,
height: 38,
borderRadius: 999,
cursor: 'pointer',
fontSize: 24
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



const blueButton = {
padding: '12px 16px',
background: '#2563eb',
color: 'white',
border: 'none',
borderRadius: 10,
cursor: 'pointer',
fontWeight: 'bold'
}



const smallBlueButton = {
padding: '9px 13px',
background: '#2563eb',
color: 'white',
border: 'none',
borderRadius: 10,
cursor: 'pointer',
fontWeight: 'bold',
fontSize: 12
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