const { google } = require('googleapis');
const sheets = google.sheets('v4');

module.exports = async function (req, res) {
  try {
    console.log('Request body:', req.body);
    console.log('Environment variables:', {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      spreadsheet_id: process.env.SPREADSHEET_ID,
      private_key_exists: !!process.env.GOOGLE_PRIVATE_KEY
    });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheetsClient = await auth.getClient();
    console.log('Auth client created');

    const data = req.body;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'DataEntry!A:M';

    if (!data || !data.date) {
      throw new Error('Invalid request data');
    }

    // Format date as YYYY-MM-DD without quotes
    const formattedDate = new Date(data.date).toISOString().split('T')[0];

    const row = [
      new Date().toISOString(), // Timestamp
      formattedDate, // Date as YYYY-MM-DD
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
    console.log('Row data:', row);

    await sheets.spreadsheets.values.append({
      auth: sheetsClient,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED', // Ensures Sheets interprets date correctly
      resource: { values: [row] }
    });
    console.log('Data appended to Sheets');

    res.status(200).json({ status: 'success', submitted: data });
  } catch (error) {
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ status: 'error', message: error.message });
  }
};