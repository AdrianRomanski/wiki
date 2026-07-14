# application-scaffolding

Application Layer library for scaffolding the wiki + `raw/` directory
structure.

Provides `ScaffoldWikiUseCase`, which idempotently creates the fixed set of
`raw/*` and `wiki/*` directories (via `FileSystemPort.ensureDir`), mirroring
the pre-migration `scripts/init-wiki.ts` behavior.

## Known simplification: `created` vs `existing`

`FileSystemPort` has no directory-existence-check method (only file-existence
checks: `rawFileExists` / `wikiFileExists`), and `ensureDir` itself does not
report whether it created a new directory or found one that already existed.
Because of this, `ScaffoldWikiUseCase` cannot cleanly distinguish "created"
from "existing" purely through the port. As a pragmatic simplification, every
directory processed by `ensureDir` is reported in the `created` list; the
`existing` list is always empty. This preserves the fixed-list iteration and
idempotence behavior of the original `scripts/init-wiki.ts` script (calling
`execute()` again on an already-scaffolded tree is a no-op on disk), while
the created/existing distinction is not observable through the current port
surface.
