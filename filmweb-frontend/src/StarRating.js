import React, { useState, useEffect } from 'react';
import './style/StarRating.css';
import './style/Shared.css';
function StarRating({ initialRating = 0, onRatingChange, userRating = null }) {
  const [hover, setHover] = useState(null);
  const [rating, setRating] = useState(initialRating);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);
 
  const handleRating = (value) => {
    setRating(value);
    onRatingChange(value);
  };

  return (
    <div className="star-rating">
      {[...Array(10)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <span
            key={index}
            className={`star ${ratingValue <= (hover || rating) ? 'active' : ''} 
                       ${userRating && ratingValue <= userRating ? 'user-rated' : ''}`}
            onClick={() => handleRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(null)}
          >
            ★
          </span>
        );
      })}
      <span className="rating-value">{hover || rating || initialRating}/10</span>
    </div>
  );
}

export default StarRating;