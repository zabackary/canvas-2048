import "@material/web/button/filled-tonal-button";
import "@material/web/checkbox/checkbox";
import { MdCheckbox } from "@material/web/checkbox/checkbox";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Ref, createRef, ref } from "lit/directives/ref.js";
import "./components/game-frame";
import { GameFrame } from "./components/game-frame";

@customElement("app-root")
export class AppRoot extends LitElement {
  gameFrameRef: Ref<GameFrame> = createRef();

  @state()
  score = 0;
  @state()
  tiltingAnimation = false;
  @state()
  classicTheme = true;

  render() {
    return html`
      <h1>Canvas 2048</h1>
      <p class="buttons">
        <md-filled-tonal-button @click=${this.resetGame}
          >New game</md-filled-tonal-button
        >
        <span class="score">${this.score}</span>
      </p>
      <game-frame
        ${ref(this.gameFrameRef)}
        board-width="4"
        board-height="4"
        ?tilting-animation=${this.tiltingAnimation}
        @scoreChanged=${(e: CustomEvent<number>) => {
          this.score = e.detail;
        }}
      ></game-frame>
      <p>
        <label>
          <md-checkbox
            ?checked=${this.tiltingAnimation}
            @change=${(e: Event) => {
              this.tiltingAnimation =
                (e.currentTarget as MdCheckbox)?.checked === true;
            }}
          ></md-checkbox>
          Tilting animation
        </label>
        <!--
        <label>
          <md-checkbox
            ?checked=${this.classicTheme}
            @change=${(e: Event) => {
          this.classicTheme = (e.currentTarget as MdCheckbox)?.checked === true;
        }}
          ></md-checkbox>
          Classic theme
        </label>
        -->
      </p>
    `;
  }

  private resetGame() {
    this.gameFrameRef.value?.reset();
  }

  static styles = css`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 2em;
      align-items: center;
    }
    game-frame {
      flex-grow: 1;
    }
    @media (min-height: 800px) {
      game-frame {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
    }
    md-checkbox {
      margin-right: 1em;
    }
    label {
      margin-right: 2em;
    }
    .buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      .score {
        display: flex;
        align-items: center;
        border-radius: 9999px;
        border: 1px solid var(--md-sys-color-outline);
        padding: 4px 24px;
        font-size: 18px;
        height: 30px;
        user-select: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
