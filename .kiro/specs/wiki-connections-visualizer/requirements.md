# Requirements Document

## Introduction

The Wiki Connections Visualizer is a feature for the `deep-dive-angular-aria` Angular application that reads the local wiki directory, parses `[[wikilink]]` connections between pages, and renders an interactive knowledge graph. Users can explore clusters of related ideas, identify hub concepts, and discover content gaps — similar to Obsidian's graph view or InfraNodus. The graph data is derived entirely from the existing wiki structure (entities, concepts, sources) and the `[[wikilink]]` syntax already used throughout those pages.

## Glossary

- **Visualizer**: The Angular component that renders the interactive knowledge graph.
- **Graph_Parser**: The service responsible for reading wiki markdown files and extracting nodes and edges from `[[wikilink]]` syntax.
- **Graph_Data**: The in-memory data structure representing nodes (wiki pages) and edges (wikilink connections).
- **Node**: A single wiki page represented as a point in the graph. Has a title, type (`entity`, `concept`, `source`), and tags.
- **Edge**: A directed connection from one Node to another, derived from a `[[wikilink]]` in the source page's content.
- **Hub_Node**: A Node with a significantly higher number of connections (in-degree + out-degree) than average.
- **Orphan_Node**: A Node with zero incoming and zero outgoing edges.
- **Cluster**: A group of Nodes that are more densely connected to each other than to the rest of the graph.
- **WikiLink**: A cross-reference in markdown content using the `[[Page Title]]` syntax, optionally with display text (`[[Page Title|Display]]`) or section anchors (`[[Page Title#Section]]`).
- **Force_Layout**: A physics-based graph layout algorithm where nodes repel each other and edges act as springs, producing organic cluster separation.
- **Wiki_Directory**: The `wiki/` directory at the workspace root, containing `entities/`, `concepts/`, and `sources/` subdirectories.

## Requirements

### Requirement 1: Parse Wiki Pages into Graph Data

**User Story:** As a developer, I want the visualizer to read all wiki pages and extract their connections, so that the graph accurately reflects the current state of the wiki.

#### Acceptance Criteria

1. WHEN the Visualizer initializes, THE Graph_Parser SHALL scan all `.md` files in the `entities/`, `concepts/`, and `sources/` subdirectories of the Wiki_Directory.
2. WHEN a wiki page is scanned, THE Graph_Parser SHALL create one Node per page, using the `title` field from the page's YAML frontmatter as the node identifier.
3. WHEN a wiki page is scanned, THE Graph_Parser SHALL extract the page `type` (`entity`, `concept`, or `source`) and `tags` array from the YAML frontmatter and attach them to the Node.
4. WHEN a wiki page contains `[[WikiLink]]` syntax in its content body, THE Graph_Parser SHALL create one directed Edge from the source page's Node to the target page's Node for each unique link target.
5. WHEN a `[[WikiLink]]` references a page title that does not exist in the Wiki_Directory, THE Graph_Parser SHALL still create the Edge and mark the target Node as a ghost node (non-existent page).
6. WHEN a `[[WikiLink|Display Text]]` or `[[WikiLink#Section]]` form is encountered, THE Graph_Parser SHALL extract only the page title portion as the edge target, discarding display text and section anchors.
7. THE Graph_Parser SHALL deduplicate edges so that multiple `[[WikiLink]]` references to the same target within one page produce exactly one Edge.
8. WHEN parsing is complete, THE Graph_Parser SHALL produce a Graph_Data object containing all Nodes and Edges derived from the Wiki_Directory.

---

### Requirement 2: Render an Interactive Force-Directed Graph

**User Story:** As a developer, I want to see all wiki pages and their connections rendered as an interactive graph, so that I can visually explore the knowledge structure.

#### Acceptance Criteria

1. WHEN Graph_Data is available, THE Visualizer SHALL render each Node as a circle positioned using a Force_Layout algorithm.
2. WHEN Graph_Data is available, THE Visualizer SHALL render each Edge as a line connecting the source Node circle to the target Node circle.
3. THE Visualizer SHALL visually distinguish node types by applying a distinct color to `entity`, `concept`, and `source` nodes.
4. THE Visualizer SHALL scale each Node's circle radius proportionally to the node's total connection count (in-degree + out-degree), so Hub_Nodes appear larger.
5. THE Visualizer SHALL display each Node's title as a text label adjacent to its circle.
6. WHEN a user drags a Node, THE Visualizer SHALL allow the node to be repositioned and the Force_Layout SHALL continue to apply to all other nodes.
7. WHEN a user scrolls or pinches on the graph canvas, THE Visualizer SHALL zoom in or out, keeping the graph centered on the pointer position.
8. WHEN a user pans by clicking and dragging the canvas background, THE Visualizer SHALL translate the entire graph view.
9. THE Visualizer SHALL render ghost nodes (non-existent link targets) with a visually distinct style (e.g., dashed border or reduced opacity) to indicate the page does not exist.

