const { google } = require("googleapis");

function parseServiceAccount() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const trimmed = String(rawJson).replace(/^\uFEFF/, "").trim();
    try {
      let parsed = JSON.parse(trimmed);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (!parsed || typeof parsed !== "object" || !parsed.client_email || !parsed.private_key) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email/private_key");
      }
      return parsed;
    } catch (err) {
      if (String(err.message || "").includes("client_email/private_key")) throw err;
      try {
        const parsed = JSON.parse(Buffer.from(trimmed, "base64").toString("utf8"));
        if (!parsed || typeof parsed !== "object" || !parsed.client_email || !parsed.private_key) {
          throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email/private_key");
        }
        return parsed;
      } catch {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
      }
    }
  }

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (email && key) {
    key = key.replace(/\\n/g, "\n");
    return { client_email: email, private_key: key };
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

function getSpreadsheetId() {
  return (
    process.env.GOOGLE_SHEET_ID ||
    "1BbbiaPNG-A7B4La53or4Dsv7E46XE6O35JXTQX0HeeU"
  );
}

module.exports = {
  getAuth,
  getSheetsClient,
  getSpreadsheetId
};
