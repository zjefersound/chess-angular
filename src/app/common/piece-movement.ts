import { EColor, EPiece } from '../models/app-enums.model';
import Utils from '../utils/Utils';
import { ChessField } from './chess-field';
import { Move } from './move';

interface IDominatedFields {
  white: number[][];
  black: number[][];
}
export class PieceMovement {
  private board: ChessField[][];
  private currentField: ChessField;
  private currentPlayer: 'black' | 'white';
  private dominatedFields: IDominatedFields = {
    black: [],
    white: [],
  };
  private moveHistory: Move[] = [];

  constructor(
    board: ChessField[][],
    currentField: ChessField,
    currentPlayer: 'black' | 'white',
    moveHistory: Move[],
    dominatedFields: IDominatedFields
  ) {
    this.board = board;
    this.currentField = currentField;
    this.currentPlayer = currentPlayer;
    this.moveHistory = moveHistory;
    this.dominatedFields = dominatedFields;
  }

  setBoard(board: ChessField[][]) {
    this.board = board;
  }

  // A sliding piece's attack "sees through" the enemy king: if the king is in
  // check along a rank/file/diagonal, the square directly behind it (on the
  // far side, away from the attacker) is still attacked, because the king
  // can't step there to escape the check. This only matters when computing
  // dominated fields (i.e. which squares the opponent's king may not enter),
  // not when listing a piece's own regular moves - a piece still can't
  // actually move/capture past the king on this turn.
  private getEnemyKingPiece(piece: string | null | undefined) {
    const color = piece?.split('-')[0];
    if (!color) return undefined;
    const enemyColor = color === EColor.white ? EColor.black : EColor.white;
    return `${enemyColor}-${EPiece.King}`;
  }

  private clearFieldsWithObstacles(
    move: number[],
    piece: string,
    getOnlyCaptureFields?: boolean
  ) {
    const row = move[0];
    const column = move[1];
    const hasPiecesAround = !(
      piece?.split('-')[0] === this.board[row][column]?.piece?.split('-')[0]
    );
    const isAllowedToMove =
      (this.currentPlayer == 'white' && piece?.split('-')[0] == 'W') ||
      (this.currentPlayer == 'black' && piece?.split('-')[0] == 'B');
    return getOnlyCaptureFields || (hasPiecesAround && isAllowedToMove);
  }

  static movePiece(
    board: ChessField[][],
    currentField: ChessField,
    targetField: ChessField
  ) {
    const updatedBoard = board;

    updatedBoard[currentField.row][currentField.column] = {
      ...currentField,
      piece: null,
      hasBeenMoved: false,
    };
    updatedBoard[targetField.row][targetField.column] = {
      ...targetField,
      piece: currentField.piece,
      hasBeenMoved: true,
    };

    return updatedBoard;
  }

  pawn(field: ChessField, getOnlyCaptureFields?: boolean) {
    const { column, row, piece, hasBeenMoved } = field;

    const defaultMoves = [
      [row - 1, column - 1],
      [row - 1, column],
      [row - 2, column],
      [row - 1, column + 1],
      [row + 1, column - 1],
      [row + 1, column],
      [row + 2, column],
      [row + 1, column + 1],
    ];
    const clearInvalidFields = (move: number[]) => {
      const tempRow = move[0];
      const tempColumn = move[1];
      const whitePlays = this.currentPlayer === 'white';
      const isFirstMove = !hasBeenMoved;
      const sameColumn = tempColumn === column;
      const hasPiece = this.board?.[tempRow]?.[tempColumn]?.piece;
      const hasPieceInTheSameColumn = hasPiece && sameColumn;

      //hasn't moved a piece or can only jump one
      const hasPieceInBetween =
        this.board?.[row + (whitePlays ? -1 : 1)]?.[tempColumn]?.piece &&
        sameColumn;
      const canOnlyJumpOne = tempRow > row - 2 && tempRow < row + 2;
      const allowJumpTwo =
        (isFirstMove && !hasPieceInBetween) || canOnlyJumpOne;
      const isMovingForward = whitePlays ? tempRow < row : tempRow > row;
      const isRowInBoard = tempRow >= 0 && tempRow <= this.board.length - 1;

      if (getOnlyCaptureFields) {
        const isRowValid = isRowInBoard && isMovingForward && canOnlyJumpOne;
        const isColumnInBoard =
          tempColumn >= 0 && tempColumn <= this.board[0].length - 1;
        const isColumnValid = !sameColumn && isColumnInBoard;
        return isRowValid && isColumnValid && !!piece;
      } else {
        const isRowValid =
          !hasPieceInTheSameColumn &&
          isRowInBoard &&
          isMovingForward &&
          allowJumpTwo;
        let allowEnPassant = false;
        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        if (lastMove) {
          const hasPieceBeside = lastMove.fieldTo.row === field.row;
          const hasPieceJumpedTwo =
            Math.abs(lastMove.fieldTo.row - lastMove.fieldFrom.row) == 2;
          const canCaptureField =
            tempColumn === lastMove.fieldTo.column &&
            tempRow === lastMove.fieldTo.row + (whitePlays ? -1 : 1);
          allowEnPassant =
            hasPieceBeside && hasPieceJumpedTwo && canCaptureField;
        }
        const isColumnValid = hasPiece || allowEnPassant || sameColumn;
        return isRowValid && isColumnValid && !!piece;
      }
    };

    const validMoves = defaultMoves
      .filter(clearInvalidFields)
      .filter((move) =>
        this.clearFieldsWithObstacles(
          move,
          piece as string,
          getOnlyCaptureFields
        )
      );
    return validMoves;
  }

