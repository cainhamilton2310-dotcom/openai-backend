// hello function 
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Store your key securely in Netlify environment variables
});
const openai = new OpenAIApi(configuration);

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed, use POST' }),
      };
    }

    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing prompt in request body' }),
      };
    }

    const response = await openai.createChatCompletion({
      model: 'gpt-4o-mini',  // or your chosen model
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    });

    const aiReply = response.data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: aiReply }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

