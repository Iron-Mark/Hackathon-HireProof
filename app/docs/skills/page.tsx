import type { Metadata } from 'next'
import SkillsClient from './skills-client'

export const metadata: Metadata = {
  title: 'Agent Skills | HireProof Docs',
  description: 'Use HireProof MCP investigation skills with Claude, Codex, Gemini CLI, Cursor, and other SKILL.md-compatible agents.',
}

export default function SkillsPage() {
  return <SkillsClient />
}
