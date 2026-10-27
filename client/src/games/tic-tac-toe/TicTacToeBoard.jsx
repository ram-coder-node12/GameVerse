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
                ? 'rgba(0, 242, 254, 0.25)'
                : cell
                ? 'var(--bg-secondary)'
                : canClick
                ? 'rgba(0, 242, 254, 0.06)'
                : 'transparent',
              border: isWin
                ? '2px solid var(--neon-cyan)'
                : canClick
                ? '1px dashed var(--neon-cyan)'
                : '1px solid var(--border-subtle)',
              cursor: canClick ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: cell === 'X' ? '#00f2fe' : '#ff007f',
              textShadow:
                cell === 'X'
                  ? '0 0 20px rgba(0, 242, 254, 0.8)'
                  : cell === 'O'
                  ? '0 0 20px rgba(255, 0, 127, 0.8)'
                  : 'none',
              boxShadow: isWin ? '0 0 25px rgba(0, 242, 254, 0.5)' : 'none',
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
