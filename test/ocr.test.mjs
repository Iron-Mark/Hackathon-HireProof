import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildOcrEvidence,
  enrichAuditRequestWithOcr,
  extractScreenshotText,
  preprocessImageForTesseract,
} from '../lib/ocr.mjs'

const SAMPLE_IMAGE = 'data:image/png;base64,aGVsbG8='

test('extractScreenshotText uses Google Vision OCR when configured', async () => {
  const previous = process.env.GOOGLE_CLOUD_VISION_API_KEY
  process.env.GOOGLE_CLOUD_VISION_API_KEY = 'test-key'

  const fetchImpl = async (_url, init) => {
    const payload = JSON.parse(init.body)
    assert.equal(payload.requests[0].features[0].type, 'DOCUMENT_TEXT_DETECTION')
    assert.equal(payload.requests[0].image.content, 'aGVsbG8=')
    return new Response(JSON.stringify({
      responses: [
        {
          fullTextAnnotation: {
            text: 'Crossing Hurdles Frontend Developer $20 - $70/hour Remote Easy Apply',
          },
        },
      ],
    }), { status: 200 })
  }

  try {
    const result = await extractScreenshotText(SAMPLE_IMAGE, { fetchImpl })

    assert.equal(result.status, 'extracted')
    assert.equal(result.provider, 'google-vision')
    assert.match(result.text, /Crossing Hurdles/)
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_CLOUD_VISION_API_KEY
    else process.env.GOOGLE_CLOUD_VISION_API_KEY = previous
  }
})

test('extractScreenshotText rejects oversized Google Vision responses before OCR extraction', async () => {
  const previous = process.env.GOOGLE_CLOUD_VISION_API_KEY
  process.env.GOOGLE_CLOUD_VISION_API_KEY = 'test-key'
  let cancelled = false

  const oversizedText = 'Remote software engineer '.repeat(70_000)
  const oversizedBody = JSON.stringify({
    responses: [
      {
        fullTextAnnotation: {
          text: oversizedText,
        },
      },
    ],
  })

  try {
    const result = await extractScreenshotText(SAMPLE_IMAGE, {
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: {
          get: (name) => name.toLowerCase() === 'content-length' ? String(Buffer.byteLength(oversizedBody)) : null,
        },
        body: {
          cancel: async () => {
            cancelled = true
          },
        },
        text: async () => oversizedBody,
      }),
      preprocessTesseract: false,
      tesseractImpl: {
        recognize: async () => ({ data: { text: '', confidence: 0 } }),
      },
    })

    assert.equal(result.status, 'unavailable')
    assert.match(result.reason, /Google Vision response exceeded/)
    assert.equal(cancelled, true)
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_CLOUD_VISION_API_KEY
    else process.env.GOOGLE_CLOUD_VISION_API_KEY = previous
  }
})

test('extractScreenshotText falls back to Tesseract when Google Vision is unavailable', async () => {
  const previousCloud = process.env.GOOGLE_CLOUD_VISION_API_KEY
  const previousAlias = process.env.GOOGLE_VISION_API_KEY
  delete process.env.GOOGLE_CLOUD_VISION_API_KEY
  delete process.env.GOOGLE_VISION_API_KEY

  try {
    const result = await extractScreenshotText(SAMPLE_IMAGE, {
      preprocessTesseract: false,
      tesseractImpl: {
        recognize: async () => ({
          data: {
            text: 'Remote frontend intern PHP 80,000 per week no interview Telegram contact',
            confidence: 87,
          },
        }),
      },
    })

    assert.equal(result.status, 'extracted')
    assert.equal(result.provider, 'tesseract')
    assert.equal(result.confidence, 0.87)
    assert.match(result.text, /Telegram/)
  } finally {
    if (previousCloud === undefined) delete process.env.GOOGLE_CLOUD_VISION_API_KEY
    else process.env.GOOGLE_CLOUD_VISION_API_KEY = previousCloud
    if (previousAlias === undefined) delete process.env.GOOGLE_VISION_API_KEY
    else process.env.GOOGLE_VISION_API_KEY = previousAlias
  }
})

test('enrichAuditRequestWithOcr appends screenshot text to audit input', async () => {
  const { request, evidence } = await enrichAuditRequestWithOcr(
    {
      text: 'Please check this job.',
      url: 'https://www.linkedin.com/jobs/view/123',
      image: SAMPLE_IMAGE,
    },
    {
      fetchImpl: async () => ({
        ok: false,
        status: 403,
        json: async () => ({}),
      }),
      preprocessTesseract: false,
      tesseractImpl: {
        recognize: async () => ({
          data: {
            text: 'Crossing Hurdles Frontend Developer $20 - $70/hour Remote Easy Apply',
            confidence: 91,
          },
        }),
      },
    },
  )

  assert.match(request.text, /Screenshot OCR content:/)
  assert.match(request.text, /Crossing Hurdles/)
  assert.equal(evidence[0].type, 'Screenshot OCR')
  assert.equal(evidence[0].source, 'Screenshot OCR: Tesseract fallback')
})

test('preprocessImageForTesseract sharpens inline screenshots before fallback OCR', async () => {
  const calls = []
  const chain = {
    metadata: async () => ({ width: 900 }),
    rotate() {
      calls.push('rotate')
      return this
    },
    resize(options) {
      calls.push(`resize:${options.width}`)
      return this
    },
    grayscale() {
      calls.push('grayscale')
      return this
    },
    normalise() {
      calls.push('normalise')
      return this
    },
    sharpen() {
      calls.push('sharpen')
      return this
    },
    png() {
      calls.push('png')
      return this
    },
    toBuffer: async () => Buffer.from('processed'),
  }
  const sharpImpl = () => chain

  const result = await preprocessImageForTesseract(SAMPLE_IMAGE, { sharpImpl })

  assert.equal(result.applied, true)
  assert.equal(result.width, 1800)
  assert.match(result.image, /^data:image\/png;base64,/)
  assert.deepEqual(calls, ['rotate', 'resize:1800', 'grayscale', 'normalise', 'sharpen', 'png'])
})

test('buildOcrEvidence records unavailable OCR without throwing', () => {
  const evidence = buildOcrEvidence({
    status: 'unavailable',
    provider: 'none',
    reason: 'Google Vision API key is not configured; fallback OCR failed.',
  })

  assert.equal(evidence.length, 1)
  assert.equal(evidence[0].type, 'Screenshot OCR Unavailable')
  assert.equal(evidence[0].trustLevel, 'low')
})
