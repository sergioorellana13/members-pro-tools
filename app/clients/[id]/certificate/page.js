'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import QRCode from 'qrcode'

export default function CertificatePage({ params }) {
const resolvedParams = React.use(params)
const clientId = resolvedParams.id
const [client, setClient] = useState(null)
const [qrImage, setQrImage] = useState('')

useEffect(() => {
loadClient()
}, [])

const generateFolio = () => {
return 'COV-92663-11AR'
}

const loadClient = async () => {
const { data, error } = await supabase
.from('clients')
.select('*')
.eq('id', clientId)
.single()

if (error) {
alert('Error loading certificate: ' + error.message)
return
}

let folio = data.certificate_folio

if (!folio) {
folio = generateFolio()

const { error: updateError } = await supabase
.from('clients')
.update({ certificate_folio: folio })
.eq('id', clientId)

if (updateError) {
alert('Error generating folio: ' + updateError.message)
return
}
}

const updatedClient = {
...data,
certificate_folio: folio
}

setClient(updatedClient)

const qrData = [
'Redeem Code: COV-92663-11AR',
'Activation Code: Y3sD0i7T',
'Contract passcode: 777GoD8Jfs'
].join('\n')

const qr = await QRCode.toDataURL(qrData, {
width: 220,
margin: 1
})

setQrImage(qr)
}

const formatDate = (dateValue) => {
if (!dateValue) return 'Pending Date'

return new Date(dateValue + 'T12:00:00').toLocaleDateString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric'
})
}

const money = (v) =>
'$' + Number(v || 0).toLocaleString('en-US', {
minimumFractionDigits: 2,
maximumFractionDigits: 2
})

const numberFormat = (v) => Number(v || 0).toLocaleString('en-US')

const tierName = () => {
const t = Number(client?.next_tier) || 0
if (t >= 25000) return 'Luxxe Level'
if (t >= 15000) return 'Residence Level'
if (t >= 10000) return '5 Star Elite'
if (t >= 5000) return '4 Star Elite'
return 'Member Level'
}

const newMaintenance = (Number(client?.next_tier) || 0) * 0.525
const pricePerPointIncrease = Number(client?.price_per_point_increase || 0)
const priceFreezeNumber = client?.price_freeze_number ?? 0.35

const generatePDF = async () => {
const html2pdf = (await import('html2pdf.js')).default
const element = document.getElementById('certificate-pdf')

html2pdf()
.set({
margin: 0,
filename: 'Price_Freeze_Certificate.pdf',
image: { type: 'jpeg', quality: 0.98 },
html2canvas: {
scale: 2,
useCORS: true,
backgroundColor: '#f7f1df',
scrollY: 0
},
jsPDF: {
unit: 'px',
format: [816, 1056],
orientation: 'portrait'
},
pagebreak: { mode: [] }
})
.from(element)
.save()
}

return (
<div style={page}>
<div id="certificate-pdf" style={certificate}>
{/* SECURITY PATTERN */}
<div style={securityPattern} />

{/* WATERMARK */}
<div style={watermark}>PRICE FREEZE</div>

<div style={contentLayer}>
{/* TOP HEADER */}
<div style={topHeader}>
<img
src="/certificate-logo.png"
alt="certificate logo"
style={certificateLogo}
/>

<div style={certificateMeta}>
Certificate Date<br />
<strong style={{ color: '#374151' }}>
{formatDate(client?.certificate_date)}
</strong>
<br /><br />
Folio<br />
<strong style={{ color: '#374151' }}>
{client?.certificate_folio || 'Generating...'}
</strong>
</div>
</div>

{/* TITLE */}
<div style={titleBlock}>
<div style={officialText}>
Official Membership Document
</div>

<h1 style={mainTitle}>
Price Freeze Certificate
</h1>

<div style={titleLine} />
</div>

{/* LEGAL TEXT */}
<div style={legalBox}>
<p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
This price freeze certificate entitles{' '}
<strong>{client?.full_name || 'Member'}</strong> to add additional
points, level up or refinance their Villa Preferred Access membership
within the next 12 months or the next membership update registration.
To execute this certificate, all members must be present at the time
of registration and must be exercised in an official Villa Group
salesfloor. If members decide not to execute this certificate once
expired the current purchase benefit will go back to its regular price
per point plus {pricePerPointIncrease} cts. If this certificate is accepted and executed by
the members, a printed copy must be added on file along with the new
worksheet.
</p>
</div>

{/* MAIN DATA */}
<div style={mainDataGrid}>
<div style={infoBox}>
<div style={infoLabel}>Certificate Points</div>
<div style={infoValue}>{numberFormat(client?.next_tier)} pts</div>
</div>

<div style={infoBox}>
<div style={infoLabel}>Price Hold</div>
<div style={infoValue}>{priceFreezeNumber} cts</div>
</div>
</div>

{/* TIER */}
<div style={tierBox}>
<div style={infoLabel}>New Tier Classification</div>

<div style={tierTitle}>
{tierName()}
</div>

<div style={tierGrid}>
<div>
<strong>New Maintenance Fee:</strong><br />
{money(newMaintenance)}
</div>

<div style= {{marginTop: -40}}>
<strong>Included Rights:</strong><br />
{client?.benefits_to_add ? (
<ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.25 }}>
{client.benefits_to_add.split(',').map((benefit, index) => (
<li key={index}>{benefit.trim()}</li>
))}
</ul>
) : (
<span>
Right to use • Real Estate Equity • Acceleration without future adjustments
</span>
)}
</div>
</div>
</div>

