# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2021/09/17

### Added

- Added a logging system
  - Logs those events: `ChangeNickname`, `ChangeUsername`, `GuildJoin`, `GuildLeave`, `MessageEdit`, `MessagePost`, `MessageRemove`, `ReactionAdd`, `ReactionRemove`, `RoleAdd`, `RoleRemove`, `VoiceJoin`, `VoiceLeave`.
  - Configurable via the `!log` command

### Improved

- Updated message event's name
- Updated intents & add missing ones
- Used built-in User#tag rather than our own concatenation
- Unified subcommands name and improve underlying system
- Simplified some augments
- Updated dependencies, and updated @sapphire/pieces to v3

### Fixed

- Fix project url in the "move-issues" CI
- Ignore error if failed to fetch the member in `FlaggedMessage.fromDocument`
- Update outdated message in the `tags` command


## [0.1.0] - 2021/09/10

### Added

- Added event-listeners to process errors
- Created "Code" command
- Created "Eclass" command and system
- Created "Help" command
- Created "Latex" command
- Created "Limits" command
- Created "Ping" command
- Created "PingRoleIntersection" command
- Created "ReactionRole" command
- Created "Reminders" command
- Created "Setup" command
- Created "Statistics" command
- Created "Subject" command
- Created "Tags" command
- Created "VocalCount" command
- Created an anti-swear system
- Created an eprof-request system
- Created base client
