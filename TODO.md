DX: Fix VSCode limitation: can't load cloudflare types in HTML intellisense, and ts-check gives lots of warnings.

Combine with learnings from https://github.com/janwilmake/routed-workers

Allow this build pipeline automatically in flaredream such that we can create independently updated html workers, separately deploying individual files at routes

To make HTML-first development even easier, add a persistent-data layer: (e.g. `document.remoteStorage`: https://letmeprompt.com/rules-httpsuithu-dkqgxm0). Another option is to overwrite `localStorage` and make it function the same if you aren't logged in, but make it backed by a UserDO if you are logged in! https://letmeprompt.com/rules-httpsuithu-jwzfe5s2o5j448
