import { TestBed } from '@angular/core/testing';
import { BoardService } from '../services/board.service';
import { ChessField } from './chess-field';
import { Move } from './move';
import { PieceMovement } from './piece-movement';

describe('PieceMovement', () => {
  let boardService: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    boardService = TestBed.inject(BoardService);
  });

  it('should create an instance', () => {
    const board: ChessField[][] = boardService.createBoard(8,8)
    const currentField: ChessField = { column: 0, row: 0, piece: null, hasBeenMoved: false };
    const currentPlayer: 'black' | 'white' = 'white';
    const dominatedFields = {
      black: [],
      white: [],
    }
    const moveHistory: Move[] = []

    expect(new PieceMovement(board,currentField, currentPlayer, moveHistory, dominatedFields)).toBeTruthy();
  });

  it('should not let the king step further back along the line of a checking rook', () => {
    const board: ChessField[][] = boardService.createBoard(8, 8);
    const rookField: ChessField = { ...board[0][4], piece: 'B-R' };
    const kingField: ChessField = { ...board[4][4], piece: 'W-K' };
    board[0][4] = rookField;
    board[4][4] = kingField;

    const blackPieceMovement = new PieceMovement(board, rookField, 'black', [], { black: [], white: [] });
    const dominatedByBlack = blackPieceMovement.getDominatedFieldsByCurrentPlayer();

    const whitePieceMovement = new PieceMovement(board, kingField, 'white', [], { black: dominatedByBlack, white: [] });
    const kingMoves = whitePieceMovement.getMoves();

    // the square directly behind the king, still on the rook's file, must stay off-limits
    expect(kingMoves).not.toContain([5, 4]);
    // stepping sideways, out of the rook's line, is still legal
    expect(kingMoves).toContain([4, 3]);
    expect(kingMoves).toContain([4, 5]);
  });

  it('should not let the king step further back along the line of a checking bishop', () => {
    const board: ChessField[][] = boardService.createBoard(8, 8);
    const bishopField: ChessField = { ...board[1][1], piece: 'B-B' };
    const kingField: ChessField = { ...board[4][4], piece: 'W-K' };
    board[1][1] = bishopField;
    board[4][4] = kingField;

    const blackPieceMovement = new PieceMovement(board, bishopField, 'black', [], { black: [], white: [] });
    const dominatedByBlack = blackPieceMovement.getDominatedFieldsByCurrentPlayer();

    const whitePieceMovement = new PieceMovement(board, kingField, 'white', [], { black: dominatedByBlack, white: [] });
    const kingMoves = whitePieceMovement.getMoves();

    expect(kingMoves).not.toContain([5, 5]);
  });

  it('should allow the king to capture an undefended checking piece', () => {
    const board: ChessField[][] = boardService.createBoard(8, 8);
    const queenField: ChessField = { ...board[3][4], piece: 'B-Q' };
    const kingField: ChessField = { ...board[4][4], piece: 'W-K' };
    board[3][4] = queenField;
    board[4][4] = kingField;

    const blackPieceMovement = new PieceMovement(board, queenField, 'black', [], { black: [], white: [] });
    const dominatedByBlack = blackPieceMovement.getDominatedFieldsByCurrentPlayer();

    const whitePieceMovement = new PieceMovement(board, kingField, 'white', [], { black: dominatedByBlack, white: [] });
    const kingMoves = whitePieceMovement.getMoves();

    expect(kingMoves).toContain([3, 4]);
  });

  it('should not allow the king to capture a checking piece that is defended', () => {
    const board: ChessField[][] = boardService.createBoard(8, 8);
    const defendingRookField: ChessField = { ...board[1][4], piece: 'B-R' };
    const queenField: ChessField = { ...board[3][4], piece: 'B-Q' };
    const kingField: ChessField = { ...board[4][4], piece: 'W-K' };
    board[1][4] = defendingRookField;
    board[3][4] = queenField;
    board[4][4] = kingField;

    const blackPieceMovement = new PieceMovement(board, queenField, 'black', [], { black: [], white: [] });
    const dominatedByBlack = blackPieceMovement.getDominatedFieldsByCurrentPlayer();

    const whitePieceMovement = new PieceMovement(board, kingField, 'white', [], { black: dominatedByBlack, white: [] });
    const kingMoves = whitePieceMovement.getMoves();

    expect(kingMoves).not.toContain([3, 4]);
  });
});
