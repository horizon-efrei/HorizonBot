# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.2] - 2022/05/26

### Improved

- Improved examples on help command by adding two line breaks between them

### Fixed

- Fix reaction filter in dump command, by not relying on the cache
- Fix crash when using the dump command with a reaction filter


## [0.11.1] - 2022/05/19

### Fixed

- Make lint test pass.


## [0.11.0] - 2022/05/19

### Added

- Add a filter in `!dump` command to choose who reacted to a message, with what reaction.

### Fixed

- Fixed format in `!eclass edit` command's success message.


## [0.10.0] - 2022/04/21

### Added

- Add new L3 roles (for those abroad or at the campus)
- Ability to chose which L3 role to ues when creating an eclass

### Improved

- Improve output of `!eclass info` command by using POJOs.


## [0.9.2] - 2022/03/20

### Improved

- Improve eclass subscription logic, by subscribing them only if they are not subscribed yet
- Use new SharePoint URL for eclasses recording, and hide this URL from Git

### Fixed

- Fix crash caused by testing code when choosing subjects in dropdown menu (when creating an eclass)


## [0.9.1] - 2022/03/20

### Fixed

- Fix crash when creating a class with more than 25 subjects


## [0.9.0] - 2022/01/31

### Added

- Add a `PaginatedContentMessageEmbed` class to replace `PaginatedFieldMessageEmbed`
- Add a records command
- Add a userinfo command

### Improved

- Improve reminders edit by now showing the date of the edited reminder
- Improve pagination errors by localizing the interaction error message
- Improve reminders's list by presenting multiline reminders better

### Fixed

- Fix crash due to a old misplaced `this.error()`
- Fix date resolver by auto-pading years to be in 21th century
- Fix date resolver by disallowing dates in the past (unless `context.canBePast` is true)
- Fix date resolver by making hours & minutes optional, defaulting to current date


## [0.8.1] - 2022/01/01

### Added

- Add `--dm` flag in `dump` command to send content in dm

### Fixed

- Fixed crash in `dump` command if content is too long, send as file instead
- Fix `pave` command by add missing new line at end of line


## [0.8.0] - 2021/12/30

### Added

- Add `dump` command
- Add `pave` command
- Add reminder's date to reminder's creation message
- Add a dayFormat (DD/MM/YYYY) to internal settings

### Improved

- Improve subcommand's inner workings
- Improve `vocalcount` by showing all channels every time
- Improve invalid argument error in `code`'s command

### Fixed

- Fix help command by showing command's descriptions in embed's description


## [0.7.0] - 2021/12/17

### Added

- Add `contact` command
- Add eclass record link to calendar when updated
- Add tags list to `help` command
- Add message for the cooldown precondition
- Add a subcommand to edit reminders

### Improved

- Make commands work in DMs
- Improve eclass DM reminders
- Improve permissions for commands with subcommands

### Fixed

- Attempt to make calendars safer length-wise


## [0.6.0] - 2021/11/28

### Added

- Add `serverInfo` command
- Add a `show` subcommand to `eclass`
- Add configurable school year roles in `setup` command
- Add useful class links in calendars (such as original class notification, and record link)
- Add VoiceMove log

### Improved

- Improve `mergepdf`'s help metadata
- Improve eclass announcements by using integrated timestamps
- Improve eclass calendars and upcoming announcements
- Improve eclass help page's readability by removing command lines options for the list subcommand
- Improve eclass notifications by using integrated timestamps
- Improve record link modification process
- Improve reminder's creation by adding the ability to bypass the 'create' subcommand (`!reminder 2h description`)
- Make eclass' targetRole always be the school year role
- Make it impossible to flag our own messages

### Fixed

- Fix `--status=planned` option in eclass list
- Fix alphabet for IDs, making some eclass uneditable because of Discord's escaping
- Fix crash in eclass creation if unable to delete a message
- Fix potential crash with role's name length
- Fix typos


## [0.5.1] - 2021/11/15

### Fixed

- Fix more errors in eclasses
- Fix typo in help embed


## [0.5.0] - 2021/11/09

### Added

- Add a check to prevent professors to subscribe to their own eclass
- Ensure the professor's reminder is sent first
- Add a top-board when no arguments to `vocalcount`

### Improved

- Update GitHub URL for new organization's name (`EFREI-Horizon` -> `horizon-teamdev`)
- Remove automatic swear detection

### Fixed

- Fixed reminders sending twice if it took more than 2 minutes to send them all
- Fix some errors in EclassInteractiveBuilder, and catch unexpected errors more efficiently
- Fix various typos
- Update GitHub's CI secret's name


## [0.4.0] - 2021/10/21

### Added

- Add a handler for channel and role deletions in ConfigManager
- Add a handler for emoji updates and role deletions for Reaction Roles
- Add a name option in merge-pdf command
- Add a new "Invite Post" log
- Add a new AdminOnly precondition
- Add an eval command (admin only)
- Add the list of possibilities in setup and logs

### Improved

- Improve command resolution for the "command" argument
- Improve eclass role's name and ID format
- Improve hour parsing for the "hour" argument (allow spaces as hour-minutes separator)
- Improve messages when editing an eclass
- Improve some messages and fix some typos
- Remove the reaction when a condition failed for the Reaction Role

### Fixed

- Fix eclass announcement crossposting
- Fix incorrect handling of date/hour edits for eclasses
- Fix the "emoji" argument when a falsy value is passed
- Fix error handling in InteractiveBuilders
- Fix crash in `!reactionrrole list`


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