  king(field: ChessField, getOnlyCaptureFields?: boolean) {
    const { column, row, piece, hasBeenMoved } = field;

    const defaultMoves = [
      [row - 1, column - 1],
      [row - 1, column],
      [row - 1, column + 1],
      [row, column - 2],
      [row, column - 1],
      [row, column + 1],
      [row, column + 2],
      [row + 1, column - 1],
      [row + 1, column],
      [row + 1, column + 1],
    ];
    const clearInvalidFields = (move: number[]) => {
      const tempRow = move[0];
      const tempColumn = move[1];
      const isRowValid = tempRow >= 0 && tempRow <= this.board.length - 1;
      const isColumnValid =
        tempColumn >= 0 && tempColumn <= this.board[0].length - 1;
      return isRowValid && isColumnValid && piece;
    };

    const firstRook = this.board[row]?.[0];
    const secondRook = this.board[row]?.[this.board[0].length - 1];

    const filterCastleMoves = (move: number[]) => {
      const isFirstMove = !hasBeenMoved;
      const tempColumn = move[1];
      const isFirstCastleAllowed =
        (isFirstMove &&
          firstRook?.piece &&
          !firstRook?.hasBeenMoved &&
          !this.board[row]?.[column - 1].piece) ||
        tempColumn > column - 2;
      const isSecondCastleAllowed =
        (isFirstMove &&
          secondRook?.piece &&
          !secondRook?.hasBeenMoved &&
          !this.board[row]?.[column + 1].piece) ||
        tempColumn < column + 2;
      const isCastleAllowed = isFirstCastleAllowed && isSecondCastleAllowed;
      return isCastleAllowed;
    };

    const filterAttackedFields = (move: number[]) => {
      if (getOnlyCaptureFields) return true;
      const currentColor = this.currentPlayer === 'white' ? 'black' : 'white';
      return !this.dominatedFields[currentColor]
        .map((move) => move.join(','))
        .includes(move.join(','));
    };

    const validMoves = defaultMoves
      .filter(clearInvalidFields)
      .filter(filterCastleMoves)
      .filter(filterAttackedFields)
      .filter((move) =>
        this.clearFieldsWithObstacles(
          move,
          piece as string,
          getOnlyCaptureFields
        )
      );
    return validMoves;
  }
  rook(field: ChessField, getOnlyCaptureFields?: boolean) {
    const { column, row, piece } = field;

    const xrayPiece = getOnlyCaptureFields
      ? this.getEnemyKingPiece(piece)
      : undefined;
    const defaultMoves = Utils.getStraightMoves(
      this.board,
      row,
      column,
      xrayPiece
    );

    const clearInvalidFields = (move: number[]) => {
      const row = move[0];
      const column = move[1];
      const isRowValid = row >= 0 && row <= this.board.length - 1;
      const isColumnValid = column >= 0 && column <= this.board[0].length - 1;
      return isRowValid && isColumnValid && piece;
    };

    const validMoves = defaultMoves
      .filter(clearInvalidFields)
      .filter((move) =>
        this.clearFieldsWithObstacles(
          move,
          piece as string,
          getOnlyCaptureFields
        )
      );

    return validMoves;
  }

  bishop(field: ChessField, getOnlyCaptureFields?: boolean) {
    const { column, row, piece } = field;

    const xrayPiece = getOnlyCaptureFields
      ? this.getEnemyKingPiece(piece)
      : undefined;
    const defaultMoves = Utils.getDiagonalMoves(
      this.board,
      row,
      column,
      xrayPiece
    );

    const clearInvalidFields = (move: number[]) => {
      const row = move[0];
      const column = move[1];
      const isRowValid = row >= 0 && row <= this.board.length - 1;
      const isColumnValid = column >= 0 && column <= this.board[0].length - 1;
      return isRowValid && isColumnValid && piece;
    };

    const validMoves = defaultMoves
      .filter(clearInvalidFields)
      .filter((move) =>
        this.clearFieldsWithObstacles(
          move,
          piece as string,
          getOnlyCaptureFields
        )
      );

    return validMoves;
  }

  queen(field: ChessField, getOnlyCaptureFields?: boolean) {
    const { column, row, piece } = field;

    const xrayPiece = getOnlyCaptureFields
      ? this.getEnemyKingPiece(piece)
      : undefined;
    const defaultMoves = [
      ...Utils.getStraightMoves(this.board, row, column, xrayPiece),
      ...Utils.getDiagonalMoves(this.board, row, column, xrayPiece),
    ];

    const clearInvalidFields = (move: number[]) => {
      const row = move[0];
      const column = move[1];
      const isRowValid = row >= 0 && row <= this.board.length - 1;
      const isColumnValid = column >= 0 && column <= this.board[0].length - 1;
      return isRowValid && isColumnValid && piece;
    };

    const validMoves = defaultMoves
      .filter(clearInvalidFields)
      .filter((move) =>
        this.clearFieldsWithObstacles(
          move,
          piece as string,
          getOnlyCaptureFields
        )
      );

    return validMoves;
  }

