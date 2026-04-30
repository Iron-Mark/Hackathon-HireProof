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

  const discord = {
    track: 'ChatSDK Agents',
    state: (present(process.env.DISCORD_BOT_TOKEN) && present(process.env.DISCORD_PUBLIC_KEY) && present(process.env.DISCORD_APPLICATION_ID) && present(process.env.REDIS_URL)
      ? 'ready'
      : 'credential-gated') as ReadinessState,
    endpoint: '/api/webhooks/discord',
    required: {
      DISCORD_BOT_TOKEN: present(process.env.DISCORD_BOT_TOKEN),
      DISCORD_PUBLIC_KEY: present(process.env.DISCORD_PUBLIC_KEY),
      DISCORD_APPLICATION_ID: present(process.env.DISCORD_APPLICATION_ID),
      REDIS_URL: present(process.env.REDIS_URL),
    },
  }

  const telegram = {
    track: 'ChatSDK Agents',
    state: (present(process.env.TELEGRAM_BOT_TOKEN) && present(process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN) && present(process.env.TELEGRAM_BOT_USERNAME) && present(process.env.REDIS_URL)
      ? 'ready'
      : 'credential-gated') as ReadinessState,
    endpoint: '/api/webhooks/telegram',
    required: {
      TELEGRAM_BOT_TOKEN: present(process.env.TELEGRAM_BOT_TOKEN),
      TELEGRAM_WEBHOOK_SECRET_TOKEN: present(process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN),
      TELEGRAM_BOT_USERNAME: present(process.env.TELEGRAM_BOT_USERNAME),
      REDIS_URL: present(process.env.REDIS_URL),
    },
  }

  const whatsapp = {
    track: 'ChatSDK Agents',
    state: (present(process.env.ZERNIO_API_KEY) && present(process.env.ZERNIO_WEBHOOK_SECRET) && present(process.env.REDIS_URL)
      ? 'ready'
      : 'credential-gated') as ReadinessState,
    endpoint: '/api/webhooks/zernio',
    adapter: 'Zernio ChatSDK adapter for WhatsApp',
    required: {
      ZERNIO_API_KEY: present(process.env.ZERNIO_API_KEY),
      ZERNIO_WEBHOOK_SECRET: present(process.env.ZERNIO_WEBHOOK_SECRET),
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
    status: [slack.state, discord.state, telegram.state, whatsapp.state, workflow.state, gateway.state].every((state) => state === 'ready') ? 'ready' : 'credential-gated',
    checkedAt: new Date().toISOString(),
    surfaces: { slack, discord, telegram, whatsapp, workflow, gateway },
  }
}
