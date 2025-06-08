import Phaser from 'phaser';
import { GRID_SIZE, TILE_SIZE, CANDY_TYPES, COLORS } from './constants';

type Cell = {
  type: number;
  rect: Phaser.GameObjects.Rectangle;
};

export default class Match3Scene extends Phaser.Scene {
  private board: Cell[][] = [];
  private selected: { row: number; col: number } | null = null;

  constructor() {
    super('Match3Scene');
  }

  create() {
    this.createBoard();
    this.input.on('pointerdown', this.handleInput, this);
  }

  private createBoard() {
    for (let row = 0; row < GRID_SIZE; row++) {
      const rowArr: Cell[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const type = Phaser.Math.Between(0, CANDY_TYPES - 1);
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const rect = this.add
          .rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4, COLORS[type])
          .setInteractive();
        rowArr.push({ type, rect });
      }
      this.board.push(rowArr);
    }
  }

  private handleInput(pointer: Phaser.Input.Pointer) {
    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    const cell = this.board[row][col];
    if (!this.selected) {
      this.selected = { row, col };
      cell.rect.setStrokeStyle(2, 0xffffff);
    } else {
      const { row: r, col: c } = this.selected;
      const selectedCell = this.board[r][c];
      selectedCell.rect.setStrokeStyle();
      if (Math.abs(r - row) + Math.abs(c - col) === 1) {
        this.swap(r, c, row, col);
      }
      this.selected = null;
    }
  }

  private swap(r1: number, c1: number, r2: number, c2: number) {
    const cell1 = this.board[r1][c1];
    const cell2 = this.board[r2][c2];
    [cell1.type, cell2.type] = [cell2.type, cell1.type];
    cell1.rect.fillColor = COLORS[cell1.type];
    cell2.rect.fillColor = COLORS[cell2.type];
  }
}
