# File System Adapter (`libs/wiki/infrastructure-filesystem`)

`@wiki/infrastructure-filesystem` implements the `FileSystemPort` interface using Node.js `fs/promises` for async file operations across `wiki/`, `raw/`, and research directories.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Infrastructure Adapter
- **Core Responsibility**: Provides concrete technical file system implementations for reading, writing, glob scanning, checking file existence, and atomic writes.
- **Implemented Port**: `FileSystemPort` (`@wiki/application-ports`)
- **Downstream Consumers**: Injected into `@wiki/core` facade and application workflows at application startup.

---

## ⚡ Domain Capabilities

- **Async File I/O Operations**: Reads and writes UTF-8 text files asynchronously using native Node `fs/promises`.
- **Directory Hierarchy Scanning**: Performs glob searching and directory listings across wiki document folders (`entities/`, `concepts/`, `sources/`).
- **Path Resolution & Normalization**: Resolves workspace relative paths cleanly across operating systems.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/filesystem-adapter.ts`](./src/lib/filesystem-adapter.ts) | Concrete adapter class implementing `FileSystemPort` for Node.js environments. |
