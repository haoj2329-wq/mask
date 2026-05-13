import React from 'react';
import { Card, cardImgUrl, backImgUrl } from '../utils/blackjack';

interface HandProps {
  cards: Card[];
  hideFirst?: boolean;
}
const Hand: React.FC<HandProps> = ({cards, hideFirst}) => (
  <div className="cards">
    {cards.map((c, i) =>
      <img className="cardbox"
        style={{zIndex: i}}
        key={i}
        src={hideFirst && i===0 ? backImgUrl : cardImgUrl(c)}
        alt={hideFirst && i===0 ? "hidden card" : `${c.rank} of ${c.suit}`} />
    )}
  </div>
);
export default Hand;
