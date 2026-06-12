const https = require('https');

const TYPE_GUIDES = {
  delivery:     "A delivery was delayed. Acknowledge the wait, confirm what happened, state the resolution, show personal accountability.",
  refund:       "Customer requested or is waiting for a refund. Confirm the status with specifics — amount, date processed, timeline to reflect.",
  hygiene:      "Customer complained about toy hygiene or missing/broken parts. This is sensitive — our 12-step hygiene process is a core brand promise. Acknowledge seriously, take full responsibility.",
  app:          "Customer faced an app bug — ordering blocked, wrong delivery status, cancel button missing. Technical empathy. Confirm fix timeline or offer manual workaround.",
  availability: "Large toy or specific toy was on pre-order or unavailable. Acknowledge honestly, do not overpromise a date, offer concrete alternatives.",
  harsh:        "Comment uses words like scam, fraud, fake, going legal, consumer forum. CRITICAL: Do NOT be defensive. Do NOT argue facts publicly. Be disarmingly calm and caring. Move to DM immediately. Other prospective parents are reading this reply.",
  positive:     "Customer left a warm positive comment. Reply with genuine celebration. Reference their child, joy of play, and theEleFant's mission around development.",
  '1star':      "1-star Play Store review — visible to all prospective app downloaders. Stay calm, professional, acknowledge, confirm action, invite direct contact.",
  cancellation: "Customer wants to cancel. Acknowledge gracefully. Confirm the process. Do not beg them to stay — end on warmth so they may return.",
  escalation:   "Customer threatened legal action or consumer forum. Stay extremely calm. No defensiveness. Acknowledge, take responsibility, provide direct senior contact immediately.",
  general:      "A general query. Answer helpfully and warmly.",
  followup:     "Follow-up checking status on an existing complaint. Update them specifically on where things stand.",
  resolution:   "Confirming an issue has been fully resolved. Be specific about what was done. Close with genuine warmth.",
  'review-request': "Asking a happy subscriber to leave an honest review. Personal, no pressure, genuine.",
  proactive:    "Proactively reaching out before the customer posts publicly. Lead with full accountability.",
};

const CHANNEL_CONTEXT = {
  instagram: "PUBLIC Instagram comment reply visible to all followers and prospective customers. Under 120 words. Maximum 2 emojis. No hashtags.",
  facebook:  "PUBLIC Facebook comment reply. Up to 150 words. Warm and human.",
  playstore: "PUBLIC Play Store developer response visible to every person reading the app listing. Professional and reassuring. Under 180 words. No emojis.",
  email:     "PRIVATE email response. Can be detailed and formal. FIRST LINE must be 'SUBJECT: [subject line]'. Then a blank line. Then the full email with proper greeting and sign off as 'Customer Care Team, theEleFant'.",
  whatsapp:  "PRIVATE WhatsApp message. Short, warm, conversational. Line breaks natural. Under 100 words ideally.",
};

function buildPrompt(ch, type, tone, inputs) {
  const extra = [
    inputs.name  ? `Customer name: ${inputs.name}`  : '',
    inputs.city  ? `Customer city: ${inputs.city}`  : '',
    inputs.child ? `Child's name: ${inputs.child}`  : '',
  ].filter(Boolean).join('\n');

  return `You are the customer care team for theEleFant (@theelefant_official), India's largest toy subscription library. Write responses that are warm, human, on-brand, and appropriate for the channel.

Brand voice: Warm, expert, developmental-focused, never corporate, never defensive. We own our mistakes fully.

CHANNEL: ${(ch||'').toUpperCase()}
CHANNEL RULES: ${CHANNEL_CONTEXT[ch] || ''}

COMPLAINT TYPE: ${type || ''}
TYPE GUIDANCE: ${TYPE_GUIDES[type] || type || ''}

TONE: ${tone || 'Warm & Professional'}
${extra ? `\nADDITIONAL CONTEXT:\n${extra}` : ''}

ORIGINAL MESSAGE:
"${inputs.complaint || 'No complaint text provided.'}"

RESOLUTION / CURRENT STATUS:
"${inputs.resolution || 'No specific resolution provided — acknowledge and invite direct contact.'}"

RULES:
- For social media: start with customer first name if it is a real name; skip if it is a handle.
- Never say "we understand your frustration" — cliche that rings hollow.
- Never argue facts publicly on social media.
- For resolved issues: confirm specifics of what was done using the resolution details.
- For unresolved: acknowledge, give specific next step and timeframe, invite to DM.
- For harsh/legal: stay calm, move to DM, do not argue.
- End genuinely — not "have a great day".
- For email: first line MUST be "SUBJECT: [subject line]" then blank line then full email body.
- Write the response ONLY. No explanation, no preamble, no "here is your reply".`;
}

function callAnthropic(prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(parsed.error?.message || `API error ${res.statusCode}`));
          } else {
            resolve(parsed.content?.[0]?.text || '');
          }
        } catch (e) {
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server.' });

  const { channel, type, tone, complaint, resolution, name, city, child } = req.body || {};

  if (!complaint && !resolution) {
    return res.status(400).json({ error: 'Provide at least a complaint or resolution.' });
  }

  try {
    const prompt = buildPrompt(channel, type, tone, { complaint, resolution, name, city, child });
    const text = await callAnthropic(prompt, apiKey);
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
