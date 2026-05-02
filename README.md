# DeskUp Pro Lovelace Card

A Home Assistant Lovelace card for controlling a DeskUp Pro RJ12 standing desk via ESPHome.

This card pairs with the DeskUp Pro ESPHome controller and provides a clean, configurable UI with a full visual editor.

[![Add this repository to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Hyperion5088&repository=homeassistant-deskup-pro-card&category=plugin)

## Features

- Preset buttons (M1–M4)
- Manual Up / Down / Stop controls
- Height slider (control or feedback-only)
- Current height & percentage display
- Preset names from YAML or ESPHome text entities
- One-click Sync preset names to device
- Full Lovelace visual editor
- Theme-friendly and card-mod compatible

## Credits

This project builds on the excellent ESPHome work from:

**DeskUp Pro Controller (RJ12)**  
by **SmartHomeGuys**  
https://github.com/SmartHomeGuys/DeskUp-Pro-Controller-RJ12

All credit for the ESP32 desk controller belongs to that project.  
This card provides an enhanced Home Assistant UI on top.

## Requirements

- Home Assistant
- ESPHome
- DeskUp Pro desk (RJ12)
- ESP32 flashed with firmware from the repo above

## Installation

### HACS

1. Use the button above, or add this repository to HACS manually:
   - Repository: `https://github.com/Hyperion5088/homeassistant-deskup-pro-card`
   - Category: `Dashboard`
2. Install `DeskUp Pro Card` from HACS.
3. Refresh the browser after HACS adds the dashboard resource.

HACS serves the card from:

```text
/hacsfiles/homeassistant-deskup-pro-card/deskup-pro-card.js
```

The custom card type is:

```yaml
type: custom:deskup-pro-card
```

### Manual

Copy `deskup-pro-card.js` to your Home Assistant `www` directory and add it as a dashboard resource:

```yaml
url: /local/deskup-pro-card.js
type: module
```

## ESPHome Preset Name Text Entities

To enable syncing preset names between the card and the device, create an ESPHome include file.

### Create an include file

```yaml
# includes/preset_names.yaml

text:
  - platform: template
    name: "Preset M1 Name"
    optimistic: true
  - platform: template
    name: "Preset M2 Name"
    optimistic: true
  - platform: template
    name: "Preset M3 Name"
    optimistic: true
  - platform: template
    name: "Preset M4 Name"
    optimistic: true
```

### Include it in your ESPHome config

```yaml
<<: !include includes/preset_names.yaml
```

This creates entities such as:

```
text.<device>_preset_m1_name
text.<device>_preset_m2_name
text.<device>_preset_m3_name
text.<device>_preset_m4_name
```

When these entities exist:
- The card shows **Sync preset names to device**
- The button auto-hides once names are in sync

---

## Card Configuration

Most options are configurable via the visual editor. Add the card, then select your Desk height sensor.

The card derives the ESPHome device prefix from height sensors named like:

```yaml
sensor.your_desk_controller_desk_height
```

For non-standard entity names, set `device` manually as an advanced fallback. The `device` value must match the ESPHome node name used in entity IDs.

### Example

```yaml
type: custom:deskup-pro-card
title: Standing Desk
height_entity: sensor.your_desk_controller_desk_height
# Optional fallback for non-standard entity names:
# device: your_desk_controller
presets:
  m1: Sitting
  m2: Standing
  m3: High
  m4: Max
```

Most options are configurable via the visual editor.

---

## 🗺 Roadmap

### Phase 1 (Current)
- Publish to GitHub
- Stabilisation & bug fixes

### Phase 2
- Split JS into multiple files
- Debug mode (YAML-only toggle)
- Occupancy / safety integration
- Command refactoring

### Phase 3
- Preset save from UI (with confirmation)
- Nudge up/down buttons
- Visual polish & animations
- Optional vertical slider / desk visualisation

---

## 📜 License

MIT
