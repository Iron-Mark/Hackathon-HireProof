# Private remote development

Use a dedicated unprivileged account and an isolated task checkout on the
remote host. Read the root `AGENTS.md`, `HANDOFF.md` and
[branch policy](./branch-policy.md) before editing. Feature branches start from
`dev`, and feature pull requests target `dev`.

## Prepare the task checkout

Use Node 24.x and npm with the committed `package-lock.json`. Review dependency
lifecycle scripts before allowing them to execute. A conservative initial
installation is:

```bash
node --version
npm ci --ignore-scripts
```

This does not configure provider keys or deployment credentials. Supply only
development settings required by the task; never copy production dotenv files.

## Keep previews private

From the remote task checkout, explicitly bind Next to loopback:

```bash
npm run dev -- --hostname 127.0.0.1
```

The package script selects port 3002. To open that preview from another device,
configure an SSH local port forward to `127.0.0.1:3002` on the remote host, then
visit the forwarded local port. With an OpenSSH client, use:

```bash
ssh -N -L 3002:127.0.0.1:3002 DEVELOPER_USER@YOUR_HOST
```

Choose a different local port if it is occupied. Run `npm run lint`,
`npm run test:security` and `npm run build` before review, then publish only the
reviewed feature branch. Keep release promotion and deployment separate.
