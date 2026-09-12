const { google } = require("googleapis");

function parseServiceAccount() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const trimmed = rawJson.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      try {
        return JSON.parse(Buffer.from(trimmed, "base64").toString("utf8"));
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
    "1tRE1n9oNVyGnxWkepw-MvtRw5X3nhL6wiN9kZxAGeGE"
  );
}

module.exports = {
  getAuth,
  getSheetsClient,
  getSpreadsheetId
};
