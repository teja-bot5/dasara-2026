require("dotenv").config();

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const credentialsPath = path.join(
  __dirname,
  "config",
  "google-service-account.json"
);

let auth;

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {

  const credentials =
    JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    );

  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets"
    ]
  });

} else if (fs.existsSync(credentialsPath)) {

  auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets"
    ]
  });

} else {

  throw new Error(
    "Google service account credentials not configured"
  );

}


const sheets = google.sheets({
  version: "v4",
  auth
});


const spreadsheetId =
  process.env.GOOGLE_SHEET_ID;


async function appendRow(sheetName, values) {

  if(!spreadsheetId){

    throw new Error(
      "GOOGLE_SHEET_ID is not configured"
    );

  }

  await sheets.spreadsheets.values.append({

    spreadsheetId,

    range: `${sheetName}!A:Z`,

    valueInputOption: "USER_ENTERED",

    insertDataOption: "INSERT_ROWS",

    requestBody: {
      values: [values]
    }

  });

}


module.exports = {
  appendRow
};