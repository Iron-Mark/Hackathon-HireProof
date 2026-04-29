export async function GET(request: Request) {
  const url = new URL(request.url)
  const domain = JSON.stringify(url.searchParams.get('domain') || '')
  const token = JSON.stringify(url.searchParams.get('token') || '')

  const script = `
(async function(){
  const domain = ${domain};
  const token = ${token};
  const script = document.currentScript;
  const mount = script && script.parentElement;
  if (!mount || !domain || !token) return;
  const base = new URL(script.src).origin;
  const badge = document.createElement('iframe');
  badge.title = 'HireProof verification badge';
  badge.width = '200';
  badge.height = '60';
  badge.loading = 'lazy';
  badge.referrerPolicy = 'no-referrer';
  badge.style.border = '0';
  badge.src = base + '/api/verified-badge?domain=' + encodeURIComponent(domain) + '&token=' + encodeURIComponent(token);
  mount.appendChild(badge);
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
