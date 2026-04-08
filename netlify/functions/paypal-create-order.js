const fetch = require("node-fetch");

exports.handler = async (event) => {
  const { tourId, people } = JSON.parse(event.body);

  const tours = {
  "gobi-highlights-5d": { 1: 1180, 2: 820, 3: 720, 4: 650 },
  "gobi-classic-7d": { 1: 1450, 2: 990, 3: 860, 4: 780 },
  "deep-gobi-10d": { 1: 2280, 2: 1580, 3: 1410, 4: 1320 },
  "gobi-central-7d": { 1: 1520, 2: 1020, 3: 890, 4: 810 },
  "central-classic-5d": { 1: 1080, 2: 760, 3: 680, 4: 620 },
  "orkhon-valley-5d": { 1: 1120, 2: 790, 3: 710, 4: 650 },
  "kharkhorum-3d": { 1: 680, 2: 490, 3: 430, 4: 390 },
  "amar-aglag-4d": { 1: 860, 2: 620, 3: 560, 4: 510 },
  "khangai-adventure-7d": { 1: 1490, 2: 1020, 3: 900, 4: 830 },
  "tsenkher-khorgo-5d": { 1: 990, 2: 710, 3: 640, 4: 590 },
  "horse-steppe-3d": { 1: 520, 2: 390, 3: 350, 4: 320 },
  "horse-nomad-5d": { 1: 880, 2: 640, 3: 580, 4: 530 },
  "mountain-horse-7d": { 1: 1380, 2: 980, 3: 870, 4: 820 },
  "khuvsgul-lake-5d": { 1: 1280, 2: 930, 3: 840, 4: 780 },
  "khuvsgul-north-7d": { 1: 1680, 2: 1190, 3: 1080, 4: 990 },
  "taiga-reindeer-7d": { 1: 1980, 2: 1450, 3: 1320, 4: 1240 },
  "altai-tavan-bogd-7d": { 1: 1890, 2: 1360, 3: 1240, 4: 1160 },
  "western-ultimates-9d": { 1: 2390, 2: 1690, 3: 1540, 4: 1460 },
  "vip-grand-5d": { 1: 3200, 2: 2100, 3: 1850, 4: 1700 }
};

  const p = Number(people);
  const perPerson = tours[tourId][p] || tours[tourId][4];
  const total = perPerson * p;
  const deposit = Math.round(total * 0.2);

  const auth = Buffer.from(
    process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET
  ).toString("base64");

  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: deposit.toString()
          }
        }
      ]
    })
  });

  const data = await orderRes.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
