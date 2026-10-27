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
  Server,
  Activity,
  CheckCircle2,
  Terminal,
  Radio,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { joinQueue, inQueue, onlineCount } = useSocket();
  const navigate = useNavigate();

  // Rotating keywords (Gamer & developer tuned, exactly one closing bracket)
  const words = ['Tic-Tac-Toe', 'Connect Four', 'Ranked Duels', 'Turn Strategy'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');
  const [showSkipPrompt, setShowSkipPrompt] = useState(true);

  // Interactive Match Simulator State
  const [miniBoard, setMiniBoard] = useState([
    'X', null, null,
    null, 'O', null,
    null, null, null
  ]);
  const [miniTurn, setMiniTurn] = useState('X');
  const [isWireActive, setIsWireActive] = useState(false);
  const [simulatedLatency, setSimulatedLatency] = useState(12);
  const [simulatedMoves, setSimulatedMoves] = useState(2);
  const [lastActionLog, setLastActionLog] = useState('TURN #2 VERIFIED: (1,1) O • 0 CHEAT DETECTED');
  const [botThinking, setBotThinking] = useState(false);

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

  // Handle human move on interactive mini-board
  const handleMiniCellClick = (index) => {
    if (miniBoard[index] || botThinking) return;

    // 1. Place Human Move 'X'
    const newBoard = [...miniBoard];
    newBoard[index] = 'X';
    setMiniBoard(newBoard);
    setIsWireActive(true);
    setSimulatedMoves((prev) => prev + 1);
    const row = Math.floor(index / 3);
    const col = index % 3;
    setSimulatedLatency(Math.floor(Math.random() * 5) + 9); // 9-13ms
    setLastActionLog(`MOVE VERIFIED: (${row},${col}) X • SERVER VALIDATED`);

    setTimeout(() => setIsWireActive(false), 850);

    // 2. Check if board is full or win
    const emptyIndices = newBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);

    if (emptyIndices.length === 0) {
      setLastActionLog('MINI-MATCH DRAW • ELO ADJUSTED (+5 PTS)');
      return;
    }

    // 3. Automated Server Opponent Response
    setBotThinking(true);
    setTimeout(() => {
      const botPick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      newBoard[botPick] = 'O';
      setMiniBoard([...newBoard]);
      setSimulatedMoves((prev) => prev + 1);
      const bRow = Math.floor(botPick / 3);
      const bCol = botPick % 3;
      setSimulatedLatency(Math.floor(Math.random() * 4) + 10);
      setLastActionLog(`MOVE BROADCAST: (${bRow},${bCol}) O • 2 CLIENTS SYNCED`);
      setBotThinking(false);
    }, 700);
  };

  const handleResetMiniDuel = (e) => {
    e.stopPropagation();
    setMiniBoard([null, null, null, null, null, null, null, null, null]);
    setSimulatedMoves(0);
    setLastActionLog('ENGINE RESET: STANDBY FOR NEXT MOVE');
    setIsWireActive(true);
    setTimeout(() => setIsWireActive(false), 600);
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
          Render.com Signature Hero Section (Split 2-Column)
         ============================================================ */}
      <section className="render-hero-container">
        {/* Left Column: Architectural Title & CTAs */}
        <div>
          {/* Top developer pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 24,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981'
              }}
            />
            <span>$ gameverse duel --authoritative</span>
          </div>

          {/* Render-style Typography Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.6rem, 5.2vw, 4.4rem)',
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              marginBottom: 24,
              color: 'var(--text-main)'
            }}
          >
            Your fastest path to<br />
            victory in<br />
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
            Server-authoritative competitive multiplayer engine. Real-time WebSocket state synchronization, zero client-side cheating, and dynamic ELO matchmaking.
          </p>

          {/* Render High-Contrast Action Buttons */}
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
                Start playing free &gt;
              </button>
            )}

            <button
              onClick={() => navigate('/leaderboard')}
              className="btn btn-secondary btn-lg mobile-full-btn"
            >
              View Global Leaderboard
            </button>
          </div>

          {/* Infrastructure Bullet Metrics */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 18,
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#10b981' }}>●</span>
              <span>100% Server Authoritative</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--render-purple)' }}>●</span>
              <span>Socket.IO Push WebSockets</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#f59e0b' }}>●</span>
              <span>Sub-15ms Latency</span>
            </div>
          </div>
        </div>

        {/* Right Column: Render Blueprint Interactive Telemetry Diagram */}
        <div style={{ position: 'relative' }}>
          {/* Render Floating Shortcut Prompt */}
          {showSkipPrompt && (
            <div
              style={{
                position: 'absolute',
                top: -65,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderTop: '3px solid var(--render-purple)',
                borderRadius: '4px',
                padding: '12px 14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                zIndex: 10,
                width: 220
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <span>Quick Match Ready?</span>
                <button
                  onClick={() => setShowSkipPrompt(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0 }}
                  aria-label="Close prompt"
                >
                  <X size={13} />
                </button>
              </div>
              <button
                onClick={() => handlePlayOnline('TIC_TAC_TOE')}
                className="btn btn-primary"
                style={{ padding: '6px 10px', fontSize: '0.74rem', borderRadius: 3, justifyContent: 'space-between', width: '100%' }}
              >
                <span>Jump into Arena</span>
                <span>&gt;</span>
              </button>
            </div>
          )}

          {/* Interactive Terminal Badge with Quick Trigger */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 12,
              paddingLeft: '24px',
              marginBottom: '-8px'
            }}
          >
            <div className="terminal-pill">
              <Terminal size={14} color="#a1a1aa" />
              <span>$ duel simulate --interactive</span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--render-purple)',
                fontWeight: 600
              }}
            >
              (Click grid to test)
            </span>
          </div>

          {/* Animated Connecting Circuit Wire Line */}
          <div className="render-wire-box">
            <svg
              width="100%"
              height="56"
              viewBox="0 0 340 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ overflow: 'visible' }}
            >
              <path
                d="M 68 0 V 28 H 170 V 56"
                stroke={isWireActive ? '#38bdf8' : 'var(--render-purple)'}
                strokeWidth={isWireActive ? '3' : '2'}
                fill="none"
                className={isWireActive ? 'wire-laser-active' : 'render-wire-animated'}
                style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }}
              />
              <circle cx="68" cy="2" r="3" fill="var(--render-purple)" />
              <circle cx="170" cy="54" r={isWireActive ? 5 : 3} fill={isWireActive ? '#38bdf8' : 'var(--render-purple)'} />
            </svg>
          </div>

          {/* Active Blueprint PRODUCTION Container */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Header: PRODUCTION • ENGINE MESH */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-dim)'
                  }}
                >
                  PRODUCTION CLUSTER • REAL-TIME MESH
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span>ONLINE ({onlineCount || 1} ACTIVE)</span>
              </div>
            </div>

            {/* 4 Interactive Telemetry Cards in 2x2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {/* Card 1: Live Interactive Mini-Duel Simulator */}
              <div className="telemetry-card" style={{ borderColor: isWireActive ? 'var(--render-purple)' : 'var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Grid3X3 size={13} color="var(--neon-cyan)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      engine-simulator
                    </span>
                  </div>
                  <button
                    onClick={handleResetMiniDuel}
                    title="Reset Mini Duel"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: 'var(--text-dim)'
                    }}
                  >
                    <RotateCcw size={11} />
                  </button>
                </div>

                {/* Interactive Playable Mini 3x3 Grid */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 8px' }}>
                  <div className="mini-duel-board">
                    {miniBoard.map((cell, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleMiniCellClick(idx)}
                        className={`mini-duel-cell ${cell ? (cell === 'X' ? 'cell-x occupied' : 'cell-o occupied') : ''}`}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>

                  <div style={{ flex: 1, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                      {botThinking ? '● Engine Validating...' : '⚡ Click any cell'}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', lineHeight: 1.2 }}>
                      {lastActionLog}
                    </span>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  <div>MOVES: <span style={{ color: 'var(--text-main)' }}>{simulatedMoves}</span></div>
                  <div>CHEAT: <span style={{ color: '#10b981' }}>0%</span></div>
                  <div>TICKS: <span style={{ color: 'var(--text-main)' }}>60Hz</span></div>
                  <div>AUTH: <span style={{ color: 'var(--text-main)' }}>Strict</span></div>
                </div>
              </div>

              {/* Card 2: app-connectfour-grid */}
              <div className="telemetry-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CircleDot size={13} color="var(--render-purple)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      gravity-connect4
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
                    <CheckCircle2 size={11} /> 7×6 Grid
                  </span>
                </div>

                {/* Live Sparkline Chart */}
                <div style={{ margin: '4px 0 8px' }}>
                  <svg className="sparkline-svg" viewBox="0 0 160 38" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad-spark2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--render-purple)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--render-purple)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,20 Q30,30 65,12 T115,24 T145,8 T160,18 L160,38 L0,38 Z"
                      fill="url(#grad-spark2)"
                    />
                    <path
                      d="M0,20 Q30,30 65,12 T115,24 T145,8 T160,18"
                      fill="none"
                      stroke="var(--render-purple)"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      className="telemetry-spark"
                    />
                  </svg>
                </div>

                {/* Telemetry Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  <div>MEMORY: <span style={{ color: 'var(--text-main)' }}>28MB</span></div>
                  <div>COLUMNS: <span style={{ color: 'var(--text-main)' }}>7 Drops</span></div>
                  <div>GRAVITY: <span style={{ color: 'var(--text-main)' }}>Server</span></div>
                  <div>HASH: <span style={{ color: 'var(--text-main)' }}>SHA-256</span></div>
                </div>
              </div>

              {/* Card 3: app-rating-elo */}
              <div className="telemetry-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trophy size={13} color="#f59e0b" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      elo-rating-service
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
                    <CheckCircle2 size={11} /> K=32
                  </span>
                </div>

                {/* Live Sparkline Chart */}
                <div style={{ margin: '4px 0 8px' }}>
                  <svg className="sparkline-svg" viewBox="0 0 160 38" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad-spark3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,15 Q35,5 70,25 T120,10 T145,18 T160,8 L160,38 L0,38 Z"
                      fill="url(#grad-spark3)"
                    />
                    <path
                      d="M0,15 Q35,5 70,25 T120,10 T145,18 T160,8"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      className="telemetry-spark"
                    />
                  </svg>
                </div>

                {/* Telemetry Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  <div>CALC: <span style={{ color: 'var(--text-main)' }}>K=32</span></div>
                  <div>WIN ELO: <span style={{ color: '#10b981' }}>+25 PTS</span></div>
                  <div>LOSS ELO: <span style={{ color: '#ef4444' }}>-20 PTS</span></div>
                  <div>STREAK: <span style={{ color: 'var(--text-main)' }}>1.5x</span></div>
                </div>
              </div>

              {/* Card 4: app-socket-cluster */}
              <div className="telemetry-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={13} color="var(--render-orange)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      websocket-mesh
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
                    <Activity size={11} /> {simulatedLatency}ms
                  </span>
                </div>

                {/* Live Sparkline Chart */}
                <div style={{ margin: '4px 0 8px' }}>
                  <svg className="sparkline-svg" viewBox="0 0 160 38" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad-spark4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--render-orange)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--render-orange)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,24 Q40,12 80,22 T120,6 T148,16 T160,12 L160,38 L0,38 Z"
                      fill="url(#grad-spark4)"
                    />
                    <path
                      d="M0,24 Q40,12 80,22 T120,6 T148,16 T160,12"
                      fill="none"
                      stroke="var(--render-orange)"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      className="telemetry-spark"
                    />
                  </svg>
                </div>

                {/* Telemetry Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  <div>UPTIME: <span style={{ color: 'var(--text-main)' }}>99.99%</span></div>
                  <div>POLL: <span style={{ color: 'var(--text-main)' }}>0 (Push)</span></div>
                  <div>PING: <span style={{ color: '#10b981' }}>{simulatedLatency}ms</span></div>
                  <div>RECONNECT: <span style={{ color: 'var(--text-main)' }}>30s</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          Live Matchmaking Engine Event Ticker (Developer Stream)
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
          Featured Game Selection Arenas (Interactive Previews)
         ============================================================ */}
      <section style={{ marginBottom: 64 }}>
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--text-main)', marginBottom: 4, letterSpacing: '-0.02em' }}>
              Featured Arenas
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem' }}>
              Select an authoritative arena to automatically match against rated players.
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
          Engineering Architecture Pillars
         ============================================================ */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Game Platform Architecture
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Built with modern distributed system paradigms for fair competition.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-card interactive-arena-card">
            <div style={{ color: 'var(--neon-cyan)', marginBottom: 14 }}>
              <ShieldCheck size={26} />
            </div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: 6 }}>
              Server-Authoritative Core
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              Clients never decide moves, turns, or match results. Every placement is verified against board state models in real-time.
            </p>
          </div>

          <div className="glass-card interactive-arena-card">
            <div style={{ color: 'var(--render-purple)', marginBottom: 14 }}>
              <Zap size={26} />
            </div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: 6 }}>
              Push-Based WebSockets
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              Zero HTTP polling. Bi-directional Socket.IO channels synchronize turns instantly, with a 30s disconnect resilience buffer.
            </p>
          </div>

          <div className="glass-card interactive-arena-card">
            <div style={{ color: '#f59e0b', marginBottom: 14 }}>
              <Trophy size={26} />
            </div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: 6 }}>
              Dynamic ELO Ratings
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              Persistent skill ratings starting at 1000 with win-streak multipliers, match history tracking, and global leaderboards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
