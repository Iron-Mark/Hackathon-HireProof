import { checkProviderCostGuard } from './provider-cost-guard.mjs'

const GOOGLE_VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate'
const MIN_USEFUL_OCR_TEXT_LENGTH = 24
const TESSERACT_TARGET_WIDTH = 1800
const TESSERACT_MAX_WIDTH = 2800

function stripDataUrlPrefix(image) {
  return String(image || '').replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '')
}

function normalizeOcrText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 8_000)
}

function isDataImage(image) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(String(image || ''))
}

function decodeImageBuffer(image) {
  const value = String(image || '')
  if (!value) return null
  if (isDataImage(value)) return Buffer.from(stripDataUrlPrefix(value), 'base64')
  if (/^[a-z0-9+/=\s]+$/i.test(value) && value.length > 128) return Buffer.from(value.replace(/\s+/g, ''), 'base64')
  return null
}

export async function preprocessImageForTesseract(image, options = {}) {
  if (options.preprocess === false) return { image, applied: false, reason: 'Preprocessing disabled.' }

  const buffer = decodeImageBuffer(image)
  if (!buffer) {
    return {
      image,
      applied: false,
      reason: 'Screenshot is not an inline base64 image, so Tesseract preprocessing was skipped.',
    }
  }

  try {
    const sharpModule = options.sharpImpl || await import('sharp')
    const sharp = sharpModule.default || sharpModule
    const source = sharp(buffer, { failOn: 'none', limitInputPixels: 32_000_000 })
    const metadata = await source.metadata()
    const width = Number(metadata?.width || 0)
    const targetWidth = width > 0
      ? Math.min(TESSERACT_MAX_WIDTH, Math.max(TESSERACT_TARGET_WIDTH, width))
      : TESSERACT_TARGET_WIDTH

    const processed = await sharp(buffer, { failOn: 'none', limitInputPixels: 32_000_000 })
      .rotate()
      .resize({ width: targetWidth, withoutEnlargement: false })
      .grayscale()
      .normalise()
      .sharpen({ sigma: 1 })
      .png({ compressionLevel: 6, adaptiveFiltering: true })
      .toBuffer()

    return {
      image: `data:image/png;base64,${processed.toString('base64')}`,
      applied: true,
      width: targetWidth,
    }
  } catch (error) {
    return {
      image,
      applied: false,
      reason: error instanceof Error ? error.message : 'Image preprocessing failed.',
    }
  }
}

function ocrEvidence(provider, status, text, reason, confidence) {
  const source = provider === 'google-vision'
    ? 'Screenshot OCR: Google Vision'
    : provider === 'tesseract'
      ? 'Screenshot OCR: Tesseract fallback'
      : 'Screenshot OCR unavailable'

  return {
    type: status === 'extracted' ? 'Screenshot OCR' : 'Screenshot OCR Unavailable',
    source,
    sourceType: 'enrichment',
    trustLevel: status === 'extracted' ? (provider === 'google-vision' ? 'high' : 'medium') : 'low',
    matchConfidence: typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : undefined,
    snippet: status === 'extracted'
      ? `Extracted screenshot text using ${source}. ${text.slice(0, 600)}`
      : `Screenshot text could not be extracted. ${reason || 'OCR provider unavailable.'}`,
  }
}

