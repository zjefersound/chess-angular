import { Component, OnInit } from '@angular/core';
import { ChessField } from 'src/app/common/chess-field';
import { BoardService } from 'src/app/services/board.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit {
  size = 8;
  board: ChessField[][] = [];
  selectedField: ChessField | null = null;
  possibleMoves: string[] = [];
  currentPlayer: 'black' | 'white' = 'white';
  rotateBoard: boolean = false;

  constructor(private boardService: BoardService) {}

  ngOnInit(): void {
    this.board = this.boardService.createBoard(this.size, this.size);
    this.board = this.boardService.fillBoard(this.board);
    console.log(this.board);
  }

  unselectField() {
    this.selectedField = null;
    this.possibleMoves = [];
  }

  selectField(field: ChessField) {
    const hasSelectedSameField =
      this.selectedField &&
      field.column == this.selectedField.column &&
      field.row == this.selectedField.row;

    if (hasSelectedSameField) {
      this.unselectField();
      return;
    }

    const isPlaying =
      this.possibleMoves.length &&
      this.possibleMoves.includes(field.row + ',' + field.column);

    if (isPlaying) {
      this.board = this.boardService.movePiece(
        this.board,
        this.selectedField as ChessField,
        this.currentPlayer,
        field
      );
      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
      this.unselectField();
      return;
    }

    this.selectedField = field;
    this.possibleMoves = this.boardService
      .getMoves(this.board, field, this.currentPlayer)
      .map((move) => move.join(','));
  }
}
