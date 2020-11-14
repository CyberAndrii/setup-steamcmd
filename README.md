# setup-steamcmd v2

[![Tests status](https://github.com/CyberAndrii/setup-steamcmd/workflows/Tests/badge.svg)](https://github.com/CyberAndrii/setup-steamcmd/actions)
[![Integration tests status](https://github.com/CyberAndrii/setup-steamcmd/workflows/Integration%20tests/badge.svg)](https://github.com/CyberAndrii/setup-steamcmd/actions)
[![License: MIT](https://img.shields.io/github/license/CyberAndrii/setup-steamcmd?label=License)](LICENSE)

This action sets up the **Steam Console Client** for use in actions.

# Usage

The following example will update the app with id 1337.

```yaml
steps:
- name: Setup steamcmd
  uses: CyberAndrii/setup-steamcmd@v2

- name: Update app
  run: steamcmd +login anonymous +app_update 1337 validate +quit
```

# Outputs

| name       | description                                              |
|------------|----------------------------------------------------------|
| directory  | Directory where steamcmd was installed                   |
| executable | Path to steamcmd.sh or steamcmd.exe file depending on OS |