async function extractWithGoogleVision(image, fetchImpl = fetch) {
  if (process.env.PUBLIC_GOOGLE_VISION_OCR_ENABLED === 'false') {
    return { status: 'skipped', provider: 'google-vision', reason: 'Google Vision OCR is disabled by PUBLIC_GOOGLE_VISION_OCR_ENABLED.' }
  }

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim() || process.env.GOOGLE_VISION_API_KEY?.trim()
  if (!apiKey) return { status: 'skipped', provider: 'google-vision', reason: 'Google Vision API key is not configured.' }

  const costGuard = await checkProviderCostGuard('googleVision')
  if (!costGuard.allowed) {
    return { status: 'failed', provider: 'google-vision', reason: costGuard.status.message || 'Google Vision OCR daily platform limit reached.' }
  }

  const response = await fetchImpl(`${GOOGLE_VISION_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: stripDataUrlPrefix(image) },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) {
    return {
      status: 'failed',
      provider: 'google-vision',
      reason: `Google Vision returned HTTP ${response.status}.`,
    }
  }

  const payload = await response.json()
  const result = payload?.responses?.[0] || {}
  if (result.error?.message) {
    return { status: 'failed', provider: 'google-vision', reason: result.error.message }
  }

  const text = normalizeOcrText(result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || '')
  if (text.length < MIN_USEFUL_OCR_TEXT_LENGTH) {
    return { status: 'failed', provider: 'google-vision', reason: 'Google Vision did not return enough readable text.' }
  }

  return { status: 'extracted', provider: 'google-vision', text, confidence: 0.92 }
}

async function extractWithTesseract(image, options = {}) {
  try {
    const prepared = await preprocessImageForTesseract(image, {
      preprocess: options.preprocess !== false,
      sharpImpl: options.sharpImpl,
    })
    const tesseract = options.tesseractImpl || await import('tesseract.js')
    const recognize = tesseract.recognize || tesseract.default?.recognize
    if (typeof recognize !== 'function') {
      return { status: 'failed', provider: 'tesseract', reason: 'Tesseract recognize function is unavailable.' }
    }

    const result = await recognize(prepared.image, 'eng')
    const text = normalizeOcrText(result?.data?.text || '')
    const confidence = Number(result?.data?.confidence || 0) / 100

    if (text.length < MIN_USEFUL_OCR_TEXT_LENGTH) {
      return { status: 'failed', provider: 'tesseract', reason: 'Tesseract did not return enough readable text.' }
    }

    return {
      status: 'extracted',
      provider: 'tesseract',
      text,
      confidence: Number.isFinite(confidence) && confidence > 0 ? confidence : 0.6,
      preprocessing: {
        applied: prepared.applied,
        width: prepared.width,
        reason: prepared.reason,
      },
    }
  } catch (error) {
    return {
      status: 'failed',
      provider: 'tesseract',
      reason: error instanceof Error ? error.message : 'Tesseract OCR failed.',
    }
  }
}

export async function extractScreenshotText(image, options = {}) {
  if (!image) return { status: 'skipped', provider: 'none', reason: 'No screenshot was provided.' }

  const googleResult = await extractWithGoogleVision(image, options.fetchImpl || fetch).catch((error) => ({
    status: 'failed',
    provider: 'google-vision',
    reason: error instanceof Error ? error.message : 'Google Vision OCR failed.',
  }))
  if (googleResult.status === 'extracted') return googleResult

  const tesseractResult = await extractWithTesseract(image, {
    tesseractImpl: options.tesseractImpl,
    sharpImpl: options.sharpImpl,
    preprocess: options.preprocessTesseract,
  })
  if (tesseractResult.status === 'extracted') return tesseractResult

  return {
    status: 'unavailable',
    provider: 'none',
    reason: [googleResult.reason, tesseractResult.reason].filter(Boolean).join(' ') || 'OCR providers unavailable.',
  }
}

export function buildOcrEvidence(ocr) {
  if (!ocr || ocr.status === 'skipped') return []
  return [ocrEvidence(ocr.provider, ocr.status, ocr.text || '', ocr.reason, ocr.confidence)]
}

export async function enrichAuditRequestWithOcr(input, options = {}) {
  const ocr = await extractScreenshotText(input?.image, options)
  const evidence = buildOcrEvidence(ocr)
  if (ocr.status !== 'extracted') return { request: input, ocr, evidence }

  const text = [
    input.text || '',
    '',
    'Screenshot OCR content:',
    ocr.text,
    '',
    'Audit instruction: compare screenshot OCR content against pasted text and resolved URL content. If they disagree, flag the mismatch as evidence and avoid a high-confidence safe verdict.',
  ].join('\n').trim()

  return {
    request: { ...input, text },
    ocr,
    evidence,
  }
}
