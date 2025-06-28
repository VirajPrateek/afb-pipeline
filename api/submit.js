const { google } = require('googleapis');
const sheets = google.sheets('v4');

module.exports = async function (req, res) {
  try {
    // Authenticate with service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheetsClient = await auth.getClient();

    // Get data from request
    const data = req.body;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'DailyEntry!A:M';

    // Prepare row data
    const row = [
      new Date().toISOString(),
      data.date || '',
      parseFloat(data.msVolume) || 0,
      parseFloat(data.msAmount) || 0,
      parseFloat(data.hsdVolume) || 0,
      parseFloat(data.hsdAmount) || 0,
      parseFloat(data.lubesAmount) || 0,
      parseFloat(data.cashCollected) || 0,
      parseFloat(data.digitalPayments) || 0,
      parseFloat(data.creditSales) || 0,
      parseFloat(data.creditPayments) || 0,
      parseFloat(data.cashDeposited) || 0,
      data.notes || ''
    ];

    // Append to Sheets
    await sheets.spreadsheets.values.append({
      auth: sheetsClient,
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values: [row] }
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
};