// client/src/games/connect-four/ConnectFourBoard.jsx
import React, { useState } from 'react';
import { ArrowDown } from 'lucide-react';

export default function ConnectFourBoard({
  board,
  onMakeMove,
  isMyTurn,
  mySymbol,
  winningCells,
  disabled
}) {
  const [hoveredCol, setHoveredCol] = useState(null);

  const isWinningCell = (row, col) => {
    if (!winningCells) return false;
    return winningCells.some((c) => c.row === row && c.col === col);
  };

  const isColFull = (col) => {
    return board && board[0] && board[0][col] !== null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Column Drop Arrow Indicators */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 'clamp(4px, 1.5vw, 10px)',
          width: '100%',
          maxWidth: 'min(480px, 100%)',
          marginBottom: 10
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6].map((col) => {
          const full = isColFull(col);
          const canDrop = isMyTurn && !full && !disabled;

          return (
            <button
              key={col}
              onClick={() => canDrop && onMakeMove(col)}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
              disabled={!canDrop}
              aria-label={`Drop in Column ${col + 1}`}
              style={{
                background:
                  hoveredCol === col && canDrop
                    ? mySymbol === 'red'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'rgba(245, 158, 11, 0.3)'
                    : 'transparent',
                border: 'none',
                borderRadius: 8,
                padding: '6px 0',
                cursor: canDrop ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: canDrop ? (mySymbol === 'red' ? '#ef4444' : '#f59e0b') : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {canDrop && <ArrowDown size={20} className="animate-float" />}
            </button>
          );
        })}
      </div>

      {/* Blue Grid Surface */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 'clamp(4px, 1.5vw, 10px)',
          padding: 'clamp(8px, 2.5vw, 16px)',
          background: 'linear-gradient(180deg, #182346 0%, #0d152d 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '3px solid #2b396b',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 2px 8px rgba(255, 255, 255, 0.15)',
          maxWidth: 'min(480px, 100%)',
          width: '100%'
        }}
      >
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isWin = isWinningCell(rIdx, cIdx);
            const isHovered = hoveredCol === cIdx && isMyTurn && !isColFull(cIdx);

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                onClick={() => isMyTurn && !disabled && !isColFull(cIdx) && onMakeMove(cIdx)}
                onMouseEnter={() => setHoveredCol(cIdx)}
                onMouseLeave={() => setHoveredCol(null)}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  background:
                    cell === 'red'
                      ? 'radial-gradient(circle at 35% 35%, #ff5252, #b71c1c)'
                      : cell === 'yellow'
                      ? 'radial-gradient(circle at 35% 35%, #ffd54f, #f57f17)'
                      : isHovered
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#080c18',
                  boxShadow: isWin
                    ? '0 0 0 3px var(--neon-cyan), 0 8px 24px -2px rgba(56, 189, 248, 0.4)'
                    : cell
                    ? 'inset 0 3px 6px rgba(255, 255, 255, 0.4), 0 4px 10px rgba(0, 0, 0, 0.5)'
                    : 'inset 0 4px 8px rgba(0, 0, 0, 0.7)',
                  border: isWin
                    ? '3px solid var(--neon-cyan)'
                    : cell
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: isMyTurn && !disabled && !isColFull(cIdx) ? 'pointer' : 'default',
                  transform: isWin ? 'scale(1.08)' : 'none',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
