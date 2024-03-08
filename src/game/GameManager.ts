import renderTile, { renderTileBackground } from "./renderer/renderTile";

const ANIMATION_DURATION = 300;
const MSG_ANIMATION_DURATION = 1000;
const MSG_PADDING = 50;

let nextId = 0;
const defaultInterpolator = (from: number, to: number, fraction: number) =>
  from + Math.sin((fraction * Math.PI) / 2) * (to - from);

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export enum MoveResult {
  SUCCESS,
  GAME_OVER,
  INVALID,
  STILL_ANIMATING,
}

class GameTile {
  constructor(
    public x: number,
    public y: number,
    public value: number,
    public id: number,
    public interpolatedScale = 1,
    public mergedTileId: number | null = null
  ) {}
}

class GameState {
  public static new(width: number, height: number) {
    return new GameState([], width, height).createTile()!;
  }

  private constructor(
    public tiles: GameTile[],
    public width: number,
    public height: number
  ) {}

  /**
   * Gets the tile at the given coors.
   * @param tx The x coor
   * @param ty The y coor
   * @returns The tile, or null if it's empty
   */
  private tileAt(tx: number, ty: number) {
    return this.tiles.find((value) => value.x === tx && value.y === ty) ?? null;
  }

  /**
   * Spawns a new tile randomly on the grid, and returns the new state.
   * @returns The new game state, or undefined if the grid is full.
   */
  createTile(secondPowerProbability = 0.1): GameState | undefined {
    const possibleTiles = [];
    for (let ix = 0; ix < this.width; ix++) {
      for (let iy = 0; iy < this.height; iy++) {
        if (!this.tileAt(ix, iy)) {
          possibleTiles.push(
            new GameTile(
              ix,
              iy,
              Math.random() > secondPowerProbability ? 1 : 2,
              nextId++
            )
          );
        }
      }
    }
    if (possibleTiles.length === 0) return undefined;
    const newTile =
      possibleTiles[Math.floor(Math.random() * possibleTiles.length)];
    return new GameState([...this.tiles, newTile], this.width, this.height);
  }

  /**
   * Shifts tiles towards `direction`, and returns the new state.
   * @returns The new game state
   */
  shiftTiles(direction: Direction): GameState {
    const delta =
      direction === Direction.UP || direction === Direction.LEFT ? 1 : -1;
    if (direction === Direction.UP || direction === Direction.DOWN) {
      const newTiles: GameTile[] = [];
      const start = direction === Direction.UP ? 0 : this.height - 1;
      for (let ix = 0; ix < this.width; ix++) {
        let firstEmpty = start;
        for (let iy = start; iy < this.height && iy >= 0; iy += delta) {
          const tile = this.tileAt(ix, iy);
          if (tile) {
            const possibleCombineTile = newTiles.at(-1);
            if (
              possibleCombineTile &&
              possibleCombineTile.y === firstEmpty - delta &&
              possibleCombineTile.value === tile.value &&
              possibleCombineTile.mergedTileId === null
            ) {
              newTiles[newTiles.length - 1].mergedTileId = tile.id;
              newTiles[newTiles.length - 1].value += 1;
            } else {
              newTiles.push(new GameTile(ix, firstEmpty, tile.value, tile.id));
              firstEmpty += delta;
            }
          }
        }
      }
      return new GameState(newTiles, this.width, this.height);
    } else if (direction === Direction.LEFT || direction === Direction.RIGHT) {
      const newTiles: GameTile[] = [];
      const start = direction === Direction.LEFT ? 0 : this.width - 1;
      for (let iy = 0; iy < this.height; iy++) {
        let firstEmpty = start;
        for (let ix = start; ix < this.width && ix >= 0; ix += delta) {
          const tile = this.tileAt(ix, iy);
          if (tile) {
            const possibleCombineTile = newTiles.at(-1);
            if (
              possibleCombineTile &&
              possibleCombineTile.x === firstEmpty - delta &&
              possibleCombineTile.value === tile.value &&
              possibleCombineTile.mergedTileId === null
            ) {
              newTiles[newTiles.length - 1].mergedTileId = tile.id;
              newTiles[newTiles.length - 1].value += 1;
            } else {
              newTiles.push(new GameTile(firstEmpty, iy, tile.value, tile.id));
              firstEmpty += delta;
            }
          }
        }
      }
      return new GameState(newTiles, this.width, this.height);
    } else {
      throw new Error("impossible!");
    }
  }

