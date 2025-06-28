const { google } = require('googleapis');
const sheets = google.sheets('v4');

module.exports = async function (req, res) {
  try {
    console.log('Expense request body:', req.body);
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
    const range = 'Expenses!A:F';

    if (!data || !data.date || !data.category) {
      throw new Error('Invalid request data');
    }

    // Validate date is not in the future
    const today = new Date().toISOString().split('T')[0];
    if (data.date > today) {
      throw new Error('Date cannot be in the future');
    }

    const formattedDate = new Date(data.date).toISOString().split('T')[0];
    const row = [
      new Date().toISOString(),
      formattedDate,
      data.category,
      parseFloat(data.amount) || 0,
      data.details || '',
      data.notes || ''
    ];
    console.log('Row data:', row);

    await sheets.spreadsheets.values.append({
      auth: sheetsClient,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] }
    });
    console.log('Data appended to Expenses tab');

    res.status(200).json({ status: 'success', submitted: data });
  } catch (error) {
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ status: 'error', message: error.message });
  }
};