// client/src/games/tic-tac-toe/TicTacToeBoard.jsx
import React from 'react';

export default function TicTacToeBoard({
  board,
  onMakeMove,
  isMyTurn,
  mySymbol,
  winningLine,
  disabled
}) {
  const isWinningSquare = (index) => {
    return winningLine && winningLine.includes(index);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        maxWidth: 360,
        margin: '0 auto',
        padding: 16,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {board.map((cell, index) => {
        const isWin = isWinningSquare(index);
        const canClick = isMyTurn && cell === null && !disabled;

        return (
          <button
            key={index}
            onClick={() => canClick && onMakeMove(index)}
            disabled={!canClick}
            aria-label={`Square ${index + 1}`}
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 'var(--radius-md)',
              background: isWin
                ? 'rgba(56, 189, 248, 0.16)'
                : cell
                ? 'var(--bg-secondary)'
                : canClick
                ? 'rgba(255, 255, 255, 0.03)'
                : 'transparent',
              border: isWin
                ? '2px solid var(--neon-cyan)'
                : canClick
                ? '1px dashed var(--border-active)'
                : '1px solid var(--border-subtle)',
              cursor: canClick ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: cell === 'X' ? 'var(--player-x)' : 'var(--player-o)',
              boxShadow: isWin
                ? '0 0 0 2px var(--neon-cyan), 0 8px 24px -2px rgba(56, 189, 248, 0.3)'
                : 'none',
              transform: isWin ? 'scale(1.04)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}
