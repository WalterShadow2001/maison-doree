import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'

export interface BusinessInfo {
  name: string
  tagline: string
  phone: string
  email: string
  address: string
  rfc: string
}

export interface QuotationItem {
  name: string
  description?: string
  quantity: number
  unitPrice: number
}

export interface QuotationData {
  folio: string
  date: string
  validUntil: string
  client: {
    name: string
    email?: string
    phone?: string
    address?: string
    rfc?: string
  }
  items: QuotationItem[]
  subtotal: number
  discount: number
  ivaRate: number
  iva: number
  total: number
  notes?: string
  paymentTerms?: string
}

const GOLD_DARK: [number, number, number] = [156, 123, 63]
const GOLD_LIGHT: [number, number, number] = [232, 201, 124]
const DARK: [number, number, number] = [26, 26, 26]
const GRAY: [number, number, number] = [107, 107, 107]

// Cache the loaded logo image data
let _logoData: { data: string; format: 'JPEG' } | null = null

function loadLogo(): { data: string; format: 'JPEG' } | null {
  if (_logoData) return _logoData
  // Try multiple locations (public folder at runtime, project root in dev)
  const candidates = [
    path.join(process.cwd(), 'public', 'logo-maison-doree.jpg'),
    '/home/z/my-project/public/logo-maison-doree.jpg',
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p)
        _logoData = {
          data: buf.toString('base64'),
          format: 'JPEG',
        }
        return _logoData
      }
    } catch {
      // ignore and try next
    }
  }
  return null
}

function drawHeader(doc: jsPDF, business: BusinessInfo) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Top gold bar
  doc.setFillColor(...GOLD_DARK)
  doc.rect(0, 0, pageWidth, 6, 'F')
  doc.setFillColor(...GOLD_LIGHT)
  doc.rect(0, 6, pageWidth, 2, 'F')

  // Logo: try to embed the real image, fall back to gold monogram circle
  const logo = loadLogo()
  const logoSize = 22
  const logoX = 18
  const logoY = 19
  if (logo) {
    // Decorative gold ring around the logo
    doc.setFillColor(...GOLD_DARK)
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 1.5, 'F')
    // White background to keep image clean
    doc.setFillColor(255, 255, 255)
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 0.3, 'F')
    // Embed image (square, cropped into circle by mask via shape)
    try {
      doc.addImage(
        logo.data,
        logo.format,
        logoX,
        logoY,
        logoSize,
        logoSize,
        undefined,
        'FAST'
      )
    } catch {
      // Fallback to monogram if image fails
      drawMonogram(doc, logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2)
    }
  } else {
    drawMonogram(doc, logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2)
  }

  // Business name
  doc.setTextColor(...DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(26)
  doc.text(business.name, 44, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(business.tagline.toUpperCase(), 44, 36)
  doc.setFontSize(8)
  doc.text(business.address, 44, 42)
  doc.text(`Tel: ${business.phone}  |  ${business.email}`, 44, 47)
  doc.text(`RFC: ${business.rfc}`, 44, 52)

  // Decorative gold line
  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.8)
  doc.line(14, 60, pageWidth - 14, 60)
  doc.setDrawColor(...GOLD_LIGHT)
  doc.setLineWidth(0.3)
  doc.line(14, 61.5, pageWidth - 14, 61.5)
}

// Fallback monogram (used if logo image is not available)
function drawMonogram(doc: jsPDF, cx: number, cy: number, r: number) {
  doc.setFillColor(...GOLD_DARK)
  doc.circle(cx, cy, r, 'F')
  doc.setFillColor(...GOLD_LIGHT)
  doc.circle(cx, cy, r * 0.78, 'F')
  doc.setTextColor(...GOLD_DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(r * 1.1)
  doc.text('MD', cx, cy + r * 0.35, { align: 'center' })
}

function drawFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.5)
  doc.line(14, pageHeight - 22, pageWidth - 14, pageHeight - 22)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text(
    'Maison Dorée · Loza & Eventos de Lujo · Gracias por su preferencia',
    pageWidth / 2,
    pageHeight - 14,
    { align: 'center' }
  )
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(n || 0)
}

