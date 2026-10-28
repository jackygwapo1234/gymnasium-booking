const LABELS = { free: 'Available', booked: 'Booked', past: 'Past' };

function SlotGrid({ slots, onPick }) {
  return (
    <div className="slot-grid">
      {slots.map((slot) => (
        <button
          key={slot.start}
          type="button"
          className={`slot slot-${slot.status}`}
          disabled={slot.status !== 'free'}
          onClick={() => onPick(slot)}
          aria-label={`${slot.start} to ${slot.end}, ${LABELS[slot.status]}`}
        >
          <span className="slot-time">{slot.start}</span>
          <span className="slot-label">{LABELS[slot.status]}</span>
        </button>
      ))}
    </div>
  );
}

export default SlotGrid;