const { google } = require("googleapis");

function asCredentials(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const email = String(parsed.client_email || "").trim();
  let key = String(parsed.private_key || "");
  key = key.replace(/\\n/g, "\n");
  if (!email || !key.includes("BEGIN")) return null;
  return { client_email: email, private_key: key };
}

function stripWrap(raw) {
  let s = String(raw || "").replace(/^\uFEFF/, "").trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function repairPrivateKeyNewlines(raw) {
  return String(raw || "").replace(
    /("private_key"\s*:\s*")([\s\S]*?)("\s*(,|\}))/,
    (_, prefix, key, suffix) => {
      const escaped = key
        .replace(/\r\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\n/g, "\\n");
      return prefix + escaped + suffix;
    }
  );
}

function extractLooseFields(raw) {
  const email = String(raw || "").match(/"client_email"\s*:\s*"([^"]+)"/);
  const key = String(raw || "").match(/"private_key"\s*:\s*"([\s\S]*?)"\s*(,|\})/);
  if (!email || !key) return null;
  return asCredentials({
    client_email: email[1],
    private_key: key[1]
  });
}

function parseJsonCandidate(raw) {
  const trimmed = stripWrap(raw);
  const candidates = [trimmed, repairPrivateKeyNewlines(trimmed)];
  for (const candidate of candidates) {
    try {
      let parsed = JSON.parse(candidate);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      const creds = asCredentials(parsed);
      if (creds) return creds;
    } catch {
      // try next form
    }
  }
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    let parsed = JSON.parse(decoded);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    const creds = asCredentials(parsed);
    if (creds) return creds;
  } catch {
    // fall through
  }
  return extractLooseFields(trimmed);
}

function parseServiceAccount() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const parsed = parseJsonCandidate(rawJson);
    if (!parsed) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
    return parsed;
  }

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (email && key) {
    return asCredentials({ client_email: email, private_key: key }) || {
      client_email: email,
      private_key: String(key).replace(/\\n/g, "\n")
    };
  }

  throw new Error("Missing Google service-account credentials");
}

function getAuth(scopes) {
  const credentials = parseServiceAccount();
  return new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    scopes || ["https://www.googleapis.com/auth/spreadsheets"]
  );
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const PRODUCTION_SHEET_ID = "1BbbiaPNG-A7B4La53or4Dsv7E46XE6O35JXTQX0HeeU";
const LEGACY_SHEET_IDS = new Set([
  "1tRE1n9oNVyGnxWkepw-MvtRw5X3nhL6wiN9kZxAGeGE"
]);

function getSpreadsheetId() {
  const id = String(process.env.GOOGLE_SHEET_ID || "").trim();
  if (!id || LEGACY_SHEET_IDS.has(id)) return PRODUCTION_SHEET_ID;
  return id;
}

module.exports = {
  parseServiceAccount,
  getAuth,
  getSheetsClient,
  getSpreadsheetId
};
