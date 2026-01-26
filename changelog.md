# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning** starting from the initial public release.

---

## [1.0.0] – Initial Public Release
**Release date:** 2026-01-26

### Added
- Custom Lovelace card for the DeskUp Pro RJ12 standing desk controller
- Manual desk controls:
  - Up / Down buttons
  - STOP button with safe direction-change handling
- Preset support (M1–M4):
  - Preset buttons with labels
  - Preset height display
  - Active preset highlighting with configurable tolerance
- Height slider:
  - Optional control mode or feedback-only mode
- Current position display:
  - Height (cm)
  - Percentage
  - Movement state (Idle / Raising / Lowering)
- Full visual editor:
  - Card title
  - Device name
  - Preset labels
  - Visibility toggles (presets, manual controls, slider, position)
  - Slider control enable/disable
- ESPHome text entity integration:
  - Optional `text.<device>_preset_mX_name` entities
  - One-click “Sync preset names to device” action
  - Sync button auto-hides when values match
- Command queueing to prevent overlapping or conflicting desk actions

### Fixed
- Visual editor losing focus while typing
- Intermittent requirement to press preset buttons multiple times
- STOP button duplication and incorrect visibility states
- UI desynchronisation during desk movement

### Known Limitations
- Preset activation timing may still vary depending on ESPHome firmware behaviour
- Single-file JavaScript architecture (planned refactor)
- No occupancy/safety gating yet
- No preset write-back (save preset) UI yet

---