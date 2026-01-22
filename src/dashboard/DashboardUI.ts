import type { StatsResponseMessage } from "../types/ws-messages";
import type { HypeChatSettings } from "../types/settings";
import type { SidebarManager } from "./SidebarManager";

type ButtonCallback = () => void;
type SliderCallback = (value: number) => void;

export class DashboardUI {
  private statusEl: HTMLElement;
  private statusPillEl: HTMLElement;
  private statsEl: HTMLElement;
  private logEl: HTMLElement;
  private volumeSliderEl: HTMLInputElement;
  private volumeValueEl: HTMLElement;
  private stabilitySliderEl: HTMLInputElement;
  private stabilityValueEl: HTMLElement;
  // HypeChat slider elements
  private messageRateSliderEl: HTMLElement | null = null;
  private minRateValueEl: HTMLElement | null = null;
  private maxRateValueEl: HTMLElement | null = null;
  private burstCountSliderEl: HTMLElement | null = null;
  private minBurstValueEl: HTMLElement | null = null;
  private maxBurstValueEl: HTMLElement | null = null;
  private lerpFactorSliderEl: HTMLInputElement | null = null;
  private lerpFactorValueEl: HTMLElement | null = null;
  // HypeChat current values + change callback
  private currentMinMessageRate: number = 200;
  private currentMaxMessageRate: number = 500;
  private currentMinBurstCount: number = 1;
  private currentMaxBurstCount: number = 3;
  private currentLerpFactor: number = 0.5;
  private hypeChatChangeHandler: (() => void) | null = null;

  private buttonCallbacks = new Map<string, ButtonCallback>();
  private sliderCallbacks = new Map<string, SliderCallback>();

  constructor() {
    this.statusEl = this.getEl("status");
    this.statusPillEl = this.getEl("statusPill");
    this.statsEl = this.getEl("stats");
    this.logEl = this.getEl("log");
    this.volumeSliderEl = this.getEl("volumeSlider") as HTMLInputElement;
    this.volumeValueEl = this.getEl("volumeValue");
    this.stabilitySliderEl = this.getEl("stabilitySlider") as HTMLInputElement;
    this.stabilityValueEl = this.getEl("stabilityValue");
    // Optional HypeChat UI elements (may not exist in all builds)
    this.messageRateSliderEl = document.getElementById("messageRateSlider");
    this.minRateValueEl = document.getElementById("minRateValue");
    this.maxRateValueEl = document.getElementById("maxRateValue");
    this.burstCountSliderEl = document.getElementById("burstCountSlider");
    this.minBurstValueEl = document.getElementById("minBurstValue");
    this.maxBurstValueEl = document.getElementById("maxBurstValue");
    this.lerpFactorSliderEl = document.getElementById(
      "lerpFactorSlider",
    ) as HTMLInputElement | null;
    this.lerpFactorValueEl = document.getElementById("lerpFactorValue");

    this.initializeSliders();
    this.initializeHypeChatSlider();
  }

  private getEl(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el;
  }

  private initializeSliders(): void {
    this.volumeSliderEl.addEventListener("input", () => {
      const value = Number(this.volumeSliderEl.value);
      this.volumeValueEl.textContent = `${value}%`;
      const callback = this.sliderCallbacks.get("volume");
      if (callback) callback(value);
    });

    this.stabilitySliderEl.addEventListener("input", () => {
      const value = Number(this.stabilitySliderEl.value);
      this.stabilityValueEl.textContent = `${value}%`;
      const callback = this.sliderCallbacks.get("stability");
      if (callback) callback(value);
    });

    // Lerp factor: update display only (no controller wiring)
    if (this.lerpFactorSliderEl && this.lerpFactorValueEl) {
      const update = () => {
        const v = Number(this.lerpFactorSliderEl!.value);
        this.currentLerpFactor = v;
        this.lerpFactorValueEl!.textContent = v.toFixed(2);
        if (this.hypeChatChangeHandler) this.hypeChatChangeHandler();
      };
      this.lerpFactorSliderEl.addEventListener("change", update);
      update();
    }
  }

  log(msg: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logEl.textContent += `${timestamp} ${msg}\n`;
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  setConnected(connected: boolean): void {
    this.statusEl.textContent = connected ? "Connected" : "Disconnected";
    this.statusPillEl.classList.toggle("connected", connected);

    // Enable/disable all registered buttons
    for (const buttonId of this.buttonCallbacks.keys()) {
      const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
      if (btn) btn.disabled = !connected;
    }

    if (!connected) {
      this.statsEl.textContent = "No stats (disconnected)";
    }
  }

  updateStats(stats: StatsResponseMessage["stats"]): void {
    const fps = stats.fps;
    const frameMs = stats.frameMsAvg;
    const activeScenes = stats.activeScenes;
    const wsState = stats.wsReadyState;
    const ts = stats.timestamp;
    const memory = stats.memory;

    const lines = [
      `FPS: ${Number.isFinite(fps) ? fps.toFixed(1) : "-"}`,
      `Frame ms (EMA): ${Number.isFinite(frameMs) ? frameMs.toFixed(2) : "-"}`,
      `Active scenes: ${activeScenes ?? "-"}`,
      `Overlay WS state: ${wsState ?? "-"}`,
      `Memory: ${memory.active} active (${memory.totalCreated} created, ${memory.totalFinished} finished)`,
      `Sampled at: ${ts ? new Date(ts).toLocaleTimeString() : "-"}`,
      "Top elements:",
    ];

    // Add top element types and pad to 5 lines for consistent spacing
    if (memory.byClass && Object.keys(memory.byClass).length > 0) {
      const topClasses = Object.entries(memory.byClass)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `  ${name}: ${count}`);
      lines.push(...topClasses);
      const padCount = 5 - topClasses.length;
      if (padCount > 0) {
        lines.push(...Array(padCount).fill("  "));
      }
    } else {
      // Pad with a '(none)' line plus blanks to total 5 lines
      lines.push("  (none)", "  ", "  ", "  ", "  ");
    }

    this.statsEl.textContent = lines.join("\n");
  }

