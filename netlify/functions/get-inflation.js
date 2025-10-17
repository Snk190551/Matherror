// File: netlify/functions/get-inflation.js

export const handler = async (event, context) => {
  const BOT_API_KEY = process.env.BOT_API_KEY;

  const apiUrl = 'https://api.bot.or.th/v2/financial-markets/headline-inflation';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Client-Id': BOT_API_KEY,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { statusCode: response.status, body: response.statusText };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch data' }) };
  }
};