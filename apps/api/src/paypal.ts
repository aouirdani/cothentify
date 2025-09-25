const base = process.env['PAYPAL_MODE'] === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const id = process.env['PAYPAL_CLIENT_ID'] || '';
  const secret = process.env['PAYPAL_CLIENT_SECRET'] || '';
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('paypal token failed');
  const json = await res.json();
  return json.access_token as string;
}

export async function createOrder(total: string, currency = 'EUR') {
  const access = await getAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: total } }],
    }),
  });
  if (!res.ok) throw new Error('paypal order failed');
  return res.json();
}

export async function captureOrder(id: string) {
  const access = await getAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders/${id}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!res.ok) throw new Error('paypal capture failed');
  return res.json();
}

