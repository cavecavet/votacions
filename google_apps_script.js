// Google Apps Script to receive card data from forms
// Paste this into your Google Sheet's Apps Script editor

const SHEET_NAME = "Responses"; // Change if your sheet has a different name

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Find or create row for this card ID
    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    // Search for existing row with same ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) {
        rowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }
    
    // If not found, create new row
    if (rowIndex === -1) {
      rowIndex = values.length + 1;
    }
    
    // Write data to sheet
    sheet.getRange(rowIndex, 1, 1, 8).setValues([[
      data.id,
      data.photoId || "",
      data.imageAuthor || "",
      data.cardAuthor || "",
      data.commonName || "",
      data.scientificName || "",
      data.comment || "",
      new Date().toISOString()
    ]]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data saved to Google Sheet",
      rowIndex: rowIndex
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'login') {
    return authenticateUser(e.parameter.username, e.parameter.password);
  }

  if (action === 'testUsers') {
    return testUsersSheet();
  }

  return ContentService.createTextOutput("Google Sheet integration is ready. Send POST requests with card data.");
}

function testUsersSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Users sheet not found. Please create a sheet named 'Users'."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const userCount = data.length - 1; // Exclude header row

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Users sheet found!",
      sheetName: sheet.getName(),
      headers: headers,
      userCount: userCount,
      sampleUsers: data.slice(1, 4).map(row => row[1]) // Show first 3 usernames (column B)
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function authenticateUser(username, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");

  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Users sheet not found"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  // Columns: name, username, password, displayName, commonName, scientificName, comment, cardAuthor

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username && data[i][2] === password) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        user: {
          name: data[i][0] || "",
          username: data[i][1],
          displayName: data[i][3] || data[i][0] || username,
          commonName: data[i][4] || "",
          scientificName: data[i][5] || "",
          comment: data[i][6] || "",
          cardAuthor: data[i][7] || data[i][0] || username
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: "Invalid credentials"
  })).setMimeType(ContentService.MimeType.JSON);
}
