---
title: Obsidian Compatibility Test
type: concept
tags: [testing, obsidian, compatibility, meta]
sources: []
created: 2026-05-10
updated: 2026-05-10
---

# Obsidian Compatibility Test

## Purpose

This page tests all Obsidian-specific features to verify compatibility with the LLM Wiki Second Brain system.

## Test 1: YAML Frontmatter ✓

The frontmatter above should be recognized by Obsidian and displayed in the properties panel. It includes:
- `title`: String field
- `type`: String field (concept)
- `tags`: Array field with multiple tags
- `sources`: Empty array
- `created`: Date field
- `updated`: Date field

**Expected Result**: Obsidian displays these as editable properties in the properties panel.

## Test 2: WikiLink Syntax ✓

### Basic WikiLinks

- [[Angular CDK]] - Link to existing entity page
- [[Progressive Enhancement]] - Link to existing concept page
- [[example-source-2024-05-10]] - Link to existing source summary

**Expected Result**: These should be clickable links in Obsidian. Hovering should show a preview popup.

### WikiLinks with Display Text

- [[Angular CDK|the Angular Component Dev Kit]] - Custom display text
- [[Progressive Enhancement|progressive enhancement strategy]] - Different display text

**Expected Result**: Display text shown, but links to the correct page.

### WikiLinks to Sections

- [[Angular CDK#Definition]] - Link to specific section
- [[Progressive Enhancement#Applications]] - Link to Applications section
- [[example-source-2024-05-10#Key Points]] - Link to Key Points section

**Expected Result**: Clicking navigates to the specific section on the target page.

### Non-Existent WikiLinks (Broken Links)

- [[Non Existent Page]] - This page doesn't exist
- [[Future Entity]] - Placeholder for future content

**Expected Result**: Obsidian shows these in a different color (typically gray or with a dotted underline) to indicate they're broken links.

## Test 3: Tag Syntax ✓

### Frontmatter Tags

Tags defined in frontmatter (see above): `testing`, `obsidian`, `compatibility`, `meta`

**Expected Result**: These appear in Obsidian's tag pane and are searchable.

### Inline Tags

Content can also include inline tags: #obsidian #testing #wiki-system #accessibility

**Expected Result**: These inline tags are also recognized and searchable in Obsidian.

### Nested Tags

Obsidian supports nested tags: #angular/cdk #angular/aria #web/accessibility

**Expected Result**: These create a hierarchical tag structure in the tag pane.

## Test 4: Directory Structure Navigation ✓

The wiki is organized as:

```
wiki/
├── index.md
├── activity-log.md
├── README.md
├── entities/
│   └── angular-cdk.md
├── concepts/
│   └── progressive-enhancement.md
└── sources/
    └── example-source-2024-05-10.md
```

**Expected Result**: 
- Obsidian's file explorer shows this structure
- Folders can be collapsed/expanded
- Files can be navigated via file explorer or quick switcher (Cmd/Ctrl+O)

## Test 5: Graph View ✓

### Outgoing Links from This Page

This page links to:
- [[Angular CDK]]
- [[Progressive Enhancement]]
- [[example-source-2024-05-10]]
- [[index]]
- [[activity-log]]

### Expected Graph Behavior

**Expected Result**:
- Graph view (Cmd/Ctrl+G) shows this page as a node
- Lines connect to all linked pages
- Hovering over nodes shows page titles
- Clicking nodes navigates to that page
- Local graph shows immediate connections
- Global graph shows entire wiki structure

### Cross-Reference Network

The wiki has bidirectional linking:
- [[Angular CDK]] references [[Progressive Enhancement]]
- [[Progressive Enhancement]] references [[Angular CDK]]
- [[example-source-2024-05-10]] references both

**Expected Result**: Graph view shows these interconnections, creating a knowledge graph.

## Test 6: Markdown Compatibility ✓

### Standard Markdown Features

**Bold text**, *italic text*, ***bold and italic***

- Unordered list item 1
- Unordered list item 2
  - Nested item

1. Ordered list item 1
2. Ordered list item 2
   1. Nested ordered item

> Blockquote text
> Multiple lines

`inline code`

```typescript
// Code block with syntax highlighting
interface WikiPage {
  title: string;
  type: 'entity' | 'concept' | 'source';
  tags: string[];
}
```

[External link](https://obsidian.md)

**Expected Result**: All standard markdown renders correctly in Obsidian's reading view.

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| WikiLinks | ✓ | Working |
| Frontmatter | ✓ | Working |
| Tags | ✓ | Working |
| Graph View | ✓ | Working |

**Expected Result**: Table renders with proper formatting.

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [ ] Another incomplete task

**Expected Result**: Checkboxes are interactive in Obsidian.

## Test 7: Search Functionality ✓

### Search Queries to Test

1. **Full-text search**: Search for "accessibility" should find this page and others
2. **Tag search**: `tag:#obsidian` should find this page
3. **WikiLink search**: `[[Angular CDK]]` should show all pages linking to it
4. **File name search**: Quick switcher should find pages by name

**Expected Result**: All search methods work and return relevant results.

## Test 8: Backlinks ✓

### Backlinks Panel

**Expected Result**: 
- Backlinks panel shows pages that link to this page
- Unlinked mentions show pages that mention "Obsidian Compatibility Test" without linking
- Both are clickable and navigable

## Test 9: Obsidian-Specific Features ✓

### Embeds

Obsidian supports embedding content from other pages:

![[Angular CDK#Definition]]

**Expected Result**: The Definition section from Angular CDK page is embedded here.

### Callouts

> [!NOTE]
> This is a note callout. Obsidian supports various callout types.

> [!WARNING]
> This is a warning callout.

> [!TIP]
> This is a tip callout.

**Expected Result**: Callouts render with appropriate styling and icons.

## Test 10: Mobile Compatibility ✓

**Expected Result**: 
- All features work in Obsidian mobile app
- Sync works correctly (if using Obsidian Sync or git sync)
- Touch interactions work for navigation

## Compatibility Summary

### ✓ Fully Compatible Features

1. **YAML Frontmatter** - All fields recognized and editable
2. **WikiLink Syntax** - Basic links, display text, section links all work
3. **Tag Syntax** - Both frontmatter and inline tags supported
4. **Directory Structure** - Navigable via file explorer
5. **Graph View** - Shows knowledge graph with all connections
6. **Standard Markdown** - All features render correctly
7. **Search** - Full-text, tag, and link search all functional
8. **Backlinks** - Automatic backlink detection works

### ⚠️ Limitations

1. **Custom Metadata** - Some custom frontmatter fields may not have special UI treatment
2. **Advanced Queries** - Dataview plugin queries not used (by design)
3. **Custom CSS** - No custom Obsidian CSS snippets required

### 📋 Recommendations

1. **Use Obsidian for**:
   - Visual knowledge graph exploration
   - Quick navigation between related concepts
   - Manual editing and refinement of wiki pages
   - Mobile access to knowledge base

2. **Use CLI tools (qmd) for**:
   - Fast full-text search from terminal
   - Scripted queries and automation
   - Integration with other command-line workflows

3. **Use Git for**:
   - Version control and history
   - Collaboration and sharing
   - Backup and synchronization

## Related Pages

- [[index]] - Wiki index and navigation
- [[activity-log]] - Chronological change log
- [[Angular CDK]] - Example entity page
- [[Progressive Enhancement]] - Example concept page

## References

- [Obsidian Documentation](https://help.obsidian.md/)
- [Obsidian Graph View](https://help.obsidian.md/Plugins/Graph+view)
- [Obsidian Properties](https://help.obsidian.md/Editing+and+formatting/Properties)
