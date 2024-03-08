import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ref } from "lit/directives/ref.js";
import GameManager, { Direction } from "../game/GameManager";

/**
 * The game itself, rendered by <canvas>
 */
@customElement("game-frame")
export class GameFrame extends LitElement {
  @state()
  protected canvasWidth = 0;
  @state()
  protected canvasHeight = 0;

  @property({ attribute: "board-width", type: Number })
  boardWidth = 4;
  @property({ attribute: "board-height", type: Number })
  boardHeight = 4;
  @property({ attribute: "second-power-probability", type: Number })
  secondPowerProbability = 0.1;

  render() {
    const calculatedWidth = 140 * this.boardWidth;
    const calculatedHeight =
      calculatedWidth * (this.boardHeight / this.boardWidth);
    if (
      calculatedWidth !== this.canvasWidth ||
      calculatedHeight !== this.canvasHeight
    ) {
      this.canvasWidth = calculatedWidth;
      this.canvasHeight = calculatedHeight;
      if (this.gameManager) {
        this.gameManager.updateCanvasDimensions(
          calculatedWidth,
          calculatedHeight
        );
      }
    }
    return html`<canvas
      ${ref((element) => {
        if (element && element instanceof HTMLCanvasElement) {
          this.initialRenderCanvas(element);
        }
      })}
      width=${this.canvasWidth}
      height=${this.canvasHeight}
    ></canvas>`;
  }

  gameManager: GameManager | undefined;

  private initialRenderCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("failed to get context of canvas (2d)");
    if (!this.gameManager) {
      let lastUpdate = new Date().getTime();
      this.gameManager = new GameManager(
        ctx,
        this.canvasWidth,
        this.canvasHeight,
        this.boardWidth,
        this.boardHeight,
        () => {
          requestAnimationFrame(() => {
            const now = new Date().getTime();
            this.gameManager?.render(now - lastUpdate);
            lastUpdate = now;
          });
        },
        this.canvasWidth / (15 * this.boardWidth),
        this.secondPowerProbability
      );
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this.handleKeyPress.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.handleKeyPress.bind(this));
    window.removeEventListener("resize", this.handleResize.bind(this));
  }

  private handleResize() {
    this.requestUpdate();
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (this.gameManager) {
      switch (e.key) {
        case "ArrowUp":
          this.gameManager.handleKeyPressed(Direction.UP);
          break;
        case "ArrowDown":
          this.gameManager.handleKeyPressed(Direction.DOWN);
          break;
        case "ArrowLeft":
          this.gameManager.handleKeyPressed(Direction.LEFT);
          break;
        case "ArrowRight":
          this.gameManager.handleKeyPressed(Direction.RIGHT);
          break;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "game-frame": GameFrame;
  }
}
