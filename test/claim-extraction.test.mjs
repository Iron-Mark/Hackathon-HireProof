import test from 'node:test'
import assert from 'node:assert/strict'
import { recoverObviousClaims } from '../lib/claim-extraction.mjs'

const scamInput = {
  text: 'Remote frontend intern at Apex Hiring. PHP 80,000/week. No interview required. Apply by Telegram only.',
  location: 'Philippines',
}

test('recoverObviousClaims fills scam-critical fields missed by AI extraction', () => {
  const claims = recoverObviousClaims(scamInput, {
    company: 'Unknown / Not Verifiable',
    role: 'Unspecified role',
    salary: 'Not specified',
    location: 'Philippines',
    contactMethod: 'Not specified',
    applicationPath: 'Not specified',
  })

  assert.equal(claims.company, 'Apex Hiring')
  assert.equal(claims.role, 'Frontend Intern')
  assert.equal(claims.salary, 'PHP 80,000/week')
  assert.equal(claims.location, 'Philippines')
  assert.equal(claims.contactMethod, 'Telegram')
  assert.equal(claims.applicationPath, 'No interview mentioned')
})

test('recoverObviousClaims preserves credible extracted values', () => {
  const claims = recoverObviousClaims(scamInput, {
    company: 'Known Company',
    role: 'Security Analyst',
    salary: 'PHP 90,000/month',
    location: 'Manila',
    contactMethod: 'Email',
    applicationPath: 'Official careers channel',
  })

  assert.equal(claims.company, 'Known Company')
  assert.equal(claims.role, 'Security Analyst')
  assert.equal(claims.salary, 'PHP 90,000/month')
  assert.equal(claims.location, 'Manila')
  assert.equal(claims.contactMethod, 'Email')
  assert.equal(claims.applicationPath, 'Official careers channel')
})

test('recoverObviousClaims stops explicit company extraction at the next field label', () => {
  const claims = recoverObviousClaims({
    text: 'Company: Canva. Role: Product Designer. Salary: $120,000/year. Location: Sydney. Apply through official careers website.',
    url: 'https://www.canva.com/careers/',
    location: 'Sydney, Australia',
  }, {
    company: 'Unknown / Not Verifiable',
    role: 'Product Designer',
    salary: '$120,000/year',
    location: 'Sydney, Australia',
    contactMethod: 'Not specified',
    applicationPath: 'Official careers channel',
  })

  assert.equal(claims.company, 'Canva')
  assert.equal(claims.role, 'Product Designer')
})
