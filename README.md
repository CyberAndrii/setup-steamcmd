# setup-steamcmd v2

[![Integration test status](https://github.com/CyberAndrii/setup-steamcmd/workflows/Integration%20test/badge.svg)](https://github.com/CyberAndrii/setup-steamcmd/actions)
[![License: MIT](https://img.shields.io/github/license/CyberAndrii/setup-steamcmd?label=License)](LICENSE)

This action sets up the **Steam Console Client** for use in actions.

# Usage

The following example will install and validate the app with id 1337.

```yaml
steps:
- name: Setup steamcmd
  uses: CyberAndrii/setup-steamcmd@v2

- name: Update app
  run: steamcmd +login anonymous +app_update 1337 validate +quit
```

More information about SteamCMD can be found in the [official wiki](https://developer.valvesoftware.com/wiki/SteamCMD).

# Outputs

| name       | description                                              |
|------------|----------------------------------------------------------|
| directory  | Directory where SteamCMD was installed                   |
| executable | Path to steamcmd.sh or steamcmd.exe file depending on OS |
