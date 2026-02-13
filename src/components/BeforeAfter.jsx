import React, { useState } from 'react';

export default function BeforeAfter({ before, after, alt = 'Before and after repair' }) {
  const [showBefore, setShowBefore] = useState(true);

  return (
    <div className="before-after-container">
      <button
        className="before-after-toggle"
        onClick={() => setShowBefore(!showBefore)}
        aria-label={`Show ${showBefore ? 'after' : 'before'}`}
      >
        {showBefore ? 'Show After' : 'Show Before'}
      </button>
      <img
        src={showBefore ? before : after}
        alt={alt}
        className="before-after-image"
      />
    </div>
  );
}