{/* BOTTOM SECTION */}
<div style={bottomSection}>
{/* ACCEPTED / DECLINED */}
<div style={acceptanceBox}>
<div style={acceptanceRow}>
<div style={checkboxSquare} />
<div>
<strong>Accepted.</strong> I/We hereby acknowledge, accept and agree to the promotional pricing conditions, membership benefits, execution requirements and price hold terms described in this Price Freeze Certificate.
</div>
</div>

<div style={acceptanceRow}>
<div style={checkboxSquare} />
<div>
<strong>Declined.</strong> I/We voluntarily decline this promotional offer and understand that my/our future ability to purchase additional points, upgrade, refinance, or otherwise acquire membership points will revert to the standard prevailing price per point applicable to my/our membership program at the time of any future transaction.
</div>
</div>
</div>

<div style={bottomGrid}>
{/* SIGNATURE */}
<div style={signatureBox}>
<div style={signedBy}>Signed by:</div>

<div style={signatureArea}>
<img
src="/signature-raul-pro.png"
alt="Signature Raul Ernesto Ferrara G."
style={signatureImage}
/>

<div style={signatureLine} />

<div style={signatureName}>
<strong>Raul Ernesto Ferrara G.</strong>
<br />
Club Manager
</div>
</div>
</div>

{/* SEAL + QR */}
<div style={verificationBox}>
<div style={seal}>
Villa Group<br />Access<br />Verified
</div>

{qrImage && (
<div style={{ textAlign: 'center' }}>
<img
src={qrImage}
alt="certificate qr"
style={qrStyle}
/>

<div style={qrLabel}>
Verification QR
</div>
</div>
)}
</div>
</div>
</div>
</div>

{/* FOOTER */}
<div style={footer}>
Internal membership certificate · Printed copy must be added on file with the new worksheet
</div>
</div>

<div style={buttonBar}>
<button
onClick={() => window.location.href = `/clients/${clientId}/notes`}
style={darkButton}
>
Back to Notes
</button>

<button onClick={generatePDF} style={goldButton}>
Download Price Freeze Certificate
</button>
</div>
</div>
)
}

const page = {
minHeight: '100vh',
background: '#f3f0e7',
padding: 30,
fontFamily: 'Georgia, Times New Roman, serif'
}

const certificate = {
width: 816,
height: 1056,
paddingBottom: 140,
margin: '0 auto',
background: '#f7f1df',
padding: 34,
border: '8px double #b8965a',
position: 'relative',
color: '#1f2937',
overflow: 'hidden',
boxSizing: 'border-box'
}

const securityPattern = {
position: 'absolute',
inset: 0,
backgroundImage:
'repeating-linear-gradient(45deg, rgba(184,150,90,0.055) 0px, rgba(184,150,90,0.055) 1px, transparent 1px, transparent 12px)',
pointerEvents: 'none'
}

const watermark = {
position: 'absolute',
top: 425,
left: 0,
right: 0,
textAlign: 'center',
fontSize: 64,
color: 'rgba(184,150,90,0.08)',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontWeight: 'bold',
letterSpacing: 6,
transform: 'rotate(-18deg)',
pointerEvents: 'none'
}

const contentLayer = {
position: 'relative',
zIndex: 2
}

const topHeader = {
display: 'flex',
justifyContent: 'space-between',
alignItems: 'flex-start',
marginBottom: 13
}

const certificateLogo = {
width: 150,
objectFit: 'contain'
}

const certificateMeta = {
textAlign: 'right',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 10.5,
color: '#6b7280',
letterSpacing: 1,
lineHeight: 1.45
}

const titleBlock = {
textAlign: 'center',
marginBottom: 16
}

const officialText = {
fontSize: 11.5,
letterSpacing: 4,
textTransform: 'uppercase',
color: '#8a6a2f',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
marginBottom: 7
}

