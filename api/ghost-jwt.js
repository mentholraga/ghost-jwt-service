const crypto = require('crypto');

export default function handler(req, res) {
  // Set CORS headers to allow Apps Script to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    // Generate JWT exactly like your working n8n code
    const [id, secret] = apiKey.split(':');

    // Helper function for base64url encoding
    function base64urlEncode(str) {
      return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }

    // Create JWT header
    const header = {
      alg: 'HS256',
      typ: 'JWT', 
      kid: id
    };

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now,
      exp: now + 300, // 5 minutes
      aud: '/admin/'
    };

    // Encode header and payload
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    // Create signature (exactly like your n8n code)
    const signature = crypto
      .createHmac('sha256', Buffer.from(secret, 'hex'))
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${data}.${signature}`;

    // Return the JWT
    res.status(200).json({ 
      jwt: jwt,
      expires_at: now + 300
    });

  } catch (error) {
    console.error('JWT generation error:', error);
    res.status(500).json({ error: 'Failed to generate JWT' });
  }
}
