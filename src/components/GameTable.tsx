import React, { useState, useRef } from 'react';
import { createDeck, shuffle, handValue, isBust, isBlackjack, Card, Hand } from '../utils/blackjack';
import HandComp from './Hand';
import BetPanel from './BetPanel';
import { Howl } from 'howler';
import '../styles/table.css';

// 声音文件
const S_BGM = './assets/music/bgm.mp3';
const S_DEAL = './assets/music/card.mp3';
const S_WIN  = './assets/music/win.mp3';
const S_LOSE = './assets/music/lose.mp3';

function sleep(ms:number) { return new Promise(resolve=>setTimeout(resolve,ms)); }

const initialChips = 1000;

const GameTable: React.FC = () => {
  const [chips, setChips] = useState(initialChips);
  const [bet, setBet] = useState(0);
  const [stage, setStage] = useState<'bet'|'deal'|'player'|'dealer'|'settle'>('bet');
  const [deck, setDeck] = useState<Card[]>(shuffle(createDeck()));
  const [player, setPlayer] = useState<Hand>([]);
  const [dealer, setDealer] = useState<Hand>([]);
  const [hideDealer, setHideDealer] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [music, setMusic] = useState(true);
  const bgmRef = useRef<Howl>();

  React.useEffect(() => {
    if (!bgmRef.current) {
      bgmRef.current = new Howl({src:[S_BGM], loop:true, volume:0.27});
    }
    if(music) bgmRef.current.play();
    else bgmRef.current.stop();
    return () => { bgmRef.current?.stop(); }
  }, [music]);

  function playSound(f:string) {
    if (music)
      new Howl({src:[f], volume:0.8}).play();
  }

  const onBet = (amt: number) => {
    if (chips >= amt) {
      setBet(bet+amt); setChips(chips-amt);
    }
  };
  const deal = async () => {
    if (bet===0) { setMessage("请下注后再开始"); return; }
    setMessage(""); playSound(S_DEAL);
    let d = deck.length<10?shuffle(createDeck()):[...deck];
    let playerHand = [d.shift()!, d.shift()!], dealerHand = [d.shift()!, d.shift()!];
    setDeck(d); setPlayer(playerHand); setDealer(dealerHand); setHideDealer(true); setStage('player');
    await sleep(650);
    if(isBlackjack(playerHand)) {
      setHideDealer(false);
      if(isBlackjack(dealerHand)) {
        setStage('settle'); setMessage('平局！都是Blackjack！'); setTimeout(() => resetBet(chips+bet), 2200);
      } else {
        setStage('settle'); setMessage('玩家Blackjack！赢啦！'); playSound(S_WIN);
        setTimeout(() => resetBet(chips+Math.floor(bet*2.5)), 2200);
      }
    } else {
      setMessage('');
    }
  };

  const hit = async () => {
    playSound(S_DEAL);
    let d = [...deck], p = [...player, d.shift()!];
    setDeck(d); setPlayer(p);
    if(isBust(p)) {
      setMessage('爆牌了！'); setStage('settle'); setHideDealer(false); playSound(S_LOSE);
      setTimeout(() => resetBet(chips), 1800);
    }
  };
  const stand = async () => {
    setStage('dealer'); setHideDealer(false);
    await sleep(650);
    let d = [...deck], dlr = [...dealer];
    while(handValue(dlr)<17) {
      dlr.push(d.shift()!);
      setDealer([...dlr]);
      playSound(S_DEAL);
      await sleep(740);
    }
    await sleep(350);
    const pvalue = handValue(player), dvalue = handValue(dlr);
    if(isBust(dlr) || pvalue > dvalue) {
      setMessage('你赢了！'); playSound(S_WIN); setStage('settle');
      setTimeout(() => resetBet(chips+bet*2), 2000);
    } else if (dvalue > pvalue) {
      setMessage('庄家赢了！'); playSound(S_LOSE); setStage('settle');
      setTimeout(() => resetBet(chips), 2000);
    } else {
      setMessage('平局！'); setStage('settle');
      setTimeout(() => resetBet(chips+bet), 2000);
    }
  };
  function resetBet(nextChips:number) {
    setChips(nextChips);
    setBet(0);
    setPlayer([]);
    setDealer([]);
    setStage('bet');
    setMessage('');
    setHideDealer(true);
  }
  function MusicBtn() {
    return (
      <button className="vegas-btn music-btn" onClick={()=>setMusic(m=>!m)}>
        {music?"关闭音乐":"播放音乐"}
      </button>
    )
  }

  return (
    <div className="vegas-table">
      <MusicBtn/>
      <h1 style={{color:'#FFD700',marginTop:0,textShadow:'0 4px 24px #501'}}>拉斯维加斯 21点</h1>
      <div style={{position:'absolute',right:32,top:75,color:'#FFD700',fontWeight:700}}>筹码：${chips}</div>
      <div className="dealer-label">庄家{!hideDealer && "：" + handValue(dealer)}</div>
      <div className="hand-area">
        <HandComp cards={dealer} hideFirst={hideDealer}/>
      </div>
      <div style={{height:40,margin:"18px 0"}}>
        <span id="msgbox">{message}</span>
      </div>
      <div className="player-label">玩家{player.length>0 && "："+handValue(player)}</div>
      <div className="hand-area">
        <HandComp cards={player}/>
      </div>
      <div className="control-row">
        {stage === 'bet' &&
          <div>
            <BetPanel chipsLeft={chips} currentBet={bet} onBet={onBet}/>
            <button className="vegas-btn" onClick={deal}>发牌</button>
          </div>}
        {stage==='player' &&
          <>
            <button className="vegas-btn" onClick={hit}>要牌</button>
            <button className="vegas-btn" onClick={stand}>停牌</button>
          </>}
        {stage==='settle' &&
          <button className="vegas-btn" onClick={()=>resetBet(chips)}>下一局</button>
        }
      </div>
    </div>
  );
};
export default GameTable;
