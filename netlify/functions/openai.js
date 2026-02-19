// Netlify Serverless Function to proxy OpenAI API calls
// This keeps your API key secure on the server

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Get API key from environment variable (set in Netlify dashboard)
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured' })
        };
    }

    try {
        // Parse the request body
        const requestBody = JSON.parse(event.body);
        
        // Make request to OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // Return the response
        return {
            statusCode: response.ok ? 200 : response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('OpenAI proxy error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to connect to OpenAI', details: error.message })
        };
    }
};
