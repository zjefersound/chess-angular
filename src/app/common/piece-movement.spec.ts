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

  it('should not allow the king to move further away along the line of attack of a checking rook, bishop, or queen', () => {
    let board: ChessField[][] = boardService.createBoard(8, 8);
    board[5][4] = { row: 5, column: 4, piece: 'W-K', hasBeenMoved: true };
    board[2][3] = { row: 2, column: 3, piece: 'B-R', hasBeenMoved: false };

    board = boardService.movePiece(board, board[2][3], 'black', board[2][4]);

    const rookCheckMoves = boardService
      .getMoves(board, board[5][4], 'white')
      .map((move) => move.join(','));
    expect(rookCheckMoves).not.toContain('6,4');
    expect(rookCheckMoves).not.toContain('4,4');
    expect(rookCheckMoves).toContain('5,3');

    board = boardService.createBoard(8, 8);
    board[5][4] = { row: 5, column: 4, piece: 'W-K', hasBeenMoved: true };
    board[1][2] = { row: 1, column: 2, piece: 'B-B', hasBeenMoved: false };

    board = boardService.movePiece(board, board[1][2], 'black', board[2][1]);

    const bishopCheckMoves = boardService
      .getMoves(board, board[5][4], 'white')
      .map((move) => move.join(','));
    expect(bishopCheckMoves).not.toContain('6,5');
    expect(bishopCheckMoves).not.toContain('4,3');
    expect(bishopCheckMoves).toContain('5,3');
  });

  it('should allow the king to capture an undefended checking piece', () => {
    let board: ChessField[][] = boardService.createBoard(8, 8);
    board[5][4] = { row: 5, column: 4, piece: 'W-K', hasBeenMoved: true };
    board[4][3] = { row: 4, column: 3, piece: 'B-R', hasBeenMoved: false };

    board = boardService.movePiece(board, board[4][3], 'black', board[4][4]);

    const moves = boardService
      .getMoves(board, board[5][4], 'white')
      .map((move) => move.join(','));
    expect(moves).toContain('4,4');
    expect(moves).not.toContain('6,4');
  });

  it('should not allow the king to capture a checking piece defended by another enemy piece behind it', () => {
    let board: ChessField[][] = boardService.createBoard(8, 8);
    board[5][4] = { row: 5, column: 4, piece: 'W-K', hasBeenMoved: true };
    board[1][4] = { row: 1, column: 4, piece: 'B-Q', hasBeenMoved: false };
    board[4][3] = { row: 4, column: 3, piece: 'B-R', hasBeenMoved: false };

    board = boardService.movePiece(board, board[4][3], 'black', board[4][4]);

    const moves = boardService
      .getMoves(board, board[5][4], 'white')
      .map((move) => move.join(','));
    expect(moves).not.toContain('4,4');
    expect(moves).not.toContain('6,4');
  });
});
