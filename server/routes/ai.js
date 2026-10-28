const express = require('express');
const Facility = require('../models/Facility');
const { getAvailability, nowInManila, toMinutes, toTime } = require('../utils/availability');

const router = express.Router();

// Which AI to use: "ollama" (your laptop) or "gemini" (online)
const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama').toLowerCase();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const MODEL_NAME = AI_PROVIDER === 'gemini' ? GEMINI_MODEL : OLLAMA_MODEL;

const PURPOSES = ['Training', 'Game', 'Event', 'Class', 'Other'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const REQUIRED_FIELDS = {
  customerName: 'customer name',
  contactNumber: 'contact number',
  facility: 'facility',
  bookingDate: 'date',
  startTime: 'start time',
  endTime: 'end time',
  numberOfPeople: 'number of people',
};

// A 14-day calendar, so the AI looks dates up instead of calculating them
const buildCalendar = (today) => {
  const lines = [];
  const start = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i < 14; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    const weekday = day.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    let label = '';
    if (i === 0) label = ' (today / ngayon)';
    if (i === 1) label = ' (tomorrow / bukas)';
    lines.push(`${date} ${weekday}${label}`);
  }
  return lines.join('\n');
};

// The exact JSON shape the AI must reply with
const buildSchema = (facilityNames) => ({
  type: 'object',
  properties: {
    intent: { type: 'string', enum: ['book', 'availability'] },
    customerName: { type: 'string' },
    contactNumber: { type: 'string' },
    email: { type: 'string' },
    facilityName: { type: 'string', enum: [...facilityNames, ''] },
    bookingDate: { type: 'string' },
    startTime: { type: 'string' },
    endTime: { type: 'string' },
    durationHours: { type: 'number' },
    numberOfPeople: { type: 'integer' },
    purpose: { type: 'string', enum: [...PURPOSES, ''] },
    notes: { type: 'string' },
  },
  required: [
    'intent',
    'customerName',
    'contactNumber',
    'email',
    'facilityName',
    'bookingDate',
    'startTime',
    'endTime',
    'durationHours',
    'numberOfPeople',
    'purpose',
    'notes',
  ],
});

// The instructions the AI reads before the user's message
const buildPrompt = (facilities, today) => `You are the assistant of a gymnasium booking system in the Philippines.
Read the user's message and reply ONLY with JSON in the required format.
Messages may be in English, Filipino or Taglish.

Decide the intent:
- "availability": the user asks what is free, open or available (for example "what's free tomorrow?" or "available ba ang pool sa Sabado?").
- "book": the user wants to make a booking or gives booking details.

Calendar (use it to turn words like today, tomorrow, bukas, Saturday or Sabado into a date):
${buildCalendar(today)}
A weekday name means the first date with that weekday in the calendar.
Filipino weekdays: Lunes=Monday, Martes=Tuesday, Miyerkules=Wednesday, Huwebes=Thursday, Biyernes=Friday, Sabado=Saturday, Linggo=Sunday.

Facilities (copy facilityName exactly from this list, or "" if none is mentioned):
${facilities.map((f) => `- ${f.name} (${f.type}, up to ${f.capacity} people)`).join('\n')}

Fields:
- customerName, contactNumber, email: the customer's details, or "".
- bookingDate: YYYY-MM-DD taken from the calendar, or "".
- startTime, endTime: 24-hour HH:mm. For example 3pm = "15:00" and 9:30am = "09:30". Use "" if not given.
- durationHours: if the user gives a length like "2 hours", put 2. Otherwise 0.
- numberOfPeople: a whole number, or 0 if not mentioned.
- purpose: one of ${PURPOSES.join(', ')}, or "".
- notes: other useful details, or "".

Never invent information. If something is not in the message, use "" or 0.`;

// Throws an error that remembers the HTTP status
const failWithStatus = async (response) => {
  const error = new Error(await response.text());
  error.status = response.status;
  throw error;
};

// ----- Ollama: runs on your laptop -----
const askOllama = async (systemPrompt, userText, schema) => {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      format: schema,
      stream: false,
      keep_alive: '30m',
      options: { temperature: 0, num_ctx: 4096, num_predict: 400 },
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) await failWithStatus(response);

  const data = await response.json();
  return JSON.parse(data.message.content);
};

// ----- Gemini: runs online, for the deployed site -----
const askGemini = async (systemPrompt, userText, schema) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is missing');
    error.code = 'NO_KEY';
    throw error;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
        },
      }),
      signal: AbortSignal.timeout(60000),
    }
  );
  if (!response.ok) await failWithStatus(response);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new SyntaxError('The AI sent an empty reply');
  return JSON.parse(text);
};

// Uses whichever AI is chosen in AI_PROVIDER
const askAI = (systemPrompt, userText, schema) =>
  AI_PROVIDER === 'gemini'
    ? askGemini(systemPrompt, userText, schema)
    : askOllama(systemPrompt, userText, schema);

