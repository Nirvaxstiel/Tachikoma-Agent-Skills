# Infrastructure Tests

Tests for Tachikoma's foundational systems.

## Purpose

Ensure that Tachikoma installs correctly, tools are registered properly, and the plugin system works as expected.

## Test Files

- `plugin-system.test.ts` - Plugin initialization, script discovery, tool registration
- `installation.test.ts` - Installation flows, backup creation, file copying

## Running Tests

```bash
bun test tests/infrastructure/
```

## What Gets Tested

✅ **Plugin System**
- Plugin initialization
- Script auto-discovery from `tachikoma/` directory
- Tool registration with `tachikoma.*` naming
- Command execution (detect, recommend, add, list)
- Error handling for missing scripts

✅ **Installation**
- Local installation to `.opencode/`
- Global installation to `~/.config/opencode/`
- Custom path installation
- Backup creation on reinstall
- File copying and exclusion rules
- Permission handling

## Expected Test Count

- Plugin system: 5+ test cases
- Installation: 4+ test cases

## Acceptance Criteria

AC-2: Given the plugin system tests, When the installation script runs, Then files are copied correctly to target directory, backup is created, and tools are registered
