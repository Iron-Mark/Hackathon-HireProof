export type ReadinessState = 'ready' | 'credential-gated'

function present(value?: string) {
  return Boolean(value && value.trim())
}

export function getPlatformReadiness() {
  const slack = {
    track: 'ChatSDK Agents',
    state: (present(process.env.SLACK_BOT_TOKEN) && present(process.env.SLACK_SIGNING_SECRET) && present(process.env.REDIS_URL)
      ? 'ready'
      : 'credential-gated') as ReadinessState,
    endpoint: '/api/webhooks/slack',
    required: {
      SLACK_BOT_TOKEN: present(process.env.SLACK_BOT_TOKEN),
      SLACK_SIGNING_SECRET: present(process.env.SLACK_SIGNING_SECRET),
      REDIS_URL: present(process.env.REDIS_URL),
    },
  }

  const workflow = {
    track: 'Vercel Workflow / WDK',
    state: (present(process.env.WORKFLOW_SECRET) ? 'ready' : 'credential-gated') as ReadinessState,
    endpoint: '/api/workflows/audit',
    required: {
      WORKFLOW_SECRET: present(process.env.WORKFLOW_SECRET),
    },
  }

  const gateway = {
    track: 'AI Gateway',
    state: (present(process.env.AI_GATEWAY_API_KEY) || present(process.env.VERCEL_AI_GATEWAY_API_KEY) ? 'ready' : 'credential-gated') as ReadinessState,
    model: process.env.HIREPROOF_MODEL || 'openai/gpt-4o-mini',
    required: {
      AI_GATEWAY_API_KEY: present(process.env.AI_GATEWAY_API_KEY) || present(process.env.VERCEL_AI_GATEWAY_API_KEY),
    },
  }

  return {
    status: [slack.state, workflow.state, gateway.state].every((state) => state === 'ready') ? 'ready' : 'credential-gated',
    checkedAt: new Date().toISOString(),
    surfaces: { slack, workflow, gateway },
  }
}