  knight(field: ChessField, getOnlyCaptureFields?: boolean) {
    const { column, row, piece } = field;

    const defaultMoves = [
      [row - 2, column - 1],
      [row - 2, column + 1],
      [row + 2, column - 1],
      [row + 2, column + 1],
      [row - 1, column - 2],
      [row + 1, column - 2],
      [row - 1, column + 2],
      [row + 1, column + 2],
    ];

    const clearInvalidFields = (move: number[]) => {
      const row = move[0];
      const column = move[1];
      const isRowValid = row >= 0 && row <= this.board.length - 1;
      const isColumnValid = column >= 0 && column <= this.board[0].length - 1;
      return isRowValid && isColumnValid && piece;
    };

    const validMoves = defaultMoves
      .filter(clearInvalidFields)
      .filter((move) =>
        this.clearFieldsWithObstacles(
          move,
          piece as string,
          getOnlyCaptureFields
        )
      );

    return validMoves;
  }

  getMovesByPiece(field: ChessField, getOnlyCaptureFields?: boolean) {
    const pieceType = field.piece?.split('-')[1];
    switch (pieceType) {
      case 'P':
        return this.pawn(field, getOnlyCaptureFields);
      case 'K':
        return this.king(field, getOnlyCaptureFields);
      case 'R':
        return this.rook(field, getOnlyCaptureFields);
      case 'B':
        return this.bishop(field, getOnlyCaptureFields);
      case 'Q':
        return this.queen(field, getOnlyCaptureFields);
      case 'N':
        return this.knight(field, getOnlyCaptureFields);

      default:
        return this.pawn(field, getOnlyCaptureFields);
    }
  }
  getMoves() {
    return this.getMovesByPiece(this.currentField);
  }

  getDominatedFieldsByCurrentPlayer() {
    const pieces = this.board
      .reduce((allFields, row) => [...allFields, ...row], [])
      .filter((field) => {
        const pieceColor = field.piece?.split('-')[0];
        return pieceColor === EColor[this.currentPlayer];
      });

    const fieldsDominatedByCurrentPlayer = pieces.reduce(
      (allPositions, field) => {
        const moves = this.getMovesByPiece(field, true);

        const positionsToAdd = moves.filter((move) => {
          return !allPositions
            .map((move) => move.join(','))
            .includes(move.join(','));
        });
        return [...allPositions, ...positionsToAdd];
      },
      [] as number[][]
    );

    console.log('fieldsDominatedByCurrentPlayer ' + EColor[this.currentPlayer]);
    console.table(
      this.board.map((row) => {
        const newRow = row.map((field) => {
          return fieldsDominatedByCurrentPlayer
            .map((move) => move.join(','))
            .includes(field.row + ',' + field.column)
            ? 'X'
            : field.piece || '';
        });
        return newRow;
      })
    );
    return fieldsDominatedByCurrentPlayer;
  }

  moveTo(targetField: ChessField) {
    let updatedBoard = PieceMovement.movePiece(
      this.board,
      this.currentField,
      targetField
    );

    const pieceType = this.currentField.piece?.split('-')[1];

    if (pieceType === EPiece.Pawn) {
      const lastMove = this.moveHistory[this.moveHistory.length - 1];
      if (lastMove) {
        const whitePlays = this.currentPlayer === 'white';
        const hasPieceBeside = lastMove.fieldTo.row === this.currentField.row;
        if (!hasPieceBeside) return updatedBoard;

        const hasPieceJumpedTwo =
          Math.abs(lastMove.fieldTo.row - lastMove.fieldFrom.row) == 2;

        if (!hasPieceJumpedTwo) return updatedBoard;

        const isEnPassant = targetField.row === lastMove.fieldTo.row + (whitePlays ? -1 : 1) && targetField.column === lastMove.fieldTo.column;

        if (isEnPassant) {
          updatedBoard[lastMove.fieldTo.row][lastMove.fieldTo.column].piece = null
        }
      }
    } else if (pieceType === EPiece.King) {
      const columnFrom = this.currentField.column;
      const columnTo = targetField.column;

      if (columnTo - columnFrom == 2) {
        const rook =
          this.board[this.currentField.row]?.[this.board[0].length - 1];
        const rookTargetField = { ...targetField, column: columnFrom + 1 };
        updatedBoard = PieceMovement.movePiece(
          updatedBoard,
          rook,
          rookTargetField
        );
      } else if (columnTo - columnFrom == -2) {
        const rook = this.board[this.currentField.row]?.[0];
        const rookTargetField = { ...targetField, column: columnFrom - 1 };
        updatedBoard = PieceMovement.movePiece(
          updatedBoard,
          rook,
          rookTargetField
        );
      }
    }
    return updatedBoard;
  }
}
