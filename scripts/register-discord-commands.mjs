const applicationId = process.env.DISCORD_APPLICATION_ID?.trim()
const botToken = process.env.DISCORD_BOT_TOKEN?.trim()
const guildId = process.env.DISCORD_GUILD_ID?.trim()

if (!applicationId || !botToken) {
  console.error('Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN.')
  process.exit(1)
}

const commands = [
  {
    name: 'verify',
    description: 'Check a suspicious job post with HireProof.',
    options: [
      {
        name: 'job_post',
        description: 'Paste the job post, recruiter message, or apply link to verify.',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'help',
    description: 'Show how to use HireProof in Discord.',
  },
]

const route = guildId
  ? `applications/${applicationId}/guilds/${guildId}/commands`
  : `applications/${applicationId}/commands`
const url = `https://discord.com/api/v10/${route}`

const response = await fetch(url, {
  method: 'PUT',
  headers: {
    Authorization: `Bot ${botToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(commands),
})

const body = await response.text()

if (!response.ok) {
  console.error(`Discord command registration failed: ${response.status} ${response.statusText}`)
  console.error(body)
  process.exit(1)
}

console.log(guildId
  ? `Registered ${commands.length} Discord guild commands for ${guildId}.`
  : `Registered ${commands.length} global Discord commands.`)
