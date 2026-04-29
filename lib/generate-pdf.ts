import jsPDF from 'jspdf'

interface PdfReportData {
  verdict: string
  riskScore: number
  confidence: string
  summary: string
  extractedClaims: Record<string, string>
  redFlags: string[]
  greenFlags: string[]
  evidence: Array<{ source: string; snippet: string; url?: string; type: string }>
  nextSteps: string[]
  timestamp?: string
}

function sanitizePdfUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url
    }
    return undefined
  } catch {
    return undefined
  }
}

export function generatePdfDossier(data: PdfReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      doc.addPage()
      y = 20
    }
  }

  // --- Header Bar ---
  const verdictColors: Record<string, [number, number, number]> = {
    safe: [22, 163, 74],
    caution: [234, 179, 8],
    'high-risk': [220, 38, 38],
  }
  const vc = verdictColors[data.verdict] || [107, 114, 128]

  doc.setFillColor(vc[0], vc[1], vc[2])
  doc.rect(0, 0, pageWidth, 36, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('HireProof Investigation Dossier', margin, 16)

  doc.setFontSize(11)
  doc.text(`Verdict: ${data.verdict.toUpperCase()}  •  Risk Score: ${data.riskScore}/100  •  Confidence: ${data.confidence}`, margin, 28)

  y = 46

  // --- Date ---
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated: ${data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString()}`, margin, y)
  y += 10

  // --- Summary ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(30, 30, 30)
  doc.text('Executive Summary', margin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const summaryLines = doc.splitTextToSize(data.summary, contentWidth)
  doc.text(summaryLines, margin, y)
  y += summaryLines.length * 5 + 8

  // --- Extracted Claims ---
  addPageIfNeeded(40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(30, 30, 30)
  doc.text('Extracted Claims', margin, y)
  y += 7

  doc.setFontSize(10)
  for (const [key, value] of Object.entries(data.extractedClaims)) {
    addPageIfNeeded(8)
    const label = key.replace(/([A-Z])/g, ' $1').trim()
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(String(value), margin + 38, y)
    y += 6
  }
  y += 6

  // --- Red Flags ---
  if (data.redFlags.length > 0) {
    addPageIfNeeded(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(220, 38, 38)
    doc.text('Red Flags', margin, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    data.redFlags.forEach((flag, i) => {
      addPageIfNeeded(8)
      const lines = doc.splitTextToSize(`${i + 1}. ${flag}`, contentWidth - 4)
      doc.text(lines, margin + 2, y)
      y += lines.length * 5 + 2
    })
    y += 4
  }

  // --- Green Flags ---
  if (data.greenFlags.length > 0) {
    addPageIfNeeded(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(22, 163, 74)
    doc.text('Green Flags', margin, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    data.greenFlags.forEach((flag, i) => {
      addPageIfNeeded(8)
      const lines = doc.splitTextToSize(`${i + 1}. ${flag}`, contentWidth - 4)
      doc.text(lines, margin + 2, y)
      y += lines.length * 5 + 2
    })
    y += 4
  }

  // --- Evidence ---
  if (data.evidence.length > 0) {
    addPageIfNeeded(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(30, 30, 30)
    doc.text('Supporting Evidence', margin, y)
    y += 7

    data.evidence.forEach((ev, i) => {
      addPageIfNeeded(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(50, 50, 50)
      doc.text(`${i + 1}. [${ev.type}] ${ev.source}`, margin + 2, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      const snippetLines = doc.splitTextToSize(ev.snippet, contentWidth - 8)
      doc.text(snippetLines, margin + 4, y)
      y += snippetLines.length * 4.5 + 2

      if (ev.url) {
        const safeUrl = sanitizePdfUrl(ev.url)
        if (safeUrl) {
          doc.setTextColor(59, 130, 246)
          doc.textWithLink(safeUrl.substring(0, 80), margin + 4, y, { url: safeUrl })
          y += 5
        }
      }
      y += 3
    })
  }

  // --- Next Steps ---
  addPageIfNeeded(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(30, 30, 30)
  doc.text('Recommended Next Steps', margin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  data.nextSteps.forEach((step, i) => {
    addPageIfNeeded(8)
    const lines = doc.splitTextToSize(`${i + 1}. ${step}`, contentWidth - 4)
    doc.text(lines, margin + 2, y)
    y += lines.length * 5 + 2
  })

  // --- Footer ---
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`HireProof • Confidential Investigation Report • Page ${i} of ${totalPages}`, margin, 288)
  }

  doc.save(`hireproof-dossier-${data.verdict}.pdf`)
}

export function generateCertificate(data: { company: string; role: string; timestamp?: string }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // --- Decorative Border ---
  doc.setDrawColor(22, 163, 74) // Safe Green
  doc.setLineWidth(2)
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S')
  
  doc.setDrawColor(20, 20, 20)
  doc.setLineWidth(0.5)
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14, 'S')

  // --- Background Elements ---
  doc.setFillColor(248, 250, 252)
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'F')

  // --- Header ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(40)
  doc.setTextColor(20, 20, 20)
  doc.text('CERTIFICATE OF SAFETY', pageWidth / 2, 45, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text('OFFICIALLY VERIFIED BY HIREPROOF AI', pageWidth / 2, 55, { align: 'center' })

  // --- Content ---
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(18)
  doc.setTextColor(60, 60, 60)
  doc.text('This document confirms that the recruitment process for:', pageWidth / 2, 85, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(32)
  doc.setTextColor(22, 163, 74)
  doc.text(data.company.toUpperCase(), pageWidth / 2, 105, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(18)
  doc.setTextColor(60, 60, 60)
  doc.text(`for the role of ${data.role}`, pageWidth / 2, 120, { align: 'center' })

  doc.setFontSize(14)
  doc.text('has been audited and found to meet all HireProof security standards.', pageWidth / 2, 140, { align: 'center' })

  // --- Footer Details ---
  const date = data.timestamp ? new Date(data.timestamp).toLocaleDateString() : new Date().toLocaleDateString()
  
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Verification Date: ${date}`, 20, pageHeight - 25)
  doc.text(`Certificate ID: HP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 20, pageHeight - 20)

  // --- Seal ---
  doc.setFillColor(22, 163, 74)
  doc.circle(pageWidth - 40, pageHeight - 40, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('HIREPROOF', pageWidth - 40, pageHeight - 42, { align: 'center' })
  doc.text('SECURE', pageWidth - 40, pageHeight - 37, { align: 'center' })

  doc.save(`hireproof-certificate-${data.company.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
