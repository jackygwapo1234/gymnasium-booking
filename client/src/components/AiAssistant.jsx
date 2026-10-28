import { useState } from 'react';
import { askAssistant, getErrorMessage } from '../api/client';
import SlotGrid from './SlotGrid';
import { formatDate } from '../utils/format';

const EXAMPLES = [
  {
    label: 'Example: book',
    text: 'Book Basketball Court A tomorrow 3pm for 2 hours, Juan Dela Cruz 0917 123 4567, 10 people, basketball game',
  },
  {
    label: "Example: what's free?",
    text: 'Ano ang available na oras ng Basketball Court A bukas?',
  },
];

function AiAssistant({ onFill, onPickSlot }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [answer, setAnswer] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    setAnswer(null);
    try {
      const data = await askAssistant(text);
      if (data.type === 'availability') {
        setAnswer(data);
      } else {
        onFill(data.booking);
        setResult(
          data.missing.length === 0
            ? 'Done! Please review the form below, then click Create Booking.'
            : `Form filled. Still needed: ${data.missing.join(', ')}.`
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (availability, slot) => {
    onPickSlot({
      facility: availability.facility._id,
      bookingDate: availability.date,
      startTime: slot.start,
      endTime: slot.end,
    });
    setResult(
      `${availability.facility.name}, ${slot.start}–${slot.end} added to the form. Fill in the customer details to finish.`
    );
  };

  return (
    <form className="ai-card" onSubmit={handleSubmit}>
      <div className="ai-header">
        <span className="ai-icon" aria-hidden="true">
          ✦
        </span>
        <div>
          <h2>AI booking assistant</h2>
          <p>Book in your own words, or ask what's available. English, Filipino or Taglish.</p>
        </div>
      </div>

      <textarea
        rows="3"
        maxLength={1000}
        placeholder="e.g. Book the pool on Saturday 9am to 11am for Maria Santos... or: What's free tomorrow?"
        aria-label="Message to the AI assistant"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {result && <div className="alert alert-success">{result}</div>}

      {answer && (
        <div className="ai-answer">
          <p className="ai-reply">{answer.reply}</p>
          {answer.results.map((availability) => (
            <div key={availability.facility._id} className="ai-result">
              <h3>
                {availability.facility.name} · {formatDate(availability.date)}
              </h3>
              <SlotGrid slots={availability.slots} onPick={(slot) => handlePick(availability, slot)} />
            </div>
          ))}
        </div>
      )}

      <div className="ai-actions">
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => setText(example.text)}
            disabled={loading}
          >
            {example.label}
          </button>
        ))}
        <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
          {loading ? 'Thinking...' : 'Ask AI'}
        </button>
      </div>
    </form>
  );
}

export default AiAssistant;