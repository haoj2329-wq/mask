export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card { suit: Suit; rank: Rank; }
export type Hand = Card[];

export function createDeck(): Card[] {
  const suits: Suit[] = ['spades','hearts','clubs','diamonds'];
  const ranks: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  return suits.flatMap(suit => ranks.map(rank => ({suit, rank})));
}

export function shuffle(deck: Card[]): Card[] {
  deck = deck.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function handValue(hand: Hand): number {
  let total = 0;
  let aces = 0;
  for (let c of hand) {
    if (c.rank === 'A') { total += 11; aces++; }
    else if ('JQK'.includes(c.rank)) total += 10;
    else total += parseInt(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

export function isBust(hand: Hand) { return handValue(hand) > 21; }
export function isBlackjack(hand: Hand) { return hand.length === 2 && handValue(hand) === 21; }

export const cardImgUrl = (card: Card) =>
  `/assets/cards/${card.suit}_${card.rank}.svg`;

export const backImgUrl = '/assets/cards/back.svg';
