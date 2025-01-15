import React, { useState, useEffect } from 'react';
import './style/StarRating.css';
import './style/Shared.css';
function StarRating({ initialRating = 0, onRatingChange, userRating = null }) {
  // przechowuje stan hover, który odpowiada za dynamiczne podświetlanie gwiazdek.
  const [hover, setHover] = useState(null);
    // aktualnie wybrana ocena
  const [rating, setRating] = useState(initialRating);
  // Kiedy `initialRating` się zmienia (np. przy edycji lub ładowaniu danych z serwera),
  // aktualizuje stan `rating`, aby był zgodny z nowym `initialRating`.
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);
 
  const handleRating = (value) => {
    setRating(value);
    onRatingChange(value); // informuje o zmianie oceny
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