---

### Requirement 3: Node Selection and Detail Panel

**User Story:** As a developer, I want to click on a node to see its details and highlighted connections, so that I can understand a page's role in the knowledge graph.

#### Acceptance Criteria

1. WHEN a user clicks a Node, THE Visualizer SHALL highlight that node and all of its directly connected edges and neighbor nodes.
2. WHEN a user clicks a Node, THE Visualizer SHALL display a detail panel showing: the page title, type, tags, outgoing link count, and incoming link count.
3. WHEN a user clicks a Node, THE Visualizer SHALL dim all nodes and edges that are not directly connected to the selected node.
4. WHEN a user clicks the canvas background or presses the Escape key, THE Visualizer SHALL deselect the current node and restore all nodes and edges to their default visual state.
5. WHEN a ghost node is selected, THE Visualizer SHALL indicate in the detail panel that the page does not exist in the Wiki_Directory.
6. THE detail panel SHALL be keyboard accessible: focus SHALL move to the panel when a node is selected via keyboard, and the panel SHALL be dismissible with the Escape key.

---

### Requirement 4: Filter and Search

**User Story:** As a developer, I want to filter the graph by node type or tag and search for specific pages, so that I can focus on relevant parts of the knowledge graph.

#### Acceptance Criteria

1. THE Visualizer SHALL provide toggle controls to show or hide nodes by type (`entity`, `concept`, `source`).
2. WHEN a type toggle is deactivated, THE Visualizer SHALL hide all nodes of that type and all edges connected exclusively to hidden nodes.
3. THE Visualizer SHALL provide a text input for searching page titles.
4. WHEN a user types in the search input, THE Visualizer SHALL highlight nodes whose titles contain the search string (case-insensitive) and dim all non-matching nodes.
5. WHEN a user clears the search input, THE Visualizer SHALL restore all nodes to their default visual state.
6. THE Visualizer SHALL provide a tag filter control that lists all unique tags present in the Graph_Data.
7. WHEN a tag is selected in the tag filter, THE Visualizer SHALL highlight only nodes that include that tag in their tags array and dim all other nodes.
8. THE search input and filter controls SHALL be keyboard accessible and meet WCAG 2.1 AA contrast requirements.

---

### Requirement 5: Graph Analysis Indicators

**User Story:** As a developer, I want the graph to surface structural insights like hub pages and orphan pages, so that I can identify content gaps and central concepts.

#### Acceptance Criteria

1. THE Visualizer SHALL compute and display a count of Orphan_Nodes in a summary panel.
2. THE Visualizer SHALL compute and display the top 5 Hub_Nodes by total connection count in a summary panel.
3. WHEN a user clicks an entry in the Hub_Nodes list, THE Visualizer SHALL select that node in the graph and scroll it into view.
4. WHEN a user clicks the Orphan_Nodes count, THE Visualizer SHALL highlight all Orphan_Nodes in the graph.
5. THE Visualizer SHALL display the total node count and total edge count in the summary panel.

---

### Requirement 6: Graph Data Refresh

**User Story:** As a developer, I want to reload the graph data without refreshing the browser, so that I can see changes to the wiki reflected immediately after editing pages.

#### Acceptance Criteria

1. THE Visualizer SHALL provide a "Refresh" button that re-triggers the Graph_Parser to re-scan the Wiki_Directory.
2. WHEN the Refresh button is activated, THE Visualizer SHALL re-render the graph with the updated Graph_Data while preserving the current zoom level and pan position.
3. WHEN the Graph_Parser encounters a file it cannot read during a refresh, THE Visualizer SHALL log a warning and continue processing remaining files.
4. IF the Wiki_Directory is not found or is empty during a refresh, THEN THE Visualizer SHALL display an error message indicating the wiki could not be loaded.