const mainTitle = {
margin: 0,
fontSize: 29,
letterSpacing: 2,
textTransform: 'uppercase',
color: '#111827'
}

const titleLine = {
width: 115,
height: 3,
background: '#b8965a',
margin: '12px auto 0'
}

const legalBox = {
border: '1px solid rgba(184,150,90,0.45)',
padding: 16,
background: 'rgba(255,255,255,0.45)',
marginBottom: 15
}

const mainDataGrid = {
display: 'grid',
gridTemplateColumns: '1fr 1fr',
gap: 13,
marginBottom: 15
}

const tierBox = {
border: '2px solid #b8965a',
background:
'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(247,241,223,0.96))',
padding: '12px 16px 10px',
marginBottom: 16,
minHeight: 165,
boxSizing: 'border-box'
}

const tierTitle = {
fontSize: 24,
fontWeight: 'bold',
color: '#b8965a',
marginBottom: 6
}

const tierGrid = {
display: 'grid',
gridTemplateColumns: '0.95fr 1.05fr',
gap: 12,
fontSize: 11.6,
lineHeight: 1.22,
alignItems: 'start',
marginTop: -4
}

const bottomSection = {
marginTop: 18,
height: 245,
display: 'flex',
flexDirection: 'column',
justifyContent: 'space-between'
}

const acceptanceBox = {
height: 118,
border: '1px solid rgba(184,150,90,0.38)',
background: 'rgba(255,255,255,0.35)',
padding: '13px 16px',
boxSizing: 'border-box',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 9.8,
lineHeight: 1.36,
display: 'flex',
flexDirection: 'column',
gap: 11
}

const acceptanceRow = {
display: 'flex',
alignItems: 'flex-start',
gap: 10
}

const checkboxSquare = {
width: 14,
height: 14,
border: '1.7px solid #111827',
background: 'rgba(255,255,255,0.35)',
marginTop: 1,
flexShrink: 0
}

const bottomGrid = {
display: 'grid',
gridTemplateColumns: '1fr 260px',
gap: 28,
alignItems: 'end'
}

const signatureBox = {
height: 120,
display: 'flex',
flexDirection: 'column',
justifyContent: 'flex-end'
}

const signedBy = {
fontSize: 15,
marginBottom: 8
}

const signatureArea = {
width: 260,
textAlign: 'center',
position: 'relative',
height: 88
}

const signatureImage = {
width: 130,
position: 'absolute',
left: 60,
top: -74,
opacity: 0.92,
zIndex: 2
}

const signatureLine = {
position: 'absolute',
left: 0,
top: 45,
width: 260,
borderTop: '1px solid #111827'
}

const signatureName = {
position: 'absolute',
left: 0,
top: 52,
width: 260,
textAlign: 'center',
fontSize: 12
}

const verificationBox = {
height: 120,
display: 'flex',
justifyContent: 'flex-end',
alignItems: 'flex-end',
gap: 14
}

const seal = {
width: 92,
height: 92,
border: '2px solid #b8965a',
borderRadius: '50%',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
textAlign: 'center',
color: '#b8965a',
fontSize: 9,
letterSpacing: 1.05,
textTransform: 'uppercase',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
background: 'rgba(255,255,255,0.3)'
}

const qrStyle = {
width: 92,
height: 92,
display: 'block'
}

const qrLabel = {
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 8.5,
color: '#6b7280',
marginTop: 4,
letterSpacing: 0.5
}

const footer = {
position: 'absolute',
left: 0,
right: 0,
bottom: 18,
textAlign: 'center',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 8.5,
color: '#9ca3af',
letterSpacing: 1
}

const buttonBar = {
maxWidth: 816,
margin: '24px auto 0',
display: 'flex',
justifyContent: 'flex-end',
gap: 12,
fontFamily: 'Helvetica Neue, Arial, sans-serif'
}

const infoBox = {
border: '1px solid rgba(184,150,90,0.55)',
padding: 14,
background: 'rgba(255,255,255,0.5)'
}

const infoLabel = {
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 10,
textTransform: 'uppercase',
letterSpacing: 1.5,
color: '#6b7280',
marginBottom: 6
}

const infoValue = {
fontSize: 23,
fontWeight: 'bold'
}

const darkButton = {
padding: '13px 18px',
background: '#111827',
color: 'white',
border: 'none',
borderRadius: 8,
cursor: 'pointer',
fontWeight: 'bold'
}

const goldButton = {
padding: '13px 18px',
background: '#b8965a',
color: '#111827',
border: 'none',
borderRadius: 8,
cursor: 'pointer',
fontWeight: 'bold'
}