// "0917 123 4567", "+63 917 123 4567" or "9171234567" → "09171234567"
const cleanContactNumber = (value) => {
  if (!value) return '';
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`;
  return digits;
};

// "2026-10-31" → "Sat, Oct 31"
const formatShortDate = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

// Turns AI problems into clear messages
const sendAiError = (res, err) => {
  console.error('AI error:', err.message);

  if (err.code === 'NO_KEY') {
    return res.status(500).json({ message: 'The AI is not set up. Add GEMINI_API_KEY to the settings.' });
  }
  if (err.name === 'TimeoutError') {
    return res.status(504).json({ message: 'The AI took too long to answer. Please try again.' });
  }
  if (err.cause?.code === 'ECONNREFUSED' || err.message === 'fetch failed') {
    return res.status(503).json({
      message:
        AI_PROVIDER === 'ollama'
          ? 'Cannot reach Ollama. Make sure the Ollama app is running on this computer.'
          : 'Cannot reach the AI service. Please try again.',
    });
  }
  if (err.status === 429) {
    return res.status(429).json({ message: 'The AI has reached its free usage limit. Please try again later.' });
  }
  if (err.status === 404) {
    return res.status(500).json({
      message:
        AI_PROVIDER === 'ollama'
          ? `The AI model "${OLLAMA_MODEL}" is not downloaded. Run: ollama pull ${OLLAMA_MODEL}`
          : `The AI model "${GEMINI_MODEL}" was not found. Check GEMINI_MODEL in the settings.`,
    });
  }
  if (err.status === 400 || err.status === 403) {
    return res.status(500).json({ message: 'The AI rejected the request. Check the API key and model name.' });
  }
  if (err instanceof SyntaxError) {
    return res.status(502).json({ message: 'The AI gave an answer we could not read. Please try again.' });
  }
  res.status(502).json({ message: 'The AI could not handle that request. Please try again.' });
};

// POST /api/ai/assistant   body: { "text": "..." }
router.post('/assistant', async (req, res) => {
  const text = String(req.body.text || '').trim();

  if (!text) {
    return res.status(400).json({ message: 'Please type a request or a question first.' });
  }
  if (text.length > 1000) {
    return res.status(400).json({ message: 'Please keep your message under 1000 characters.' });
  }

  try {
    const facilities = await Facility.find({ isAvailable: true }).sort({ name: 1 });
    if (facilities.length === 0) {
      return res.status(400).json({ message: 'There are no available facilities to book yet.' });
    }

    const today = nowInManila().date;
    const extracted = await askAI(
      buildPrompt(facilities, today),
      text,
      buildSchema(facilities.map((f) => f.name))
    );

    const facility = facilities.find((f) => f.name === extracted.facilityName);
    const bookingDate = DATE_PATTERN.test(extracted.bookingDate || '') ? extracted.bookingDate : '';

    // ----- Availability question: the AI understood it, our code finds the answer -----
    if (extracted.intent === 'availability') {
      const date = bookingDate || today;
      const targets = facility ? [facility] : facilities;
      const results = await Promise.all(targets.map((f) => getAvailability(f, date)));

      const lines = results.map((result) => {
        const free = result.freeRanges.map((range) => `${range.start}–${range.end}`).join(', ');
        return `${result.facility.name}: ${free || 'fully booked'}`;
      });

      return res.json({
        type: 'availability',
        reply: `Available on ${formatShortDate(date)}:\n${lines.join('\n')}`,
        results,
      });
    }

    // ----- Booking request: check and clean every field -----
    const startTime = TIME_PATTERN.test(extracted.startTime || '') ? extracted.startTime : '';
    let endTime = TIME_PATTERN.test(extracted.endTime || '') ? extracted.endTime : '';

    // "for 2 hours": our code does the math, not the AI
    if (!endTime && startTime && extracted.durationHours > 0) {
      const end = toMinutes(startTime) + Math.round(extracted.durationHours * 60);
      if (end < 24 * 60) endTime = toTime(end);
    }

    const booking = {
      customerName: extracted.customerName?.trim() || '',
      contactNumber: cleanContactNumber(extracted.contactNumber),
      email: extracted.email?.trim() || '',
      facility: facility ? String(facility._id) : '',
      bookingDate,
      startTime,
      endTime,
      numberOfPeople:
        Number.isInteger(extracted.numberOfPeople) && extracted.numberOfPeople > 0
          ? extracted.numberOfPeople
          : '',
      purpose: PURPOSES.includes(extracted.purpose) ? extracted.purpose : '',
      notes: extracted.notes?.trim() || '',
    };

    const missing = Object.keys(REQUIRED_FIELDS)
      .filter((key) => !booking[key])
      .map((key) => REQUIRED_FIELDS[key]);

    res.json({ type: 'booking', booking, missing });
  } catch (err) {
    sendAiError(res, err);
  }
});

// On your laptop only: load the Ollama model when the server starts
if (AI_PROVIDER === 'ollama') {
  fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages: [], keep_alive: '30m' }),
  })
    .then((response) => {
      if (response.ok) {
        console.log(`AI model ${MODEL_NAME} is loaded and ready`);
      } else {
        console.log(
          `Ollama is running, but the model "${OLLAMA_MODEL}" is not downloaded. Run: ollama pull ${OLLAMA_MODEL}`
        );
      }
    })
    .catch(() => console.log('Ollama is not running, so the AI assistant is off for now'));
}

module.exports = router;