  onButtonClick(buttonId: string, handler: ButtonCallback): void {
    this.buttonCallbacks.set(buttonId, handler);
    const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener("click", handler);
    }
  }

  onSliderChange(
    sliderId: "volume" | "stability",
    handler: SliderCallback,
  ): void {
    this.sliderCallbacks.set(sliderId, handler);
  }

  getTickerInput(): string {
    const input = document.getElementById(
      "tickerInput",
    ) as HTMLInputElement | null;
    return input?.value.trim() || "";
  }

  // Initialize the dual-thumb Message Rate slider via module import (UI only)
  private async initializeHypeChatSlider(): Promise<void> {
    try {
      if (
        !this.messageRateSliderEl ||
        !this.minRateValueEl ||
        !this.maxRateValueEl
      ) {
        return;
      }
      const mod: any = await import("nouislider");
      const noUiSlider = mod?.default ?? mod;
      const slider = noUiSlider.create(this.messageRateSliderEl, {
        start: [this.currentMinMessageRate, this.currentMaxMessageRate],
        connect: false,
        step: 20,
        range: { min: 20, max: 1500 },
        tooltips: [false, false],
      });

      slider.on(
        "change",
        (
          _values: (number | string)[],
          _handle: number,
          unencoded: number[],
        ) => {
          const minVal = Math.round(unencoded[0]);
          const maxVal = Math.round(unencoded[1]);
          this.currentMinMessageRate = minVal;
          this.currentMaxMessageRate = maxVal;
          this.minRateValueEl!.textContent = `${minVal}ms`;
          this.maxRateValueEl!.textContent = `${maxVal}ms`;
          if (this.hypeChatChangeHandler) this.hypeChatChangeHandler();
        },
      );

      // Initialize burst count slider
      if (
        this.burstCountSliderEl &&
        this.minBurstValueEl &&
        this.maxBurstValueEl
      ) {
        const burstSlider = noUiSlider.create(this.burstCountSliderEl, {
          start: [this.currentMinBurstCount, this.currentMaxBurstCount],
          connect: false,
          step: 1,
          range: { min: 1, max: 10 },
          tooltips: [false, false],
        });

        burstSlider.on(
          "change",
          (
            _values: (number | string)[],
            _handle: number,
            unencoded: number[],
          ) => {
            const minVal = Math.round(unencoded[0]);
            const maxVal = Math.round(unencoded[1]);
            this.currentMinBurstCount = minVal;
            this.currentMaxBurstCount = maxVal;
            this.minBurstValueEl!.textContent = `${minVal}`;
            this.maxBurstValueEl!.textContent = `${maxVal}`;
            if (this.hypeChatChangeHandler) this.hypeChatChangeHandler();
          },
        );
      }
    } catch (err) {
      // If module import fails, keep UI graceful without throwing
      console.warn("Failed to initialize noUiSlider:", err);
    }
  }

  onHypeChatChange(handler: () => void): void {
    this.hypeChatChangeHandler = handler;
  }

  getHypeChatSettings(): HypeChatSettings {
    return {
      target: "hypeChat",
      minMessageRate: this.currentMinMessageRate,
      maxMessageRate: this.currentMaxMessageRate,
      minBurstCount: this.currentMinBurstCount,
      maxBurstCount: this.currentMaxBurstCount,
      lerpFactor: this.currentLerpFactor,
    };
  }

  bindSidebar(sidebar: SidebarManager): void {
    const toggles = Array.from(
      document.querySelectorAll<HTMLButtonElement>("[data-section]"),
    );

    const sectionIds = new Set<string>();

    const applyState = (sectionId: string, expanded: boolean) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.toggle("expanded", expanded);
        section.classList.toggle("collapsed", !expanded);
      }

      const navBtn = document.querySelector<HTMLButtonElement>(
        `.nav-button[data-section="${sectionId}"]`,
      );
      if (navBtn) {
        navBtn.classList.toggle("expanded", expanded);
        navBtn.setAttribute("aria-pressed", expanded.toString());
      }

      const relatedCollapseBtns = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          `.collapse-btn[data-section="${sectionId}"]`,
        ),
      );
      relatedCollapseBtns.forEach((btn) =>
        btn.setAttribute("aria-expanded", expanded.toString()),
      );
    };

    toggles.forEach((btn) => {
      const sectionId = btn.dataset.section;
      if (!sectionId) return;
      sectionIds.add(sectionId);
      btn.addEventListener("click", () => sidebar.toggle(sectionId));
    });

    sectionIds.forEach((sectionId) =>
      applyState(sectionId, sidebar.isExpanded(sectionId)),
    );

    sidebar.onChange(({ sectionId, expanded }) => {
      applyState(sectionId, expanded);
    });
  }
}
