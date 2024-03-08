import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "./components/game-frame";

@customElement("app-root")
export class AppRoot extends LitElement {
  render() {
    return html`
      <h1>Canvas 2048</h1>
      <game-frame board-width="4" board-height="4"></game-frame>
    `;
  }

  static styles = css`
    game-frame {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
