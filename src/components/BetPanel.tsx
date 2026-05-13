import React from 'react';
const chips = [10, 50, 100, 500];
interface BetPanelProps {
  chipsLeft: number;
  currentBet: number;
  onBet: (amount: number) => void;
}
const BetPanel: React.FC<BetPanelProps> = ({chipsLeft, currentBet, onBet}) => (
  <div>
    <div className="chip-row">
      {chips.map(c =>
        <button className="bet-btn"
          disabled={chipsLeft<c}
          key={c}
          onClick={()=>onBet(c)}>
          ${c}
        </button>
      )}
      <span style={{marginLeft:24,color:'#FFD700'}}>当前下注: <b>${currentBet}</b></span>
    </div>
  </div>
);
export default BetPanel;
