# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2021/09/30

### Added

- Added mergepdf command
- Added voice channel in the calendar's messages
- Added a check to prevent subscribing to an eclass once it is started/canceled
- Added crosspost eclass announcement message
- Added automatic-refreshing of the eclass announcements when they are updated
- Added the record-link in the corresponding class channel, when a link is added to an eclass
- Added preview to flagged messages
- Added role conditions to reaction-role
- Added a "unique role" mode to reaction-role
- Added a hook that deletes reaction-roles if their channel is removed
- Added possibility to use an embed in tags

### Improved

- Improved prompts by making all timeouts 2 minutes rather than 1
- Improved `massSend` by waiting 5 seconds between throttles rather than 2
- Improved upcoming classes message by specifying whether it is today near the date
- Improved eclass ID generator
- Improved emoji argument by supporting composed emojis
- Code cleanup and reorganization

### Fixed

- Fixed crash by ignoring initial fetching (in ready event) if no channel was found
- Fixed typos in eclass' prompt message
- Fixed the display of the ID of an eclass in embed footer
- Fixed log-type checking once and for all
- Fixed `messageReactionRemove` event by fetching member if not found, rather than fail

## [0.2.1] - 2021/09/17

### Added

- Added `set` as alias for `create` in sub-commands

### Fixed

- Don't crash when setting not found in, when syncing log status with databases'
- Check if logType is int rather than truthy


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

- Fixed project url in the "move-issues" CI
- Ignore error if failed to fetch the member in `FlaggedMessage.fromDocument`
- Updated outdated message in the `tags` command


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