export function generateQuotationPDF(data: QuotationData, business: BusinessInfo): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  drawHeader(doc, business)

  // Document title
  doc.setTextColor(...DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.text('COTIZACIÓN', 14, 78)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...GOLD_DARK)
  doc.text(`Folio: ${data.folio}`, 14, 86)

  // Info box (right side)
  const boxX = 120
  doc.setFillColor(250, 247, 240)
  doc.roundedRect(boxX, 70, 76, 26, 2, 2, 'F')
  doc.setDrawColor(...GOLD_LIGHT)
  doc.setLineWidth(0.3)
  doc.roundedRect(boxX, 70, 76, 26, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('FECHA DE EMISIÓN', boxX + 4, 77)
  doc.text('VIGENCIA', boxX + 4, 87)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(formatDate(data.date), boxX + 40, 77)
  doc.text(formatDate(data.validUntil), boxX + 40, 87)

  // Client section
  doc.setTextColor(...DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text('Cliente', 14, 110)

  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.8)
  doc.line(14, 112, 38, 112)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.text(data.client.name, 14, 120)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  let y = 126
  if (data.client.address) {
    doc.text(`Dirección: ${data.client.address}`, 14, y)
    y += 5
  }
  if (data.client.phone) {
    doc.text(`Teléfono: ${data.client.phone}`, 14, y)
    y += 5
  }
  if (data.client.email) {
    doc.text(`Email: ${data.client.email}`, 14, y)
    y += 5
  }
  if (data.client.rfc) {
    doc.text(`RFC: ${data.client.rfc}`, 14, y)
    y += 5
  }

  // Items table
  autoTable(doc, {
    startY: y + 6,
    head: [['Cant.', 'Descripción', 'P. Unitario', 'Importe']],
    body: data.items.map((it) => [
      String(it.quantity),
      it.description ? `${it.name}\n${it.description}` : it.name,
      formatCurrency(it.unitPrice),
      formatCurrency(it.quantity * it.unitPrice),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: GOLD_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: [250, 247, 240] },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // @ts-ignore - lastAutoTable is added by the plugin
  let endY = doc.lastAutoTable?.finalY || y + 30

  // Totals
  const totalsX = 130
  const totalsW = 66
  doc.setFillColor(250, 247, 240)
  doc.roundedRect(totalsX, endY + 6, totalsW, 36, 2, 2, 'F')
  doc.setDrawColor(...GOLD_LIGHT)
  doc.setLineWidth(0.3)
  doc.roundedRect(totalsX, endY + 6, totalsW, 36, 2, 2, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('Subtotal', totalsX + 4, endY + 13)
  doc.text(formatCurrency(data.subtotal), totalsX + totalsW - 4, endY + 13, { align: 'right' })

  doc.text(`Descuento`, totalsX + 4, endY + 19)
  doc.text(`-${formatCurrency(data.discount)}`, totalsX + totalsW - 4, endY + 19, { align: 'right' })

  doc.text(`IVA (${Math.round(data.ivaRate * 100)}%)`, totalsX + 4, endY + 25)
  doc.text(formatCurrency(data.iva), totalsX + totalsW - 4, endY + 25, { align: 'right' })

  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.5)
  doc.line(totalsX + 4, endY + 28, totalsX + totalsW - 4, endY + 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GOLD_DARK)
  doc.text('TOTAL', totalsX + 4, endY + 35)
  doc.text(formatCurrency(data.total), totalsX + totalsW - 4, endY + 35, { align: 'right' })

  // Notes
  let notesY = endY + 50
  if (data.paymentTerms) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    doc.text('Condiciones de pago:', 14, notesY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    const termsLines = doc.splitTextToSize(data.paymentTerms, 180)
    doc.text(termsLines, 14, notesY + 5)
    notesY += 5 + termsLines.length * 5
  }

  if (data.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    doc.text('Notas:', 14, notesY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    const noteLines = doc.splitTextToSize(data.notes, 180)
    doc.text(noteLines, 14, notesY + 5)
  }

  drawFooter(doc)
  return doc
}

export interface ContractItem {
  name: string
  description?: string
  quantity: number
  unitPrice: number
}

export interface ContractData {
  folio: string
  date: string
  client: {
    name: string
    email?: string
    phone?: string
    address?: string
    rfc?: string
  }
  eventDate: string
  eventType?: string
  venue?: string
  startTime?: string
  endTime?: string
  guests: number
  items: ContractItem[]
  subtotal: number
  deposit: number
  balance: number
  total: number
  notes?: string
  terms?: string
}

export function generateContractPDF(data: ContractData, business: BusinessInfo): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  drawHeader(doc, business)

  // Document title
  doc.setTextColor(...DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.text('CONTRATO DE RENTA', 14, 78)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...GOLD_DARK)
  doc.text(`Folio: ${data.folio}`, 14, 86)

  // Info box
  const boxX = 120
  doc.setFillColor(250, 247, 240)
  doc.roundedRect(boxX, 70, 76, 26, 2, 2, 'F')
  doc.setDrawColor(...GOLD_LIGHT)
  doc.setLineWidth(0.3)
  doc.roundedRect(boxX, 70, 76, 26, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('FECHA CONTRATO', boxX + 4, 77)
  doc.text('FECHA EVENTO', boxX + 4, 87)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(formatDate(data.date), boxX + 40, 77)
  doc.text(formatDate(data.eventDate), boxX + 40, 87)

  // Parties section
  doc.setTextColor(...DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text('Partes del Contrato', 14, 110)

  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.8)
  doc.line(14, 112, 60, 112)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('EL PROVEEDOR:', 14, 120)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text(`${business.name}, con RFC ${business.rfc}, domiciliado en ${business.address}.`, 14, 126)
  doc.text(`Tel: ${business.phone}  |  Email: ${business.email}`, 14, 131)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('EL CLIENTE:', 14, 140)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text(`Nombre: ${data.client.name}`, 14, 146)
  let py = 151
  if (data.client.address) {
    doc.text(`Dirección: ${data.client.address}`, 14, py)
    py += 5
  }
  if (data.client.phone) {
    doc.text(`Teléfono: ${data.client.phone}`, 14, py)
    py += 5
  }
  if (data.client.email) {
    doc.text(`Email: ${data.client.email}`, 14, py)
    py += 5
  }
  if (data.client.rfc) {
    doc.text(`RFC: ${data.client.rfc}`, 14, py)
    py += 5
  }

  // Event details
  let y = py + 8
  doc.setTextColor(...DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text('Detalles del Evento', 14, y)
  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.8)
  doc.line(14, y + 2, 58, y + 2)
  y += 8

  const eventRows: [string, string][] = []
  eventRows.push(['Tipo de evento', data.eventType || '—'])
  eventRows.push(['Fecha del evento', formatDate(data.eventDate)])
  eventRows.push(['Lugar', data.venue || '—'])
  eventRows.push(['Horario', `${data.startTime || '—'} a ${data.endTime || '—'}`])
  eventRows.push(['No. de invitados', String(data.guests || 0)])

  autoTable(doc, {
    startY: y,
    body: eventRows,
    theme: 'plain',
    bodyStyles: { fontSize: 9, textColor: DARK },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: GOLD_DARK },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  })

  // @ts-ignore
  y = doc.lastAutoTable?.finalY || y + 30

  // Items table
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK)
  doc.text('Mercancía y Servicios', 14, y + 8)
  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.8)
  doc.line(14, y + 10, 64, y + 10)

  autoTable(doc, {
    startY: y + 14,
    head: [['Cant.', 'Descripción', 'P. Unitario', 'Importe']],
    body: data.items.map((it) => [
      String(it.quantity),
      it.description ? `${it.name}\n${it.description}` : it.name,
      formatCurrency(it.unitPrice),
      formatCurrency(it.quantity * it.unitPrice),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: GOLD_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: [250, 247, 240] },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // @ts-ignore
  y = doc.lastAutoTable?.finalY || y + 50

  // Totals
  const totalsX = 130
  const totalsW = 66
  doc.setFillColor(250, 247, 240)
  doc.roundedRect(totalsX, y + 6, totalsW, 36, 2, 2, 'F')
  doc.setDrawColor(...GOLD_LIGHT)
  doc.setLineWidth(0.3)
  doc.roundedRect(totalsX, y + 6, totalsW, 36, 2, 2, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('Subtotal', totalsX + 4, y + 13)
  doc.text(formatCurrency(data.subtotal), totalsX + totalsW - 4, y + 13, { align: 'right' })

  doc.text('Depósito (50%)', totalsX + 4, y + 19)
  doc.text(formatCurrency(data.deposit), totalsX + totalsW - 4, y + 19, { align: 'right' })

  doc.text('Saldo pendiente', totalsX + 4, y + 25)
  doc.text(formatCurrency(data.balance), totalsX + totalsW - 4, y + 25, { align: 'right' })

  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.5)
  doc.line(totalsX + 4, y + 28, totalsX + totalsW - 4, y + 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GOLD_DARK)
  doc.text('TOTAL', totalsX + 4, y + 35)
  doc.text(formatCurrency(data.total), totalsX + totalsW - 4, y + 35, { align: 'right' })

  y = y + 50

  // Terms
  if (y > 230) {
    doc.addPage()
    drawHeader(doc, business)
    y = 78
  }

  doc.setTextColor(...DARK)
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text('Términos y Condiciones', 14, y)
  doc.setDrawColor(...GOLD_DARK)
  doc.setLineWidth(0.8)
  doc.line(14, y + 2, 70, y + 2)

  const defaultTerms = `1. El cliente se compromete a cuidar la loza y todos los artículos rentados durante el período del evento.
2. El depósito del 50% es no reembolsable y sirve como reserva de fecha y mercancía.
3. El saldo restante deberá cubrirse 48 horas antes del evento.
4. En caso de rotura o pérdida, el cliente cubrirá el costo de reposición al 100% por pieza.
5. La devolución de la mercancía se realizará limpio y en las mismas condiciones en que fue entregada.
6. El retiro de la mercancía se acordará el día del evento; el retraso implicará un cargo adicional.
7. Maison Dorée no se hace responsable de daños a terceros derivados del uso de los artículos rentados.
8. Cualquier cancelación deberá notificarse con al menos 7 días de anticipación.`

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAY)
  const termsText = data.terms || defaultTerms
  const termsLines = doc.splitTextToSize(termsText, 180)
  doc.text(termsLines, 14, y + 7)

  y = y + 7 + termsLines.length * 4.5 + 8

  if (data.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    doc.text('Notas adicionales:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    const noteLines = doc.splitTextToSize(data.notes, 180)
    doc.text(noteLines, 14, y + 5)
    y += 5 + noteLines.length * 5
  }

  // Signatures
  if (y > 240) {
    doc.addPage()
    drawHeader(doc, business)
    y = 78
  } else {
    y = Math.max(y + 14, 240)
  }

  doc.setDrawColor(...DARK)
  doc.setLineWidth(0.3)
  doc.line(20, y, 80, y)
  doc.line(pageWidth - 80, y, pageWidth - 20, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text(business.name, 50, y + 5, { align: 'center' })
  doc.text(data.client.name, pageWidth - 50, y + 5, { align: 'center' })

  doc.setTextColor(...GRAY)
  doc.setFontSize(7.5)
  doc.text('El Proveedor', 50, y + 10, { align: 'center' })
  doc.text('El Cliente', pageWidth - 50, y + 10, { align: 'center' })

  drawFooter(doc)
  return doc
}

export async function getBusinessInfo(db: any): Promise<BusinessInfo> {
  const result = await db.execute('SELECT key, value FROM settings')
  const map: Record<string, string> = {}
  for (const r of result.rows) {
    map[(r as any).key] = (r as any).value
  }
  return {
    name: map['business_name'] || 'Maison Dorée',
    tagline: map['business_tagline'] || 'Loza & Eventos de Lujo',
    phone: map['business_phone'] || '',
    email: map['business_email'] || '',
    address: map['business_address'] || '',
    rfc: map['business_rfc'] || '',
  }
}
