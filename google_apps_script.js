// Google Apps Script for FotosCavet Card Management
// Handles user authentication and card data storage

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Save card data
    const result = saveCard({
      cardId: data.id || data.cardId,
      photoId: data.photoId,
      cardName: data.cardName || "",
      fotoAuthor: data.fotoAuthor || "",
      commonName: data.commonName,
      scientificName: data.scientificName,
      comment: data.comment,
      cardAuthor: data.cardAuthor
    });

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

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

  if (action === 'getCards') {
    return getAllCards();
  }

  if (action === 'getCard') {
    return getCard(e.parameter.cardId);
  }

  if (action === 'setupCardsSheet') {
    return setupCardsSheet();
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

// ==================== CARDS MANAGEMENT ====================

// Setup Cards sheet with proper headers
function setupCardsSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Cards");

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet("Cards");
    }

    // Set up headers
    const headers = [
      "Card ID",
      "Photo ID",
      "Card Name",
      "Foto Author",
      "Common Name",
      "Scientific Name",
      "Comment",
      "Card Author",
      "Last Modified"
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#667eea");
    headerRange.setFontColor("#ffffff");

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Cards sheet created successfully",
      headers: headers
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Save card data
function saveCard(cardData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards");

    if (!sheet) {
      return {
        status: "error",
        message: "Cards sheet not found. Please run setupCardsSheet first."
      };
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Search for existing card
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === cardData.cardId) {
        rowIndex = i + 1;
        break;
      }
    }

    // If not found, create new row
    if (rowIndex === -1) {
      rowIndex = data.length + 1;
    }

    // Write data to sheet
    sheet.getRange(rowIndex, 1, 1, 9).setValues([[
      cardData.cardId || "",
      cardData.photoId || "",
      cardData.cardName || "",
      cardData.fotoAuthor || "",
      cardData.commonName || "",
      cardData.scientificName || "",
      cardData.comment || "",
      cardData.cardAuthor || "",
      new Date().toISOString()
    ]]);

    return {
      status: "success",
      message: "Card saved successfully",
      cardId: cardData.cardId,
      rowIndex: rowIndex
    };

  } catch (error) {
    return {
      status: "error",
      message: error.toString()
    };
  }
}

// Get all cards
function getAllCards() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards");

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Cards sheet not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const cards = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      cards.push({
        cardId: data[i][0],
        photoId: data[i][1],
        cardName: data[i][2],
        fotoAuthor: data[i][3],
        commonName: data[i][4],
        scientificName: data[i][5],
        comment: data[i][6],
        cardAuthor: data[i][7],
        lastModified: data[i][8]
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      cards: cards,
      count: cards.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Get specific card
function getCard(cardId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards");

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Cards sheet not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();

    // Search for card
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === cardId) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          card: {
            cardId: data[i][0],
            photoId: data[i][1],
            cardName: data[i][2],
            fotoAuthor: data[i][3],
            commonName: data[i][4],
            scientificName: data[i][5],
            comment: data[i][6],
            cardAuthor: data[i][7],
            lastModified: data[i][8]
          }
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Card not found"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
