---
name: readme-generator
description: >-
  Generates concise, human-readable README.md files for directories in the workspace.
  Focuses on functionality, key features, visual capabilities, and high-level responsibilities
  rather than deep technical line-by-line analysis. Uses clean Markdown tables with relative file paths.
  Trigger when asked to "create a readme", "document this directory", or "generate a directory readme".
---

# Directory README Generator Skill

Use this skill whenever asked to document a directory or create a `README.md` for a folder within the project.

---

## 🎯 Core Directives

1. **Focus on Functionality**
   - Describe *what* the code in the directory does functionally (features, UI behaviors, visual encodings, role in the application).
   - Avoid deep technical line-by-line code analysis, function signatures, or implementation trivia unless explicitly requested.

2. **Keep it Short & Precise**
   - Structure for scannability with clean headers, concise bullet points, and high signal-to-noise ratio.

3. **Mandatory Relative Paths**
   - All links in the README (e.g. in the module summary table) **MUST** use relative paths (e.g., [`./file-name.ts`](./file-name.ts)), **NEVER** absolute `file://` URLs.

---

## 📋 Required Structure Template

Every generated `README.md` must follow this structure:

```markdown
# [Directory Title / Module Name]

[1-2 sentence high-level description of what this directory/module provides.]

---

## 💡 Key Features & Functionality

- **[Feature 1 Name]**
  - [Short bullet explaining functional behavior]
  - [Short bullet explaining UI/user interaction or domain responsibility]

- **[Feature 2 Name]**
  - [Short bullet explaining visual encoding, layout, or data processing]

---

## 📁 Module Summary

| File | Primary Function |
| --- | --- |
| [`file-one.ts`](./file-one.ts) | Brief functional summary of file-one. |
| [`file-two.ts`](./file-two.ts) | Brief functional summary of file-two. |
```

---

## 🚀 Execution Steps

1. **Inspect Directory**: List all files and understand their high-level functional responsibility.
2. **Identify Core Capabilities**: Group files into 3-4 primary functional feature categories (e.g. rendering physics, state management, zoom/pan, visual styling).
3. **Generate README**: Write `README.md` inside the target directory strictly following the template above and enforcing relative file links (`./filename`).
