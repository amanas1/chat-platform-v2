export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rating, message, userId } = req.body;
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;

  if (!accessKey || accessKey === 'YOUR_KEY_HERE') {
    console.error('Missing WEB3FORMS_ACCESS_KEY');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  // Simplified format for Web3Forms
  const formData = {
    access_key: accessKey,
    subject: `⭐ StreamFlow: ${rating}/5 Stars`,
    from_name: 'StreamFlow Feedback System',
    message: `
Rating: ${'⭐'.repeat(rating)} (${rating}/5)

Message:
${message || '(No text message)'}

User Details:
- ID: ${userId || 'Anonymous'}
- Sent at: ${new Date().toLocaleString('ru-RU')}
    `.trim()
  };

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(formData)
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Web3Forms returned non-JSON response:', responseText);
      return res.status(500).json({ 
        success: false, 
        error: 'Service returned unexpected response format' 
      });
    }
    
    if (data.success || response.ok) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Web3Forms Error:', data);
      return res.status(500).json({ success: false, error: data.message || 'API Error' });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
