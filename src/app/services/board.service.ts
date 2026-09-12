import { Injectable } from '@angular/core';
import { ChessField } from '../common/chess-field';
import { Move } from '../common/move';
import { PieceMovement } from '../common/piece-movement';
import { EColor, EPiece } from '../models/app-enums.model';
@Injectable({
  providedIn: 'root',
})

export class BoardService {
  moveHistory: Move[] = []
  dominatedFields: IDominatedFields = {
    black: [],
    white: [],
  }

  constructor() {}

  createBoard(rows: number, columns: number) {
    this.dominatedFields = {
      black: [],
      white: [],
    };
    this.moveHistory = [];
    return Array(rows)
      .fill(0)
      .map((_, row) => {
        return Array(columns)
          .fill(0)
          .map((_, column) => {
            return {
              row,
              column,
              hasBeenMoved: false,
              piece: null,
            };
          });
      });
  }

  fillPieces(row: ChessField[], color: 'white' | 'black') {
    const pieces = [
      EPiece.Rook,
      EPiece.Knight,
      EPiece.Bishop,
      EPiece.Queen,
      EPiece.King,
      EPiece.Bishop,
      EPiece.Knight,
      EPiece.Rook,
    ];
    return row.map((field, index) => {
      return {
        ...field,
        piece: pieces[index] ? EColor[color] + '-' + pieces[index] : null,
      };
    });
  }

  fillPawns(row: ChessField[], color: 'black' | 'white') {
    const piece = EColor[color] + '-' + EPiece.Pawn;
    return row.map((field) => {
      return {
        ...field,
        piece,
      };
    });
  }

  fillBoard(board: ChessField[][]) {
    const filledBoard: ChessField[][] = board.map((row, index) => {
      if (index == 0) return this.fillPieces(row, 'black');
      else if (index == 0 + 1) return this.fillPawns(row, 'black');
      else if (index == board.length - 1) return this.fillPieces(row, 'white');
      else if (index == board.length - 1 - 1)
        return this.fillPawns(row, 'white');
      else return row;
    });
    return filledBoard;
  }

  getMoves(
    board: ChessField[][],
    currentField: ChessField,
    currentPlayer: 'black' | 'white'
  ) {
    const pieceMovement = new PieceMovement(board, currentField, currentPlayer, this.moveHistory, this.dominatedFields);
    return pieceMovement.getMoves();
  }

  movePiece(
    board: ChessField[][],
    currentField: ChessField,
    currentPlayer: 'black' | 'white',
    targetField: ChessField
  ) {
    const pieceMovement = new PieceMovement(board, currentField, currentPlayer, this.moveHistory, this.dominatedFields);
    const updatedBoard = pieceMovement.moveTo(targetField);
    this.moveHistory = this.moveHistory.concat({ fieldFrom: currentField, fieldTo: targetField})

    pieceMovement.setBoard(updatedBoard);
    this.dominatedFields[currentPlayer] = pieceMovement.getDominatedFieldsByCurrentPlayer();
    return updatedBoard;
  }
}

interface IDominatedFields {
  white: number[][];
  black: number[][];
}
