const { google } = require('googleapis');
const sheets = google.sheets('v4');

module.exports = async function (req, res) {
  try {
    const data = req.body;
    console.log('Expense request:', { date: data.date, category: data.category });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheetsClient = await auth.getClient();

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'Expenses!A:F';

    if (!data || !data.date || !data.category) {
      throw new Error('Missing required fields: date or category');
    }

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }

    const today = new Date().toISOString().split('T')[0];
    if (data.date > today) {
      throw new Error('Date cannot be in the future');
    }

    const formattedDate = new Date(data.date).toISOString().split('T')[0];
    const row = [
      new Date().toISOString(),
      formattedDate,
      data.category,
      amount,
      data.details || '',
      data.notes || ''
    ];

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
    console.error('Expense error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
};