# Release Process

This document describes the official release process for the DeskUp Pro Card.

---

## Versioning

This project follows Semantic Versioning:

MAJOR.MINOR.PATCH

- MAJOR – breaking changes
- MINOR – new features, backwards compatible
- PATCH – bug fixes and small improvements

Example:
- v1.0.0 – initial stable release
- v1.1.0 – new features
- v1.1.1 – bug fix

---

## Pre-Release Checklist

Before creating a release, confirm:

- Card loads without errors in Home Assistant
- Visual editor works and retains focus
- Presets trigger reliably
- Sync preset names works correctly
- README.md is up to date
- LICENSE file exists (MIT)
- Debug logging is disabled by default

---

## Release Steps

### 1. Ensure main is clean

git status

There should be no uncommitted changes.

---

### 2. Create the version tag

git tag vX.Y.Z  
git push origin vX.Y.Z

If a tag needs to be replaced:

git tag -d vX.Y.Z  
git push origin :refs/tags/vX.Y.Z  
git tag vX.Y.Z  
git push origin vX.Y.Z

---

### 3. Create the GitHub Release

1. Go to GitHub → Releases
2. Click “Draft a new release”
3. Select the tag vX.Y.Z
4. Title: DeskUp Pro Card vX.Y.Z
5. Add release notes
6. Publish release

---

## Release Notes Template

## DeskUp Pro Card vX.Y.Z

### Highlights
- Summary of release

### Added
- New features

### Changed
- Behavior changes

### Fixed
- Bug fixes

### Known Issues
- Any known limitations

---

## Post-Release Verification

After publishing:

- Download the release ZIP
- Install deskup-pro-card.js into www/
- Restart Home Assistant
- Confirm card loads and functions correctly
- Check browser console for errors

---

## Emergency Fixes

If a release is broken:

- Fix the issue on main
- Increment PATCH version
- Create a new tag and release
- Do not overwrite existing releases

Example:  
v1.0.0 → v1.0.1

---

## Development Policy

- Releases are intentional and manual
- Experimental changes stay off release tags
- Breaking changes require a MAJOR version bump

---

End of document