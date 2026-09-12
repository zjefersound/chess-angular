import { ChessField } from '../common/chess-field';

export default class Utils {
  static getStraightMoves(
    board: ChessField[][],
    currentRow: number,
    currentColumn: number,
    getOnlyCaptureFields?: boolean
  ): number[][] {
    let moves: number[][] = [];
    const currentPieceColor =
      board[currentRow]?.[currentColumn]?.piece?.split('-')[0];

    function getLine(
      direction: 'top' | 'bottom' | 'left' | 'right',
      board: ChessField[][],
      row: number,
      column: number
    ) {
      const field = board[row]?.[column];
      if (!field) return;

      const isCurrentField = row === currentRow && column === currentColumn;
      if (!isCurrentField) moves = [...moves, [row, column]];

      const hasPiece = Boolean(field.piece);
      const isEnemyKing =
        hasPiece &&
        field.piece?.split('-')[1] === 'K' &&
        field.piece?.split('-')[0] !== currentPieceColor;
      if (!isCurrentField && hasPiece && !(getOnlyCaptureFields && isEnemyKing))
        return;

      const nextRow =
        row + (direction === 'top' ? -1 : direction === 'bottom' ? 1 : 0);
      const nextColumn =
        column + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0);

      getLine(direction, board, nextRow, nextColumn);
    }

    getLine('top', board, currentRow, currentColumn);
    getLine('right', board, currentRow, currentColumn);
    getLine('bottom', board, currentRow, currentColumn);
    getLine('left', board, currentRow, currentColumn);

    return moves;
  }

  static getDiagonalMoves(
    board: ChessField[][],
    currentRow: number,
    currentColumn: number,
    getOnlyCaptureFields?: boolean
  ): number[][] {
    let moves: number[][] = [];
    const currentPieceColor =
      board[currentRow]?.[currentColumn]?.piece?.split('-')[0];

    function getDiagonal(
      rowDirection: 'top' | 'bottom',
      columnDirection: 'left' | 'right',
      board: ChessField[][],
      row: number,
      column: number
    ) {
      const field = board[row]?.[column];
      if (!field) return;

      const isCurrentField = row === currentRow && column === currentColumn;
      if (!isCurrentField) moves = [...moves, [row, column]];

      const hasPiece = Boolean(field.piece);
      const isEnemyKing =
        hasPiece &&
        field.piece?.split('-')[1] === 'K' &&
        field.piece?.split('-')[0] !== currentPieceColor;
      if (!isCurrentField && hasPiece && !(getOnlyCaptureFields && isEnemyKing))
        return;

      const nextRow = row + (rowDirection === 'top' ? -1 : 1);
      const nextColumn = column + (columnDirection === 'left' ? -1 : 1);

      getDiagonal(rowDirection, columnDirection, board, nextRow, nextColumn);
    }

    getDiagonal('top', 'left', board, currentRow, currentColumn);
    getDiagonal('top', 'right', board, currentRow, currentColumn);
    getDiagonal('bottom', 'left', board, currentRow, currentColumn);
    getDiagonal('bottom', 'right', board, currentRow, currentColumn);

    return moves;
  }
}
