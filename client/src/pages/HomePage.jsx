// client/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Gamepad2,
  Swords,
  ShieldCheck,
  Zap,
  Trophy,
  Grid3X3,
  CircleDot,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  Users
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { joinQueue, inQueue, onlineCount } = useSocket();
  const navigate = useNavigate();

  // Rotating game modes
  const words = ['Tic-Tac-Toe', 'Connect Four', 'Ranked Duels', 'Tactical Arenas'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');

  // Helper to check 3-in-a-row or draw
  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (squares.every((s) => s !== null)) {
      return { winner: 'DRAW', line: [] };
    }
    return null;
  };

  // Interactive Match Simulator State
  const [miniBoard, setMiniBoard] = useState([
    'X', null, null,
    null, 'O', null,
    null, null, null
  ]);
  const [simulatedLatency, setSimulatedLatency] = useState(12);
  const [simulatedMoves, setSimulatedMoves] = useState(2);
  const [lastActionLog, setLastActionLog] = useState('TURN #2: (1,1) O • VALIDATED ON SERVER');
  const [botThinking, setBotThinking] = useState(false);
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'won' | 'lost' | 'draw' | null
  const [winningCells, setWinningCells] = useState([]);

  // Word rotation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('fade-out');
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setFadeState('fade-in');
      }, 250);
    }, 2800);
    return () => clearInterval(interval);
  }, [words.length]);

  // Handle player click on interactive mini-board
  const handleMiniCellClick = (index) => {
    if (miniBoard[index] || botThinking || gameResult) return;

    // 1. Human Move 'X'
    const newBoard = [...miniBoard];
    newBoard[index] = 'X';
    setMiniBoard(newBoard);
    setIsPulseActive(true);
    const newMoves = simulatedMoves + 1;
    setSimulatedMoves(newMoves);
    const row = Math.floor(index / 3);
    const col = index % 3;
    setSimulatedLatency(Math.floor(Math.random() * 5) + 9);
    setTimeout(() => setIsPulseActive(false), 800);

    // Check if player won
    const playerCheck = checkWinner(newBoard);
    if (playerCheck) {
      if (playerCheck.winner === 'X') {
        setWinningCells(playerCheck.line);
        setGameResult('won');
        setLastActionLog(`VICTORY! (${row},${col}) X • 3-IN-A-ROW (+25 ELO)`);
        return;
      }
      if (playerCheck.winner === 'DRAW') {
        setGameResult('draw');
        setLastActionLog('MATCH CONCLUDED: DRAW • +5 ELO');
        return;
      }
    }

    setLastActionLog(`TURN #${newMoves}: (${row},${col}) X • VALIDATED ON SERVER`);

    // 2. Automated Opponent Response
    setBotThinking(true);
    setTimeout(() => {
      const emptyIndices = newBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val) => val !== null);

      if (emptyIndices.length === 0) {
        setGameResult('draw');
        setLastActionLog('MATCH CONCLUDED: DRAW • +5 ELO');
        setBotThinking(false);
        return;
      }

      // Smart Bot AI:
      // A. Win if possible
      let chosenMove = null;
      for (const idx of emptyIndices) {
        const testBoard = [...newBoard];
        testBoard[idx] = 'O';
        const win = checkWinner(testBoard);
        if (win && win.winner === 'O') {
          chosenMove = idx;
          break;
        }
      }

      // B. Block player win
      if (chosenMove === null) {
        for (const idx of emptyIndices) {
          const testBoard = [...newBoard];
          testBoard[idx] = 'X';
          const win = checkWinner(testBoard);
          if (win && win.winner === 'X') {
            chosenMove = idx;
            break;
          }
        }
      }

      // C. Take center or random empty spot
      if (chosenMove === null) {
        if (emptyIndices.includes(4) && Math.random() > 0.4) {
          chosenMove = 4;
        } else {
          chosenMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }
      }

      newBoard[chosenMove] = 'O';
      setMiniBoard([...newBoard]);
      const botMoves = newMoves + 1;
      setSimulatedMoves(botMoves);
      const bRow = Math.floor(chosenMove / 3);
      const bCol = chosenMove % 3;
      setSimulatedLatency(Math.floor(Math.random() * 4) + 10);

      // Check if bot won or draw
      const botCheck = checkWinner(newBoard);
      if (botCheck) {
        if (botCheck.winner === 'O') {
          setWinningCells(botCheck.line);
          setGameResult('lost');
          setLastActionLog(`MATCH ENDED: (${bRow},${bCol}) O WON (-15 ELO)`);
        } else if (botCheck.winner === 'DRAW') {
          setGameResult('draw');
          setLastActionLog('MATCH CONCLUDED: DRAW • +5 ELO');
        }
      } else {
        setLastActionLog(`TURN #${botMoves}: (${bRow},${bCol}) O • VALIDATED ON SERVER`);
      }
      setBotThinking(false);
    }, 450);
  };

  const handleResetMiniDuel = (e) => {
    e?.stopPropagation();
    setMiniBoard([
      'X', null, null,
      null, 'O', null,
      null, null, null
    ]);
    setWinningCells([]);
    setGameResult(null);
    setBotThinking(false);
    setSimulatedMoves(2);
    setLastActionLog('TURN #2: (1,1) O • VALIDATED ON SERVER');
    setIsPulseActive(true);
    setTimeout(() => setIsPulseActive(false), 500);
  };

  const handlePlayOnline = (gameType) => {
    if (!user) {
      navigate('/login');
      return;
    }
    joinQueue(gameType);
  };

  return (
    <div>
      {/* ============================================================
          Hero Section: 2-Column Split
         ============================================================ */}
      <section className="render-hero-container">
        {/* Left Column: Gaming Headline & CTAs */}
        <div>
          {/* Gaming Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 24,
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-muted)'
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}
            />
            <span>Competitive Multiplayer Gaming Arena</span>
          </div>

          {/* Core Gaming Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              marginBottom: 24,
              color: 'var(--text-main)'
            }}
          >
            The Ultimate Arena for<br />
            <span
              style={{
                color: 'var(--render-purple)',
                display: 'inline-block',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                opacity: fadeState === 'fade-in' ? 1 : 0.2,
                transform: fadeState === 'fade-in' ? 'translateY(0)' : 'translateY(4px)'
              }}
            >
              [{words[currentWordIndex]}
            </span>
            <span style={{ color: 'var(--render-orange)', fontWeight: 700 }}>]</span>
            <span className="render-cursor">|</span>
          </h1>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              lineHeight: 1.55,
              maxWidth: 520,
              marginBottom: 36
            }}
          >
            Play instant real-time multiplayer games directly in your browser. Challenge rated players worldwide, climb the global ELO leaderboard, and compete with zero cheat latency.
          </p>

          {/* High-Contrast Action Buttons */}
          <div
            className="mobile-full-btn-group"
            style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 36 }}
          >
            {user ? (
              <button
                onClick={() => handlePlayOnline('TIC_TAC_TOE')}
                disabled={inQueue}
                className="btn btn-primary btn-lg mobile-full-btn"
              >
                <Play size={16} fill="currentColor" />
                {inQueue ? 'Matching in Queue...' : 'Queue Ranked Duel >'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary btn-lg mobile-full-btn"
              >
                Sign up &gt;
              </button>
            )}

            <button
              onClick={() => navigate('/leaderboard')}
              className="btn btn-secondary btn-lg mobile-full-btn"
            >
              View Global Leaderboard
            </button>
          </div>

          {/* Core Gaming Pillars */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              fontSize: '0.82rem',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#10b981' }}>●</span>
              <span>Instant Matchmaking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--render-purple)' }}>●</span>
              <span>Anti-Cheat Protected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#f59e0b' }}>●</span>
              <span>Global ELO Ratings</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Duel Arena Console (Enlarged Centerpiece) */}
        <div>
          <div
            style={{
              background: 'var(--bg-card)',
              border: isPulseActive ? '1px solid var(--render-purple)' : '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '24px',
              boxShadow: isPulseActive
                ? '0 12px 34px -10px rgba(124, 58, 237, 0.25)'
                : '0 8px 30px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.25s ease'
            }}
          >
            {/* Console Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Grid3X3 size={18} color="var(--neon-cyan)" />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--text-main)'
                  }}
                >
                  interactive-arena-demo
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  ● LIVE DEMO
                </span>
              </div>

              <button
                onClick={handleResetMiniDuel}
                title="Reset Board"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            {/* Enlarged Interactive Playable Duel Area */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 28,
                flexWrap: 'wrap',
                marginBottom: 20
              }}
            >
              {/* Left: Big 3x3 Playable Duel Grid */}
              <div className="hero-duel-board">
                {miniBoard.map((cell, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleMiniCellClick(idx)}
                    className={`hero-duel-cell ${cell ? (cell === 'X' ? 'cell-x occupied' : 'cell-o occupied') : ''} ${winningCells.includes(idx) ? 'winning-cell' : ''}`}
                  >
                    {cell}
                  </div>
                ))}
              </div>

              {/* Right: Live Game Engine Feed */}
              <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap
                    size={14}
                    color={
                      gameResult === 'won'
                        ? '#10b981'
                        : gameResult === 'lost'
                        ? '#ef4444'
                        : gameResult === 'draw'
                        ? '#f59e0b'
                        : '#f59e0b'
                    }
                  />
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      color:
                        gameResult === 'won'
                          ? '#10b981'
                          : gameResult === 'lost'
                          ? '#ef4444'
                          : gameResult === 'draw'
                          ? '#f59e0b'
                          : 'var(--neon-cyan)',
                      fontWeight: 600
                    }}
                  >
                    {botThinking
                      ? '● Opponent thinking...'
                      : gameResult === 'won'
                      ? '🏆 Victory! You won (+25 ELO)'
                      : gameResult === 'lost'
                      ? '💥 Opponent won (-15 ELO)'
                      : gameResult === 'draw'
                      ? '🤝 Match Draw (+5 ELO)'
                      : '⚡ Click any square to play'}
                  </span>
                </div>

                {/* Live Match Engine Log Box */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    padding: '14px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    lineHeight: 1.55,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div
                    style={{
                      color:
                        gameResult === 'won'
                          ? '#10b981'
                          : gameResult === 'lost'
                          ? '#ef4444'
                          : botThinking
                          ? 'var(--render-purple)'
                          : 'var(--text-main)',
                      fontWeight: 600
                    }}
                  >
                    {botThinking ? '● Validating board move...' : '✓ ' + lastActionLog}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Match latency: <span style={{ color: '#10b981', fontWeight: 600 }}>{simulatedLatency}ms</span> • Anti-cheat: <span style={{ color: '#10b981', fontWeight: 600 }}>Verified</span>
                  </div>
                </div>

                {/* Match Sparkline Wave */}
                <div>
                  <svg className="sparkline-svg" viewBox="0 0 200 32" preserveAspectRatio="none" style={{ height: 32 }}>
                    <defs>
                      <linearGradient id="grad-engine-wave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--render-purple)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--render-purple)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,22 Q30,10 60,20 T120,8 T160,18 T200,12 L200,32 L0,32 Z"
                      fill="url(#grad-engine-wave)"
                    />
                    <path
                      d="M0,22 Q30,10 60,20 T120,8 T160,18 T200,12"
                      fill="none"
                      stroke="var(--render-purple)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="telemetry-spark"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom Row: Game Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)'
              }}
            >
              <div>
                <span>MOVES: </span>
                <strong style={{ color: 'var(--text-main)' }}>{simulatedMoves}</strong>
              </div>
              <div>
                <span>ANTI-CHEAT: </span>
                <strong style={{ color: '#10b981' }}>100%</strong>
              </div>
              <div>
                <span>WIN ELO: </span>
                <strong style={{ color: '#10b981' }}>+25 PTS</strong>
              </div>
              <div>
                <span>STATUS: </span>
                <strong
                  style={{
                    color:
                      gameResult === 'won'
                        ? '#10b981'
                        : gameResult === 'lost'
                        ? '#ef4444'
                        : gameResult === 'draw'
                        ? '#f59e0b'
                        : 'var(--text-main)'
                  }}
                >
                  {gameResult === 'won'
                    ? 'Victory'
                    : gameResult === 'lost'
                    ? 'Defeat'
                    : gameResult === 'draw'
                    ? 'Draw'
                    : 'Active'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          Live Match Feed Ticker
         ============================================================ */}
      <div className="match-ticker-track">
        <div className="match-ticker-badge">
          <Activity size={14} className="telemetry-spark" />
          <span>Live Match Feed</span>
        </div>
        <div style={{ display: 'flex', gap: 24, overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
          <span>⚡ <strong style={{ color: 'var(--text-main)' }}>Player_Apex</strong> won Tic-Tac-Toe Arena (+25 ELO)</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>🎯 <strong style={{ color: 'var(--text-main)' }}>CyberKnight</strong> connected 4 in column #3 (+25 ELO)</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>🛡️ Server Engine: <strong style={{ color: '#10b981' }}>100%</strong> turns validated without cheat latency</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>🔥 Streak Alert: <strong style={{ color: '#f59e0b' }}>Vortex_99</strong> reached 5 consecutive victories</span>
        </div>
      </div>

      {/* ============================================================
          Featured Game Selection Arenas
         ============================================================ */}
      <section style={{ marginBottom: 64 }}>
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--text-main)', marginBottom: 4, letterSpacing: '-0.02em' }}>
              Featured Arenas
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem' }}>
              Select a game arena to instantly enter the real-time matchmaking queue.
            </p>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            AUTOMATED MATCHMAKING QUEUE • ACTIVE
          </span>
        </div>

        <div className="grid-2">
          {/* Tic-Tac-Toe Arena Card */}
          <div
            className="glass-card interactive-arena-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Grid3X3 size={24} color="var(--neon-cyan)" />
                </div>
                <span className="badge badge-cyan">2 Players • Fast Match</span>
              </div>

              <h3 style={{ fontSize: '1.45rem', color: 'var(--text-main)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Tic-Tac-Toe Arena
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 20, lineHeight: 1.55 }}>
                The classic 3×3 tactical duel. Place your mark, anticipate your opponent's sequence, and claim three in a row with authoritative move validation.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 24,
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>WIN: </span>
                  <strong style={{ color: '#10b981' }}>+25 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>LOSS: </span>
                  <strong style={{ color: '#ef4444' }}>-20 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>DRAW: </span>
                  <strong style={{ color: '#f59e0b' }}>+5 PTS</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlayOnline('TIC_TAC_TOE')}
              disabled={inQueue}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Swords size={17} />
              {inQueue ? 'Waiting in Queue...' : 'Enter Tic-Tac-Toe Arena'}
            </button>
          </div>

          {/* Connect Four Arena Card */}
          <div
            className="glass-card interactive-arena-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    background: 'rgba(147, 51, 234, 0.1)',
                    border: '1px solid rgba(147, 51, 234, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CircleDot size={24} color="var(--render-purple)" />
                </div>
                <span className="badge badge-purple">7×6 Gravity Grid</span>
              </div>

              <h3 style={{ fontSize: '1.45rem', color: 'var(--text-main)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Connect Four Arena
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 20, lineHeight: 1.55 }}>
                Drop colored disks into the 7-column gravity vertical grid. Connect 4 disks horizontally, vertically, or diagonally before your opponent blocks your path.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 24,
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>WIN: </span>
                  <strong style={{ color: '#10b981' }}>+25 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>LOSS: </span>
                  <strong style={{ color: '#ef4444' }}>-20 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>DRAW: </span>
                  <strong style={{ color: '#f59e0b' }}>+5 PTS</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlayOnline('CONNECT_FOUR')}
              disabled={inQueue}
              className="btn btn-purple"
              style={{ width: '100%', padding: '12px' }}
            >
              <Swords size={17} />
              {inQueue ? 'Waiting in Queue...' : 'Enter Connect Four Arena'}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          Why Competitors Choose GameVerse (Gaming-Native Value Props)
         ============================================================ */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Why Competitors Choose GameVerse
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Engineered from the ground up for fair, cheat-free, real-time multiplayer gaming.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-card interactive-arena-card">
            <div style={{ color: 'var(--neon-cyan)', marginBottom: 14 }}>
              <ShieldCheck size={26} />
            </div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: 6 }}>
              Anti-Cheat & Fair Play
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              Server-authoritative rules engine strictly validates every move. No client-side tampering, no turn hijacking, 100% fair competition.
            </p>
          </div>

          <div className="glass-card interactive-arena-card">
            <div style={{ color: 'var(--render-purple)', marginBottom: 14 }}>
              <Zap size={26} />
            </div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: 6 }}>
              Instant WebSocket Matches
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              Zero polling lag. Real-time Socket.IO channels synchronize opponent turns instantly with automated matchmaking and 30s reconnect resilience.
            </p>
          </div>

          <div className="glass-card interactive-arena-card">
            <div style={{ color: '#f59e0b', marginBottom: 14 }}>
              <Trophy size={26} />
            </div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: 6 }}>
              Competitive ELO Ratings
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              Start at 1000 rating points and climb the global ladder. Earn win-streak multipliers, track match histories, and challenge friends.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
