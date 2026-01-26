# DeskUp Pro Card (Home Assistant Lovelace)

A custom Lovelace card for controlling an ESPHome-powered **DeskUp Pro RJ12** standing desk controller from Home Assistant.

This project builds on (and is intended to complement) the excellent DeskUp Pro RJ12 controller work by **SmartHomeGuys**:
- https://github.com/SmartHomeGuys/DeskUp-Pro-Controller-RJ12

> **Status:** v0.x (early). Works for day-to-day control, but we’re still iterating on reliability, UX polish, and safety features.

---

## Features

- **Preset buttons (M1–M4)** with:
  - optional custom labels stored in YAML
  - optional syncing of preset labels to ESPHome `text.*` entities
  - active preset highlighting (within a tolerance)
- **Manual controls** (Up / Down) with safe “STOP-before-reverse” logic
- **STOP behavior**
  - presets visible: presets area shows big STOP while moving
  - presets hidden: STOP replaces Up/Down while moving
- **Height slider**
  - can be control or feedback-only
- **Current position readout** (status + cm + %)
- **Visual editor** for configuration

---

## Requirements

- Home Assistant (Lovelace dashboard)
- ESPHome device exposing the entities this card expects (see **Entity naming**)

---

## Installation

### Manual

1. Copy the JS file to:
   ```
   /config/www/deskup-pro-card.js
   ```

2. Add a Lovelace resource:

   **Settings → Dashboards → Resources → Add resource**
   - URL: `/local/deskup-pro-card.js`
   - Type: `JavaScript Module`

3. Reload the dashboard (or hard refresh).

---

## Usage

### Example YAML

> `device:` is the ESPHome node/entity prefix (everything between the domain and suffix).  
> Example entity: `number.office_esp32_s3_01_desk_height` → `device: office_esp32_s3_01`

```yaml
type: custom:deskup-pro-card
title: Office Desk
device: office_esp32_s3_01

tolerance_mm: 8

show_presets: true
show_manual: true
show_slider: true
slider_control: true
show_position: true

presets:
  m1: "Sitting"
  m2: "Standing"
  m3: "Lean"
  m4: "Max"
```

---

## Entity naming

Given `device: office_esp32_s3_01`, the card expects:

### Core
- `sensor.<device>_desk_status`
- `sensor.<device>_desk_height`
- `sensor.<device>_desk_height_percent`
- `number.<device>_desk_height`
- `number.<device>_min_height`
- `number.<device>_max_height`
- `cover.<device>_height_slider` (used for up/down as `open_cover` / `close_cover`)

### Presets
- `button.<device>_desk_m1`
- `button.<device>_desk_m2`
- `button.<device>_desk_m3`
- `button.<device>_desk_m4`
- `button.<device>_desk_stop`

- `sensor.<device>_desk_m1_height`
- `sensor.<device>_desk_m2_height`
- `sensor.<device>_desk_m3_height`
- `sensor.<device>_desk_m4_height`

### Optional: preset name mirror entities (for syncing labels)
- `text.<device>_preset_m1_name`
- `text.<device>_preset_m2_name`
- `text.<device>_preset_m3_name`
- `text.<device>_preset_m4_name`

The **Sync preset names to device** button only appears when:
- those `text.*` entities exist, **and**
- the YAML labels do **not** match the device values.

---

## ESPHome include: create the preset-name `text.*` entities

If you don’t already have `text.<device>_preset_mX_name`, add them via an include.

### 1) Create the include file

Create:

```
/config/esphome/includes/deskup_preset_names.yaml
```

With:

```yaml
# Adds editable preset-name text entities to mirror preset labels in HA.

text:
  - platform: template
    id: preset_m1_name
    name: "Preset M1 Name"
    icon: "mdi:alpha-m-box"
    mode: text
    optimistic: true
    max_length: 32

  - platform: template
    id: preset_m2_name
    name: "Preset M2 Name"
    icon: "mdi:alpha-m-box"
    mode: text
    optimistic: true
    max_length: 32

  - platform: template
    id: preset_m3_name
    name: "Preset M3 Name"
    icon: "mdi:alpha-m-box"
    mode: text
    optimistic: true
    max_length: 32

  - platform: template
    id: preset_m4_name
    name: "Preset M4 Name"
    icon: "mdi:alpha-m-box"
    mode: text
    optimistic: true
    max_length: 32
```

### 2) Include it from your ESPHome device YAML

```yaml
packages:
  deskup_preset_names: !include includes/deskup_preset_names.yaml
```

### 3) Compile / upload

Upload the firmware and confirm you now have entities like:

- `text.office_esp32_s3_01_preset_m1_name`

---

## Known issues / notes

- Preset triggering reliability is still being investigated (card vs device side).
- More polish and safety options are planned.

---

## Roadmap (staged)

1. Publish current working code to GitHub (version control + releases)
2. Split JS into multiple files (editor / card / helpers) + add `debug` toggle (YAML-only)
3. Optional safety gating by occupancy/motion sensor (PIR vs mmWave support + grace period + overrides)
4. Preset save workflow (confirmations) + optional nudge up/down controls
5. UI polish (themes/card-mod friendliness, optional vertical slider/animations)

---

## Credits

- **SmartHomeGuys** — DeskUp Pro Controller RJ12 (inspiration/upstream reference):  
  https://github.com/SmartHomeGuys/DeskUp-Pro-Controller-RJ12

---

## License

Add a `LICENSE` file to your repo (MIT is common for HA custom cards) and update this section.
