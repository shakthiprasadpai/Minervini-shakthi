const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Page 5paisa redirects back to after sign-in. When it was opened as a popup by the dashboard it tells
 * the opener the result and closes itself; opened on its own it shows the result with a link back.
 * `message` is escaped, because error text can come from a remote API.
 */
export function renderAuthResultPage(ok: boolean, message: string): string {
  const title = ok ? 'Signed in to 5paisa' : 'Sign-in did not finish';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d11;color:#e8ecf2;font:16px/1.5 system-ui,sans-serif}
  main{max-width:26rem;padding:2rem;text-align:left}
  h1{margin:0 0 .5rem;font-size:1.25rem;color:${ok ? '#34d399' : '#fb7185'}}
  p{margin:0 0 1.25rem;color:#aab3c2}
  a{color:#fbbf24}
</style>
</head>
<body>
<main>
  <h1>${title}</h1>
  <p>${escapeHtml(message)}</p>
  <a href="/">Back to the dashboard</a>
</main>
<script>
(function () {
  try {
    if (window.opener) window.opener.postMessage({ type: 'fivepaisa-auth', ok: ${ok ? 'true' : 'false'} }, window.location.origin);
  } catch (e) {}
  if (${ok ? 'true' : 'false'} && window.opener) setTimeout(function () { window.close(); }, 1200);
})();
</script>
</body>
</html>`;
}
