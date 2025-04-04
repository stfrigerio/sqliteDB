import { DBService } from "../dbService";

export class HabitCounter extends HTMLElement {
	private habit: string;
	private date: string;
	private count = 0;

	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });

		this.habit = this.getAttribute("habit") ?? "";
		this.date = this.getAttribute("date") ?? new Date().toISOString().split("T")[0];

		const wrapper = document.createElement("div");
		wrapper.className = "habit-wrapper";

		const label = document.createElement("span");
		label.className = "habit-label";
		label.textContent = `🚬 ${this.habit}:`;

		const minus = document.createElement("button");
		minus.textContent = "−";
		minus.onclick = () => this.updateValue(-1);

		const plus = document.createElement("button");
		plus.textContent = "+";
		plus.onclick = () => this.updateValue(1);

		const valueDisplay = document.createElement("span");
		valueDisplay.className = "habit-value";
		valueDisplay.textContent = String(this.count);

		wrapper.append(label, minus, valueDisplay, plus);
		shadow.append(wrapper);

		this.loadValue().then(value => {
			this.count = value;
			valueDisplay.textContent = String(this.count);
		});

		const style = document.createElement("style");
		style.textContent = `
			.habit-wrapper {
				display: flex;
				align-items: center;
				gap: 0.5em;
				font-family: var(--font-text);
			}
			button {
				background: var(--background-secondary);
				border: none;
				padding: 2px 8px;
				cursor: pointer;
				font-weight: bold;
				border-radius: 4px;
			}
			button:hover {
				background: var(--interactive-accent-hover);
				color: var(--text-on-accent);
			}
			.habit-value {
				min-width: 2ch;
				text-align: center;
			}
		`;
		shadow.appendChild(style);
	}

	private async loadValue(): Promise<number> {
		// ⚠️ Replace this with actual DBService call
		// For now, just simulate with 5
		return 5;
	}

	private async updateValue(delta: number) {
		this.count = Math.max(0, this.count + delta);
		// this.shadowRoot?.querySelector(".habit-value")!.textContent = String(this.count);

		// ⚠️ Write to DB here, for now just console.log
		console.log(`[HabitCounter] Updated ${this.habit} on ${this.date} to`, this.count);
	}
}

customElements.define("habit-counter", HabitCounter);
