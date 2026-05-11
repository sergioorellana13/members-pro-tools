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
<div
style={{
minHeight: '100vh',
background: '#f3f0e7',
padding: 30,
fontFamily: 'Georgia, Times New Roman, serif'
}}
>
<div
id="certificate-pdf"
style={{
width: 816,
height: 1056,
margin: '0 auto',
background: '#f7f1df',
padding: 34,
border: '8px double #b8965a',
position: 'relative',
color: '#1f2937',
overflow: 'hidden',
boxSizing: 'border-box'
}}
>
{/* SECURITY PATTERN */}
<div
style={{
position: 'absolute',
inset: 0,
backgroundImage:
'repeating-linear-gradient(45deg, rgba(184,150,90,0.055) 0px, rgba(184,150,90,0.055) 1px, transparent 1px, transparent 12px)',
pointerEvents: 'none'
}}
/>


{/* WATERMARK */}
<div
style={{
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
}}
>
PRICE FREEZE
</div>


<div style={{ position: 'relative', zIndex: 2 }}>
{/* TOP HEADER */}
<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'flex-start',
marginBottom: 13
}}
>
<img
src="/certificate-logo.png"
alt="certificate logo"
style={{
width: 150,
objectFit: 'contain'
}}
/>


<div
style={{
textAlign: 'right',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 10.5,
color: '#6b7280',
letterSpacing: 1,
lineHeight: 1.45
}}
>
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
<div style={{ textAlign: 'center', marginBottom: 16 }}>
<div
style={{
fontSize: 11.5,
letterSpacing: 4,
textTransform: 'uppercase',
color: '#8a6a2f',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
marginBottom: 7
}}
>
Official Membership Document
</div>


<h1
style={{
margin: 0,
fontSize: 29,
letterSpacing: 2,
textTransform: 'uppercase',
color: '#111827'
}}
>
Price Freeze Certificate
</h1>


<div
style={{
width: 115,
height: 3,
background: '#b8965a',
margin: '12px auto 0'
}}
/>
</div>


{/* LEGAL TEXT */}
<div
style={{
border: '1px solid rgba(184,150,90,0.45)',
padding: 16,
background: 'rgba(255,255,255,0.45)',
marginBottom: 15
}}
>
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
<div
style={{
display: 'grid',
gridTemplateColumns: '1fr 1fr',
gap: 13,
marginBottom: 15
}}
>
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
<div
style={{
border: '2px solid #b8965a',
background:
'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(247,241,223,0.96))',
padding: 16,
marginBottom: 18
}}
>
<div style={infoLabel}>New Tier Classification</div>


<div
style={{
fontSize: 26,
fontWeight: 'bold',
color: '#b8965a',
marginBottom: 10
}}
>
{tierName()}
</div>


<div
style={{
display: 'grid',
gridTemplateColumns: '1fr 1fr',
gap: 12,
fontSize: 13.5,
lineHeight: 1.42
}}
>
<div>
<strong>New Maintenance Fee:</strong><br />
{money(newMaintenance)}
</div>


<div>
<strong>Included Rights:</strong><br />
{client?.benefits_to_add ? (
<ul style={{ marginTop: 6, paddingLeft: 18 }}>
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


{/* SIGNATURE + SEAL + QR */}
<div
style={{
marginTop: 5,
display: 'grid',
gridTemplateColumns: '1fr auto',
alignItems: 'end',
gap: 18
}}
>
<div>
<p style={{ marginBottom: 5 }}>Signed by:</p>


<div style={{ textAlign: 'center', width: 210 }}>
<img
src="/signature-raul-pro.png"
alt="Signature Raul Ernesto Ferrara G."
style={{
width: 155,
marginBottom: 2
}}
/>


<div
style={{
borderTop: '1px solid #111827',
width: 220,
margin: '0 auto',
marginBottom: 6
}}
/>


<div style={{ fontSize: 12 }}>
<strong>Raul Ernesto Ferrara G.</strong>
<br />
Club Manager
</div>
</div>
</div>


<div
style={{
display: 'flex',
justifyContent: 'flex-end',
alignItems: 'flex-end',
gap: 14
}}
>
<div
style={{
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
fontFamily: 'Helvetica Neue, Arial, sans-serif'
}}
>
Villa Group<br />Access<br />Verified
</div>


{qrImage && (
<div style={{ textAlign: 'center' }}>
<img
src={qrImage}
alt="certificate qr"
style={{
width: 92,
height: 92,
display: 'block'
}}
/>
<div
style={{
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 8.5,
color: '#6b7280',
marginTop: 4,
letterSpacing: 0.5
}}
>
Verification QR
</div>
</div>
)}
</div>
</div>
</div>


{/* FOOTER */}
<div
style={{
position: 'absolute',
left: 0,
right: 0,
bottom: -20,
textAlign: 'center',
fontFamily: 'Helvetica Neue, Arial, sans-serif',
fontSize: 8.5,
color: '#9ca3af',
letterSpacing: 1
}}
>
Internal membership certificate · Printed copy must be added on file with the new worksheet
</div>
</div>


<div
style={{
maxWidth: 816,
margin: '24px auto 0',
display: 'flex',
justifyContent: 'flex-end',
gap: 12,
fontFamily: 'Helvetica Neue, Arial, sans-serif'
}}
>
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