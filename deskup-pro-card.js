/* =========================================================
   DeskUp Pro Card – BASELINE RESTORED + FIX: STOP replaces Up/Down when presets hidden & moving
   ========================================================= */

const CARD_NAME = "deskup-pro-card";
const EDITOR_NAME = "deskup-pro-card-editor";

const STATUS_UP = "Raising";
const STATUS_DOWN = "Lowering";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const deskPrefixFromHeightEntity = (entityId) => {
  const match = String(entityId || "").match(/^sensor\.(.+)_desk_height$/);
  return match ? match[1] : "";
};

/* =========================================================
   VISUAL EDITOR (STABLE + MERGED CONFIG)
   ========================================================= */
class DeskUpProCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._rendered = false;
  }
setConfig(config) {
  this._config = {
    type: `custom:${CARD_NAME}`,
    title: "",
    height_entity: "",
    device: "",
    tolerance_mm: 8,
    show_presets: true,
    show_manual: true,
    show_slider: true,
    slider_control: true,
    show_position: true,
    presets: { m1: "", m2: "", m3: "", m4: "" },
    ...config,
  };
    if (!this._rendered) {
    this._render();
    this._rendered = true;
  }
}

  set hass(hass) {
    this._hass = hass;
    if (this._rendered) this._configureEntityPicker();
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
        <ha-entity-picker id="height_entity" label="Desk height sensor"></ha-entity-picker>
        <ha-textfield id="device" label="Device prefix (advanced fallback)"></ha-textfield>
        <ha-textfield id="tolerance" label="Preset match tolerance (mm)" type="number"></ha-textfield>

        <div style="font-weight:600;opacity:0.85;margin-top:4px;">Preset labels</div>
        <ha-textfield id="preset_m1" label="Preset M1 label"></ha-textfield>
        <ha-textfield id="preset_m2" label="Preset M2 label"></ha-textfield>
        <ha-textfield id="preset_m3" label="Preset M3 label"></ha-textfield>
        <ha-textfield id="preset_m4" label="Preset M4 label"></ha-textfield>

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
          Select the desk height sensor when possible. The card derives the ESPHome device prefix from <code>sensor.&lt;device&gt;_desk_height</code>.<br>
          Preset labels are stored in this card's YAML config. Leave blank to use <b>M1-M4</b> defaults.<br>
          If you've created ESPHome text entities, you can use the card's <b>Sync preset names to device</b> button to copy these labels to:<br>
          <code>text.&lt;device&gt;_preset_m1_name</code>,
          <code>text.&lt;device&gt;_preset_m2_name</code>,
          <code>text.&lt;device&gt;_preset_m3_name</code>,
          <code>text.&lt;device&gt;_preset_m4_name</code>
        </div>

      </div>
    `;

    const q = (s) => this.querySelector(s);

    q("#title").value = c.title ?? "";
    q("#height_entity").value = c.height_entity ?? "";
    q("#device").value = c.device ?? "";
    q("#tolerance").value = String(c.tolerance_mm ?? 8);

    q("#preset_m1").value = c.presets?.m1 ?? "";
    q("#preset_m2").value = c.presets?.m2 ?? "";
    q("#preset_m3").value = c.presets?.m3 ?? "";
    q("#preset_m4").value = c.presets?.m4 ?? "";

    q("#show_presets").checked = !!c.show_presets;
    q("#show_manual").checked = !!c.show_manual;
    q("#show_slider").checked = !!c.show_slider;
    q("#slider_control").checked = !!c.slider_control;
    q("#show_position").checked = !!c.show_position;

    q("#slider-control-wrap").style.display =
      q("#show_slider").checked ? "block" : "none";

    this._configureEntityPicker();

    q("#title").addEventListener("input", (e) => this._emit({ title: e.target.value }));
    q("#height_entity").addEventListener("value-changed", (e) => {
      const heightEntity = e.detail?.value || "";
      const prefix = deskPrefixFromHeightEntity(heightEntity);
      this._emit({
        height_entity: heightEntity,
        ...(prefix ? { device: prefix } : {}),
      });
      if (prefix) q("#device").value = prefix;
    });
    q("#device").addEventListener("input", (e) => this._emit({ device: e.target.value }));
    q("#tolerance").addEventListener("input", (e) =>
      this._emit({ tolerance_mm: Number(e.target.value) })
    );

    const emitPresets = () =>
      this._emit({
        presets: {
          ...(this._config.presets || {}),
          m1: q("#preset_m1").value,
          m2: q("#preset_m2").value,
          m3: q("#preset_m3").value,
          m4: q("#preset_m4").value,
        },
      });

    ["#preset_m1", "#preset_m2", "#preset_m3", "#preset_m4"].forEach((id) =>
      q(id).addEventListener("input", emitPresets)
    );

    const emitSwitches = () => {
      q("#slider-control-wrap").style.display =
        q("#show_slider").checked ? "block" : "none";

      this._emit({
        show_presets: q("#show_presets").checked,
        show_manual: q("#show_manual").checked,
        show_slider: q("#show_slider").checked,
        slider_control: q("#slider_control").checked,
        show_position: q("#show_position").checked,
      });
    };

    ["#show_presets", "#show_manual", "#show_slider", "#slider_control", "#show_position"]
      .forEach((id) => q(id).addEventListener("change", emitSwitches));
  }

  _configureEntityPicker() {
    const picker = this.querySelector("#height_entity");
    if (!picker || !this._hass) return;

    picker.hass = this._hass;
    picker.includeDomains = ["sensor"];
    picker.value = this._config?.height_entity || "";
  }
}


if (!customElements.get(EDITOR_NAME)) {
  customElements.define(EDITOR_NAME, DeskUpProCardEditor);
}

/* =========================================================
   MAIN CARD (FULL FUNCTIONALITY)
   ========================================================= */
class DeskUpProCard extends HTMLElement {
  constructor() {
    super();
    this._queue = Promise.resolve();
  }
  static getConfigElement() {
   return document.createElement("deskup-pro-card-editor");
 }
  static getStubConfig() {
    return {
      type: `custom:${CARD_NAME}`,
      title: "",
      height_entity: "",
      device: "",
      tolerance_mm: 8,
      show_presets: true,
      show_manual: true,
      show_slider: true,
      slider_control: true,
      show_position: true,
      presets: { m1: "", m2: "", m3: "", m4: "" },
    };
  }

  setConfig(config) {
    this._config = {
      title: "",
      height_entity: "",
      device: "",
      tolerance_mm: 8,
      show_presets: true,
      show_manual: true,
      show_slider: true,
      slider_control: true,
      show_position: true,
      presets: {
        m1: "",
        m2: "",
        m3: "",
        m4: "",
        ...(config?.presets || {}),
      },
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._dev()) {
      this.innerHTML = `
        <ha-card>
          <div style="padding:16px;color:var(--error-color);font-weight:700;">
            DeskUp Pro Card: select a desk height sensor in the visual editor
          </div>
        </ha-card>
      `;
      return;
    }

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
      (c.height_entity ?? "").trim(),
      (c.device ?? "").trim(),
      this._dev(),
      Number(c.tolerance_mm ?? 8),
      !!c.slider_control,
      !!c.show_presets,
      !!c.show_manual,
      !!c.show_slider,
      !!c.show_position,
    ].join("|");
  }

  /* ---------- helpers ---------- */
  _presetsInSync() {
    if (!this._hass || !this._dev()) return false;
  
    for (let i = 1; i <= 4; i++) {
      const ent = this._presetTextEntity(i);
      const state = this._state(ent);
  
      // If the entity exists, compare values
      if (state !== undefined) {
        const expected = this._presetName(i);
        if ((state ?? "").trim() !== expected.trim()) {
          return false; // mismatch → needs sync
        }
      }
    }
  
    return true; // all match
  }
  _dev() {
    return (
      (this._config?.device ?? "").trim() ||
      deskPrefixFromHeightEntity(this._config?.height_entity) ||
      this._autoDetectedDevice()
    );
  }

  _autoDetectedDevice() {
    if (!this._hass?.states) return "";

    const prefixes = Object.keys(this._hass.states)
      .map((entityId) => deskPrefixFromHeightEntity(entityId))
      .filter((prefix) => {
        if (!prefix) return false;
        return (
          this._hass.states[`button.${prefix}_desk_stop`] ||
          this._hass.states[`number.${prefix}_desk_height`] ||
          this._hass.states[`cover.${prefix}_height_slider`]
        );
      });

    const unique = [...new Set(prefixes)];
    return unique.length === 1 ? unique[0] : "";
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
    const key = `m${i}`;
    const fromYaml = this._config?.presets?.[key];
    if (fromYaml && String(fromYaml).trim()) return String(fromYaml).trim();

    // Optional ESPHome text entity mirror (for voice/automations)
    const textEnt = `text.${this._dev()}_preset_m${i}_name`;
    const fromText = this._state(textEnt);
    if (fromText && String(fromText).trim()) return String(fromText).trim();

    return `M${i}`;
  }

  _presetTextEntity(i) {
    return `text.${this._dev()}_preset_m${i}_name`;
  }

  _hasPresetTextEntities() {
    if (!this._hass || !this._dev()) return false;
    for (let i = 1; i <= 4; i++) {
      if (this._hass.states?.[this._presetTextEntity(i)]) return true;
    }
    return false;
  }

 async _syncPresetsToDevice() {
  if (!this._hass || !this._dev()) return;

  for (let i = 1; i <= 4; i++) {
    const entity_id = this._presetTextEntity(i);
    if (!this._hass.states?.[entity_id]) continue;

    const value = this._presetName(i);
    await this._hass.callService("text", "set_value", { entity_id, value });
    await sleep(50);
  }

  // 🔑 Force UI refresh so button disappears
  this._render();
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

  async _safeMove(dir) {
    // Direction change bug: always STOP before reversing direction
    // Also add a short delay to let controller settle.
    const status = this._status();

if (dir === "up") {
  if (status === STATUS_DOWN) {
    await this._press(this._entity("button", "desk_stop"));
    await sleep(500);
  }
  await this._cover("open_cover");
} else {
  if (status === STATUS_UP) {
    await this._press(this._entity("button", "desk_stop"));
    await sleep(500);
  }
  await this._cover("close_cover");
}
  }

  async _runSlider(cm) {
    // When using absolute cm: number entity handles motion & stop
    await this._setHeight(cm);
  }
_render() {
const title = (this._config.title ?? "").trim();
const hasDev = !!this._dev();

const canSyncPresets =
  hasDev &&
  this._hasPresetTextEntities() &&
  !this._presetsInSync();

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
          .sync { margin-top:10px; display:flex; justify-content:center; }
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

          ${canSyncPresets ? `
            <div class="sync">
              <button id="sync-presets" class="sync-btn">
                Sync preset names to device
              </button>
            </div>
          ` : ""}
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
        b.addEventListener("click", () => {
          // Presets must always hard-reset controller state
          this._queue = Promise.resolve();
          this._enqueue(async () => {
            // Always STOP first to clear ESPHome button latch
            await this._press(this._entity("button", "desk_stop"));
            await sleep(150); // small settle delay (not timing-based)
            await this._press(this._entity("button", `desk_m${i}`));
        });
    });
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

    // Sync button (only rendered when ESPHome text entities exist)
    this.querySelector("#sync-presets")?.addEventListener("click", () =>
      this._enqueue(() => this._syncPresetsToDevice())
    );
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

    // Manual controls visibility
    const manual = this.querySelector("#manual-container");
    if (manual) manual.style.display = this._config.show_manual ? "grid" : "none";

    // Slider visibility
    const sliderWrap = this.querySelector("#slider-container");
    if (sliderWrap) sliderWrap.style.display = this._config.show_slider ? "flex" : "none";

    // STOP button logic
    // - If presets hidden: idle => show up/down; moving => show inline STOP (replace)
    // - If presets visible: up/down always visible; moving => show stop-top above up/down
    const stopTop = this.querySelector("#stop-top");
    const stopInline = this.querySelector("#stop-inline");
    const downBtn = this.querySelector("#down");
    const upBtn = this.querySelector("#up");

if (this._config.show_manual) {
  if (this._config.show_presets) {
    // Presets visible:
    // - STOP is shown in the PRESET area while moving
    // - Manual up/down NEVER show STOP
    if (stopTop) stopTop.style.display = "none";
    if (stopInline) stopInline.style.display = "none";
    if (downBtn) downBtn.style.display = "flex";
    if (upBtn) upBtn.style.display = "flex";
  } else {
    // Presets hidden:
    // - STOP replaces up/down while moving
    if (stopTop) stopTop.style.display = "none";
    if (stopInline) stopInline.style.display = moving ? "flex" : "none";
    if (downBtn) downBtn.style.display = moving ? "none" : "flex";
    if (upBtn) upBtn.style.display = moving ? "none" : "flex";
  }
}

    // Slider: update min/max + current value
    const slider = this.querySelector("#slider");
    if (slider && this._config.show_slider) {
      const min = this._num(this._entity("number", "min_height"));
      const max = this._num(this._entity("number", "max_height"));
      const cur = this._num(this._entity("sensor", "desk_height"));

      if (!Number.isNaN(min)) slider.min = min;
      if (!Number.isNaN(max)) slider.max = max;

      // Avoid fighting user drag when active
      if (!this._config.slider_control || !slider.matches(":active")) {
        if (!Number.isNaN(cur)) slider.value = cur;
      }

      // Make it visually disabled when feedback-only
      slider.disabled = !this._config.slider_control;
    }

    // Current position display
    const currentEl = this.querySelector("#current");
    if (currentEl) {
      if (!this._config.show_position) {
        currentEl.style.display = "none";
      } else {
        currentEl.style.display = "block";
        const h = this._num(this._entity("sensor", "desk_height"));
        const pct = this._num(this._entity("sensor", "desk_height_percent"));
        const status = this._status();

        const hStr = Number.isNaN(h) ? "—" : `${h.toFixed(1)} cm`;
        const pStr = Number.isNaN(pct) ? "—" : `${Math.round(pct)}%`;

        if (status === STATUS_UP || status === STATUS_DOWN) {
          currentEl.textContent = `Current Position: ${status} • ${hStr} • ${pStr}`;
        } else {
          currentEl.textContent = `Current Position: Idle • ${hStr} • ${pStr}`;
        }
      }
    }

    // Preset buttons: set active + show heights + names
    if (this._config.show_presets) {
      const tolerance = Number(this._config.tolerance_mm ?? 8) / 10; // mm -> cm
      const cur = this._num(this._entity("sensor", "desk_height"));

      this.querySelectorAll(".btn").forEach((btn) => {
        const i = Number(btn.dataset.i);
        if (!i || i < 1 || i > 4) return;

        const pnEl = btn.querySelector(`#pn-${i}`);
        if (pnEl) pnEl.textContent = this._presetName(i);

        const presetHeight = this._num(this._entity("sensor", `desk_m${i}_height`));
        const phEl = btn.querySelector(`#ph-${i}`);
        if (phEl) {
          if (Number.isNaN(presetHeight)) {
            phEl.textContent = "—";
          } else {
            phEl.textContent = `${presetHeight.toFixed(1)} cm`;
          }
        }

        // highlight when close
        if (!Number.isNaN(cur) && !Number.isNaN(presetHeight)) {
          const active = Math.abs(cur - presetHeight) <= tolerance;
          btn.classList.toggle("active", active);
        } else {
          btn.classList.remove("active");
        }
      });
    }
  }

  getCardSize() {
    return 3;
  }
}

/* =========================================================
   REGISTER
   ========================================================= */

// Register the card
if (!customElements.get(CARD_NAME)) {
  customElements.define(CARD_NAME, DeskUpProCard);
}

// Register the visual editor
if (!customElements.get("deskup-pro-card-editor")) {
  customElements.define("deskup-pro-card-editor", DeskUpProCardEditor);
}

// Make it discoverable in the Lovelace UI
window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_NAME,
  name: "DeskUp Pro Card",
  description: "DeskUp Pro RJ12 standing desk controller card",
  preview: true,
  configurable: true,
});
