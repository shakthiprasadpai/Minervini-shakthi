import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

process.env.FIVEPAISA_TOKEN_FILE = path.join(os.tmpdir(), `5p-token-${process.pid}.json`);
process.env.FIVEPAISA_APP_KEY = 'APPKEY';
process.env.FIVEPAISA_ENCRYPTION_KEY = 'ENCKEY';
process.env.FIVEPAISA_USER_ID = 'USERID';

test('token request uses the field names from the 5paisa docs', async () => {
  const { FivePaisaAuthService } = await import('./fivePaisaAuthService');
  const real = globalThis.fetch;
  let sent: any;
  globalThis.fetch = (async (url: string, init: any) => {
    sent = { url, init, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ body: { AccessToken: 'TOK', ClientCode: '12345' } }), { status: 200 });
  }) as any;
  try {
    const svc = new FivePaisaAuthService();
    const state = await svc.exchangeRequestToken('REQTOKEN');
    assert.match(sent.url, /VendorsAPI\/Service1\.svc\/GetAccessToken$/);
    assert.deepEqual(sent.body, { head: { Key: 'APPKEY' }, body: { RequestToken: 'REQTOKEN', EncryKey: 'ENCKEY', UserId: 'USERID' } });
    assert.equal(state.accessToken, 'TOK');
    assert.equal(svc.getAccessToken(), 'TOK');
  } finally { globalThis.fetch = real; }
});

test('a rejection from 5paisa surfaces its message with a hint', async () => {
  const { FivePaisaAuthService } = await import('./fivePaisaAuthService');
  const real = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ body: { Message: 'Invalid Input Parameters' } }), { status: 200 })) as any;
  try {
    await assert.rejects(new FivePaisaAuthService().exchangeRequestToken('X'), /Invalid Input Parameters.*FIVEPAISA_ENCRYPTION_KEY/);
  } finally { globalThis.fetch = real; }
});
