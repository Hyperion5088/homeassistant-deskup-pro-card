/* =========================================================
   DeskUp Pro Card – BASELINE RESTORED + FIX: STOP replaces Up/Down when presets hidden & moving
   ========================================================= */

const CARD_NAME = "deskup-pro-card";
const EDITOR_NAME = "deskup-pro-card-editor";

const STATUS_UP = "Raising";
const STATUS_DOWN = "Lowering";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================================================
   VISUAL EDITOR (STABLE + MERGED CONFIG)
   ========================================================= */
class DeskUpProCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = {
      type: `custom:${CARD_NAME}`,
      title: "",
      device: "",
      tolerance_mm: 8,
      show_presets: true,
      show_manual: true,
      show_slider: true,
      slider_control: true,
      show_position: true,
      ...config,
    };

    if (!this._rendered) {
      this._render();
      this._rendered = true;
    }
  }

  _emit(patch = {}) {
    this._config = { ...this._config, ...patch };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _render() {
    const c = this._config;

    this.innerHTML = `
      <div style="padding:12px;display:flex;flex-direction:column;gap:14px;">

        <ha-textfield id="title" label="Card title (optional)"></ha-textfield>
        <ha-textfield id="device" label="Device name"></ha-textfield>
        <ha-textfield id="tolerance" label="Preset match tolerance (mm)" type="number"></ha-textfield>

        <div style="font-weight:600;opacity:0.85;margin-top:4px;">Visibility</div>

        <ha-formfield label="Show preset buttons">
          <ha-switch id="show_presets"></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show manual controls">
          <ha-switch id="show_manual"></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show height slider">
          <ha-switch id="show_slider"></ha-switch>
        </ha-formfield>

        <div id="slider-control-wrap" style="margin-left:24px;">
          <ha-formfield label="Enable height slider control">
            <ha-switch id="slider_control"></ha-switch>
          </ha-formfield>
          <div style="font-size:12px;opacity:0.7;margin-left:4px;">
            When off, the slider is feedback-only.
          </div>
        </div>

        <ha-formfield label="Show current position">
          <ha-switch id="show_position"></ha-switch>
        </ha-formfield>

        <div style="font-size:12px;opacity:0.7;line-height:1.4;">
          Preset labels default to <b>M1–M4</b>.<br>
          To override, create helpers:<br>
          <code>input_text.&lt;device&gt;_desk_preset_m1_name</code><br>
          <code>input_text.&lt;device&gt;_desk_preset_m2_name</code><br>
          <code>input_text.&lt;device&gt;_desk_preset_m3_name</code><br>
          <code>input_text.&lt;device&gt;_desk_preset_m4_name</code>
        </div>

      </div>
    `;

    const q = (s) => this.querySelector(s);

    q("#title").value = c.title ?? "";
    q("#device").value = c.device ?? "";
    q("#tolerance").value = String(c.tolerance_mm ?? 8);

    q("#show_presets").checked = !!c.show_presets;
    q("#show_manual").checked = !!c.show_manual;
    q("#show_slider").checked = !!c.show_slider;
    q("#slider_control").checked = !!c.slider_control;
    q("#show_position").checked = !!c.show_position;

    q("#slider-control-wrap").style.display = q("#show_slider").checked ? "block" : "none";

    q("#title").addEventListener("input", (e) => this._emit({ title: e.target.value }));
    q("#device").addEventListener("input", (e) => this._emit({ device: e.target.value }));
    q("#tolerance").addEventListener("input", (e) => this._emit({ tolerance_mm: Number(e.target.value) }));

    const emitSwitches = () => {
      q("#slider-control-wrap").style.display = q("#show_slider").checked ? "block" : "none";
      this._emit({
        show_presets: q("#show_presets").checked,
        show_manual: q("#show_manual").checked,
        show_slider: q("#show_slider").checked,
        slider_control: q("#slider_control").checked,
        show_position: q("#show_position").checked,
      });
    };

    ["#show_presets", "#show_manual", "#show_slider", "#slider_control", "#show_position"].forEach((id) => {
      q(id).addEventListener("change", emitSwitches);
    });
  }
}

if (!customElements.get(EDITOR_NAME)) {
  customElements.define(EDITOR_NAME, DeskUpProCardEditor);
}

/* =========================================================
   MAIN CARD (FULL FUNCTIONALITY)
   ========================================================= */
class DeskUpProCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(EDITOR_NAME);
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_NAME}`,
      title: "",
      device: "",
      tolerance_mm: 8,
      show_presets: true,
      show_manual: true,
      show_slider: true,
      slider_control: true,
      show_position: true,
    };
  }

  setConfig(config) {
    this._config = {
      title: "",
      device: "",
      tolerance_mm: 8,
      show_presets: true,
      show_manual: true,
      show_slider: true,
      slider_control: true,
      show_position: true,
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._queue) this._queue = Promise.resolve();

    const sig = this._signature();
    if (!this._rendered || sig !== this._lastSig) {
      this._lastSig = sig;
      this._render();
      this._rendered = true;
    }

    this._update();
  }

  _signature() {
    const c = this._config || {};
    return [
      (c.title ?? "").trim(),
      (c.device ?? "").trim(),
      Number(c.tolerance_mm ?? 8),
      !!c.slider_control,
      !!c.show_presets,
      !!c.show_manual,
      !!c.show_slider,
      !!c.show_position,
    ].join("|");
  }

  /* ---------- helpers ---------- */
  _dev() {
    return (this._config?.device ?? "").trim();
  }

  _entity(domain, suffix) {
    return `${domain}.${this._dev()}_${suffix}`;
  }

  _state(entity) {
    return this._hass?.states?.[entity]?.state;
  }

  _num(entity) {
    const v = this._state(entity);
    return v === undefined ? NaN : Number(v);
  }

  _status() {
    if (!this._dev()) return "Idle";
    return this._state(this._entity("sensor", "desk_status")) || "Idle";
  }

  _isMoving() {
    const s = this._status();
    return s === STATUS_UP || s === STATUS_DOWN;
  }

  _presetName(i) {
    const helper = `input_text.${this._dev()}_desk_preset_m${i}_name`;
    const v = this._state(helper);
    return v && v.trim() ? v : `M${i}`;
  }

  _enqueue(fn) {
    this._queue = this._queue.then(fn).catch((err) => console.error("DeskUp card command failed:", err));
    return this._queue;
  }

  async _press(entity) {
    if (!entity) return;
    await this._hass.callService("button", "press", { entity_id: entity });
  }

  async _cover(service) {
    await this._hass.callService("cover", service, {
      entity_id: this._entity("cover", "height_slider"),
    });
  }

  async _setHeight(cm) {
    await this._hass.callService("number", "set_value", {
      entity_id: this._entity("number", "desk_height"),
      value: cm,
    });
  }

  _minHeight() {
    return this._num(this._entity("number", "min_height"));
  }

  _maxHeight() {
    return this._num(this._entity("number", "max_height"));
  }

  async _safeMove(direction /* 'up'|'down' */) {
    const status = this._status();
    if (direction === "up" && status === STATUS_DOWN) {
      await this._press(this._entity("button", "desk_stop"));
      await sleep(500);
    }
    if (direction === "down" && status === STATUS_UP) {
      await this._press(this._entity("button", "desk_stop"));
      await sleep(500);
    }
    await this._cover(direction === "up" ? "open_cover" : "close_cover");
  }

  async _runSlider(targetCm) {
    const min = this._minHeight();
    const max = this._maxHeight();
    if (Number.isNaN(min) || Number.isNaN(max)) return;

    const clamped = Math.min(max, Math.max(min, targetCm));
    await this._setHeight(clamped);
  }

  /* ---------- render ---------- */
  _render() {
    const title = (this._config.title ?? "").trim();
    const hasDev = !!this._dev();

    this.innerHTML = `
      <ha-card ${title ? `header="${title}"` : ""}>
        <style>
          .wrapper { padding:16px; }
          .warn { padding:16px; color: var(--error-color); font-weight:600; }

          .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
          .btn {
            height:72px;
            border-radius:12px;
            border:1px solid var(--divider-color);
            background:var(--card-background-color);
            cursor:pointer;
            font-weight:600;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            gap:4px;
          }
          .btn-name { font-size:14px; }
          .btn-sub { font-size:12px; opacity:0.7; }
          .btn.active { background: var(--success-color); color: var(--text-primary-color); }

          .cancel {
            grid-column: 1 / -1;
            height:72px;
            border-radius:12px;
            border:1px solid var(--error-color);
            background:var(--error-color);
            color:var(--text-primary-color);
            font-weight:900;
            cursor:pointer;
          }

          /* Manual controls layout */
          .manual {
            margin-top:12px;
            display:grid;
            grid-template-columns:repeat(4,1fr);
            gap:10px;
          }
          .mbtn {
            height:44px;
            border-radius:12px;
            border:1px solid var(--divider-color);
            background:var(--card-background-color);
            cursor:pointer;
            font-weight:800;
            display:flex;
            align-items:center;
            justify-content:center;
          }

          #down { grid-column: 1 / span 2; }
          #up { grid-column: 3 / span 2; }

          /* STOPs */
          #stop-top { grid-column: 1 / -1; display:none; }
          #stop-inline { grid-column: 1 / -1; display:none; }

          .stop-top,
          .stop-inline {
            background: var(--error-color);
            color: var(--text-primary-color);
            border: none;
            font-weight: 900;
          }

          .slider-wrap { margin-top:14px; display:flex; justify-content:center; }
          .slider-inner { width:100%; max-width:100%; }
          .slider-inner ha-slider {
            width:100%;
            --mdc-slider-track-height:6px;
            --mdc-slider-handle-size:18px;
          }

          .current { margin-top:12px; font-size:18px; font-weight:700; text-align:center; }
        </style>

        ${!hasDev ? `<div class="warn">Please configure a device name.</div>` : ""}

        <div class="wrapper">
          <div id="preset-container"></div>
          <div id="cancel-container" style="display:none;"></div>

          <div class="manual" id="manual-container">
            <button class="mbtn stop-top" id="stop-top">STOP</button>
            <button class="mbtn" id="down">Down</button>
            <button class="mbtn stop-inline" id="stop-inline">STOP</button>
            <button class="mbtn" id="up">Up</button>
          </div>

          <div class="slider-wrap" id="slider-container">
            <div class="slider-inner">
              <ha-slider step="0.1" pin id="slider"></ha-slider>
            </div>
          </div>

          <div class="current" id="current">—</div>
        </div>
      </ha-card>
    `;

    // Presets grid
    const presetHost = this.querySelector("#preset-container");
    if (presetHost) {
      const grid = document.createElement("div");
      grid.className = "grid";

      for (let i = 1; i <= 4; i++) {
        const b = document.createElement("button");
        b.className = "btn";
        b.dataset.i = String(i);
        b.innerHTML = `
          <div class="btn-name" id="pn-${i}">${this._presetName(i)}</div>
          <div class="btn-sub" id="ph-${i}">—</div>
        `;
        b.addEventListener("click", () =>
          this._enqueue(() => this._press(this._entity("button", `desk_m${i}`)))
        );
        grid.appendChild(b);
      }

      presetHost.appendChild(grid);
    }

    // Big STOP replacing presets while moving
    const cancelHost = this.querySelector("#cancel-container");
    if (cancelHost) {
      const grid = document.createElement("div");
      grid.className = "grid";

      const stopBig = document.createElement("button");
      stopBig.className = "cancel";
      stopBig.textContent = "STOP";
      stopBig.addEventListener("click", () =>
        this._enqueue(() => this._press(this._entity("button", "desk_stop")))
      );

      grid.appendChild(stopBig);
      cancelHost.appendChild(grid);
    }

    // Manual controls
    this.querySelector("#down")?.addEventListener("click", () =>
      this._enqueue(() => this._safeMove("down"))
    );
    this.querySelector("#up")?.addEventListener("click", () =>
      this._enqueue(() => this._safeMove("up"))
    );
    this.querySelector("#stop-top")?.addEventListener("click", () =>
      this._enqueue(() => this._press(this._entity("button", "desk_stop")))
    );
    this.querySelector("#stop-inline")?.addEventListener("click", () =>
      this._enqueue(() => this._press(this._entity("button", "desk_stop")))
    );

    // Slider wiring
    const slider = this.querySelector("#slider");
    if (slider) {
      slider.onchange = (e) => {
        if (!this._config.slider_control) return;
        const v = Number(e?.target?.value);
        if (!Number.isNaN(v)) this._enqueue(() => this._runSlider(v));
      };
    }
  }

  /* ---------- update ---------- */
  _update() {
    if (!this._hass) return;
    if (!this._dev()) return;

    const moving = this._isMoving();

    const presetContainer = this.querySelector("#preset-container");
    const cancelContainer = this.querySelector("#cancel-container");

    // Presets visibility + swap to big STOP while moving
    if (this._config.show_presets) {
      if (presetContainer) presetContainer.style.display = moving ? "none" : "block";
      if (cancelContainer) cancelContainer.style.display = moving ? "block" : "none";
    } else {
      if (presetContainer) presetContainer.style.display = "none";
      if (cancelContainer) cancelContainer.style.display = "none";
    }

    // Manual controls visibility + STOP logic
    const manual = this.querySelector("#manual-container");
    const downBtn = this.querySelector("#down");
    const upBtn = this.querySelector("#up");
    const stopTopBtn = this.querySelector("#stop-top");
    const stopInlineBtn = this.querySelector("#stop-inline");

    if (!this._config.show_manual) {
      if (manual) manual.style.display = "none";
    } else {
      if (manual) manual.style.display = "grid";

      if (this._config.show_presets) {
        // Presets visible:
        // - Down/Up always visible
        // - STOP above them only while moving
        if (this._config.show_presets) {
         if (downBtn) downBtn.style.display = "";
         if (upBtn) upBtn.style.display = "";
         if (stopInlineBtn) stopInlineBtn.style.display = "none";
         if (stopTopBtn) stopTopBtn.style.display = "none";
}
      } else {
        // Presets hidden (compact mode):
        // Idle  -> Down/Up only
        // Moving -> STOP replaces Down/Up inline (NO stop-top)
        if (stopTopBtn) stopTopBtn.style.display = "none";

        if (moving) {
          if (downBtn) downBtn.style.display = "none";
          if (upBtn) upBtn.style.display = "none";
          // IMPORTANT FIX: must explicitly override CSS display:none
          if (stopInlineBtn) stopInlineBtn.style.display = "flex";
        } else {
          if (downBtn) downBtn.style.display = "";
          if (upBtn) upBtn.style.display = "";
          if (stopInlineBtn) stopInlineBtn.style.display = "none";
        }
      }
    }

    // Slider visibility + enable/disable + range/value updates
    const sliderWrap = this.querySelector("#slider-container");
    const slider = this.querySelector("#slider");
    if (sliderWrap) sliderWrap.style.display = this._config.show_slider ? "flex" : "none";

    const height = this._num(this._entity("sensor", "desk_height"));
    const percent = this._num(this._entity("sensor", "desk_height_percent"));

    if (slider) {
      slider.disabled = !this._config.slider_control;

      const min = this._minHeight();
      const max = this._maxHeight();
      if (!Number.isNaN(min) && !Number.isNaN(max)) {
        slider.min = min;
        slider.max = max;
      }
      if (!Number.isNaN(height)) slider.value = height;
    }

    // Current position visibility
    const current = this.querySelector("#current");
    if (current) {
      if (this._config.show_position) {
        if (!Number.isNaN(height)) {
          current.textContent =
            `Current Position: ${height.toFixed(1)} cm` +
            (!Number.isNaN(percent) ? ` • ${Math.round(percent)}%` : "");
        } else {
          current.textContent = "—";
        }
        current.style.display = "block";
      } else {
        current.style.display = "none";
      }
    }

    // Preset names/heights + active highlight
    if (this._config.show_presets) {
      const tolCm = (Number(this._config.tolerance_mm ?? 0) / 10) || 0;

      this.querySelectorAll(".btn").forEach((btn) => {
        const i = Number(btn.dataset.i);
        if (!i || i < 1 || i > 4) return;

        const pnEl = btn.querySelector(`#pn-${i}`);
        if (pnEl) pnEl.textContent = this._presetName(i);

        const presetHeight = this._num(this._entity("sensor", `desk_m${i}_height`));
        const phEl = btn.querySelector(`#ph-${i}`);
        if (phEl) phEl.textContent = Number.isNaN(presetHeight) ? "—" : `${presetHeight.toFixed(1)} cm`;

        const match =
          !Number.isNaN(presetHeight) &&
          !Number.isNaN(height) &&
          Math.abs(height - presetHeight) <= tolCm;

        btn.classList.toggle("active", match);
      });
    }
  }
}

if (!customElements.get(CARD_NAME)) {
  customElements.define(CARD_NAME, DeskUpProCard);
}

/* =========================================================
   LOVELACE REGISTRATION
   ========================================================= */
window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_NAME,
  name: "DeskUp Pro Card",
  description: "DeskUp Pro RJ12 standing desk controller",
  configurable: true,
});