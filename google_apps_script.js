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
  return ContentService.createTextOutput("Google Sheet integration is ready. Send POST requests with card data.");
}