  equals(rhs: GameState): boolean {
    if (this.tiles.length !== rhs.tiles.length) return false;
    const rhsIds = rhs.tiles.map((tile) => tile.id);
    for (const tile of this.tiles) {
      const i = rhsIds.indexOf(tile.id);
      if (i < 0) return false;
      if (
        rhs.tiles[i].x !== tile.x ||
        rhs.tiles[i].y !== tile.y ||
        rhs.tiles[i].value !== tile.value
      )
        return false;
    }
    return true;
  }

  /**
   * Returns `GameTile`s with fractional `x` and `y` values interpolated from
   */
  interpolateFrom(
    oldState: GameState,
    fraction: number,
    interpolate = defaultInterpolator
  ): GameState {
    const tileMoveProgress = Math.min(1, fraction * (1 / 0.7));
    const tileGrowProgress = Math.max(
      0,
      Math.min(1, (fraction - 0.7) * (1 / 0.3))
    );
    const tiles = [];
    for (const mergingTile of this.tiles.filter(
      (tile) => tile.mergedTileId !== null
    )) {
      const oldMergedTile = oldState.tiles.find(
        (candidate) => candidate.id === mergingTile.mergedTileId
      );
      if (!oldMergedTile)
        throw new Error("new tile has mergedTileId of nonexistent tile");
      tiles.push(
        new GameTile(
          interpolate(oldMergedTile.x, mergingTile.x, tileMoveProgress),
          interpolate(oldMergedTile.y, mergingTile.y, tileMoveProgress),
          oldMergedTile.value,
          oldMergedTile.id,
          interpolate(1, 0.7, tileMoveProgress)
        )
      );
    }
    for (const newTile of this.tiles) {
      // Try to find the matching old tile
      const oldTile = oldState.tiles.find(
        (candidate) => candidate.id === newTile.id
      );
      if (oldTile && newTile.mergedTileId !== null) {
        // Interpolate the x, y and scale
        tiles.push(
          new GameTile(
            interpolate(oldTile.x, newTile.x, tileMoveProgress),
            interpolate(oldTile.y, newTile.y, tileMoveProgress),
            newTile.value,
            newTile.id,
            tileMoveProgress < 0.8
              ? interpolate(1, 1.2, tileMoveProgress)
              : interpolate(1.2, 1, tileGrowProgress)
          )
        );
      } else if (oldTile) {
        // Interpolate the x and y
        tiles.push(
          new GameTile(
            interpolate(oldTile.x, newTile.x, tileMoveProgress),
            interpolate(oldTile.y, newTile.y, tileMoveProgress),
            newTile.value,
            newTile.id
          )
        );
      } else {
        // Animate the zoom
        tiles.push(
          new GameTile(
            newTile.x,
            newTile.y,
            newTile.value,
            newTile.id,
            interpolate(0, 1, tileGrowProgress)
          )
        );
      }
    }
    return new GameState(tiles, this.width, this.height);
  }

  validate() {
    throw new Error("not implemented");
  }
}

export default class GameManager {
  state: GameState;
  private oldState: GameState | undefined;
  private animationInterpolationState = 0;
  private noMovesAnimationInterpolationState = 0;
  public canvasWidth: number = 0;
  public canvasHeight: number = 0;
  private tileSize: number = 0;
  private backgroundWidth: number = 0;
  private backgroundHeight: number = 0;
  private noMoves: boolean = false;

  constructor(
    private ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    public boardWidth: number,
    public boardHeight: number,
    private scheduleUpdate: () => void,
    public tilePadding = 5,
    public secondPowerProbability = 0.1
  ) {
    this.state = GameState.new(boardWidth, boardHeight);
    this.updateCanvasDimensions(canvasWidth, canvasHeight);
  }

  updateCanvasDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    const xTileSize =
      (width - this.tilePadding) / this.boardWidth - this.tilePadding;
    const yTileSize =
      (height - this.tilePadding) / this.boardHeight - this.tilePadding;
    this.tileSize = Math.min(xTileSize, yTileSize);
    this.backgroundWidth =
      (this.tileSize + this.tilePadding) * this.boardWidth + this.tilePadding;
    this.backgroundHeight =
      (this.tileSize + this.tilePadding) * this.boardHeight + this.tilePadding;
    this.scheduleUpdate();
  }

  render(msSinceLastRender: number) {
    let updateScheduled = false;
    if (this.animationInterpolationState < 1) {
      if (this.animationInterpolationState === 0)
        this.animationInterpolationState += Number.MIN_VALUE;
      else
        this.animationInterpolationState +=
          msSinceLastRender / ANIMATION_DURATION;
      this.scheduleUpdate();
      updateScheduled = true;
    }
    if (this.noMoves && this.noMovesAnimationInterpolationState < 1) {
      if (this.noMovesAnimationInterpolationState === 0)
        this.noMovesAnimationInterpolationState += Number.MIN_VALUE;
      else
        this.noMovesAnimationInterpolationState +=
          msSinceLastRender / MSG_ANIMATION_DURATION;
      if (!updateScheduled) this.scheduleUpdate();
    }
    if (this.animationInterpolationState > 1) {
      this.animationInterpolationState = 1;
    }
    if (this.noMovesAnimationInterpolationState > 1) {
      this.noMovesAnimationInterpolationState = 1;
    }
    const currentState =
      this.oldState && this.animationInterpolationState < 1
        ? this.state.interpolateFrom(
            this.oldState,
            this.animationInterpolationState
          )
        : this.state;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.beginPath();
    this.ctx.roundRect(
      0,
      0,
      this.backgroundWidth,
      this.backgroundHeight,
      this.tilePadding
    );
    this.ctx.fillStyle = "#BBADA0";
    this.ctx.fill();
    for (let tx = 0; tx < this.boardWidth; tx++) {
      for (let ty = 0; ty < this.boardHeight; ty++) {
        renderTileBackground(
          this.ctx,
          tx,
          ty,
          this.tileSize,
          1,
          "#CDC1B4",
          this.tilePadding
        );
      }
    }
    for (const tile of currentState.tiles) {
      renderTile(
        this.ctx,
        this.tileSize,
        tile.x,
        tile.y,
        tile.interpolatedScale,
        tile.value,
        this.tilePadding
      );
    }
    if (this.noMoves) {
      this.ctx.globalAlpha = defaultInterpolator(
        0,
        0.5,
        this.noMovesAnimationInterpolationState
      );
      this.ctx.beginPath();
      this.ctx.roundRect(
        0,
        0,
        this.backgroundWidth,
        this.backgroundHeight,
        this.tilePadding
      );
      this.ctx.fillStyle = "#F9F6F2";
      this.ctx.fill();
      this.ctx.globalAlpha = defaultInterpolator(
        0,
        1,
        this.noMovesAnimationInterpolationState
      );
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#776E65";
      this.ctx.font = `bold ${this.canvasHeight}px Arial`;
      const measured = this.ctx.measureText("Game over!");
      const width =
        measured.actualBoundingBoxRight + measured.actualBoundingBoxLeft;
      const height =
        measured.actualBoundingBoxAscent + measured.actualBoundingBoxDescent;
      let sizeFactor = 1;
      if (width / height > this.canvasWidth / this.canvasHeight) {
        sizeFactor = (this.canvasWidth - MSG_PADDING * 2) / width;
      } else {
        sizeFactor = (this.canvasHeight - MSG_PADDING * 2) / height;
      }
      this.ctx.font = `bold ${this.canvasHeight * sizeFactor}px Arial`;
      this.ctx.fillText(
        "Game over!",
        this.canvasWidth / 2,
        this.canvasHeight / 2,
        this.canvasWidth
      );
    }
    this.ctx.globalAlpha = 1;
  }

  handleKeyPressed(direction: Direction): MoveResult {
    if (this.animationInterpolationState !== 1) {
      // Animation in progress; don't accept the new event
      return MoveResult.STILL_ANIMATING;
    }
    if (this.noMoves) {
      return MoveResult.GAME_OVER;
    }
    this.oldState = this.state;
    const shiftedState = this.oldState.shiftTiles(direction);
    if (shiftedState.equals(this.oldState)) {
      return MoveResult.INVALID;
    }
    const newState = shiftedState.createTile(this.secondPowerProbability);
    if (!newState) {
      return MoveResult.GAME_OVER;
    } else {
      this.state = newState;
      this.animationInterpolationState = 0;
      this.scheduleUpdate();
      if (
        [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT].every(
          (move) => this.state.shiftTiles(move).equals(this.state)
        )
      ) {
        this.noMoves = true;
        return MoveResult.GAME_OVER;
      }
    }
    return MoveResult.SUCCESS;
  }
}
