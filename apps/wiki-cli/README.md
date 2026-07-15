# wiki-cli

## `src/index.ts`

CLI entry point. Reads the subcommand from `process.argv`, resolves the workspace root, and dispatches to the matching command module:

- `generate-manifest` → `runGenerateManifest`
- `generate-index` → `runGenerateIndex`
- `validate-tags` → `runValidateTags`
- `init` → `runInit`

Sets `process.exitCode` to `1` for unknown commands or unhandled errors.

## `src/commands`

Each file is a thin composition root: it wires Infrastructure adapters into an Application use case and prints the result. No business logic lives here.

- **`generate-manifest.command.ts`** Wires `FileSystemAdapter` into `GenerateManifestUseCase`. 
<br> Writes `wiki/manifest.json` and prints the list of files it contains.
- **`generate-index.command.ts`** Wires `FileSystemAdapter`, `FrontmatterAdapter`, and `MarkdownAdapter` into `GenerateIndexUseCase`. 
<br> Regenerates `wiki/index.md` and prints the entity/concept/source counts.
- **`validate-tags.command.ts`** Wires `FileSystemAdapter` and `FrontmatterAdapter` into `ValidateTagDistributionUseCase`. 
<br> Prints a formatted tag frequency table plus any threshold violations (60% max), and returns `0` (pass) or `1` (fail) as the process exit code.
- **`init.command.ts`** Checks for an existing Angular project (informational only) then wires `FileSystemAdapter` into `ScaffoldWikiUseCase` to create the initial `wiki/`/`raw/` directory structure, logging created vs. existing directories.