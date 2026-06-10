# Findings Summary: Hexagonal Architecture

## Document Metadata

- **Article Title:** Ports and Adapters Pattern (Hexagonal Architecture)
- **Author:** Juan Manuel Garrido de Paz
- **Publication Date:** 2018-08-29
- **Source URL:** https://jmgarridopaz.github.io/content/hexagonalarchitecture.html
- **Scope:** Article Research
- **Research Date:** 2026-06-10

## Key Insights

### What is Hexagonal Architecture?

Hexagonal Architecture (also called Ports and Adapters Pattern) is an architectural pattern created by Dr. Alistair Cockburn in 2005. It structures applications to be **technology-agnostic** by placing business logic inside a "hexagon" and connecting to the outside world exclusively through:

- **Ports** - Interfaces defining the application boundary
- **Adapters** - Technology-specific implementations that connect to ports

The core principle is that all dependencies point **inward** toward the hexagon, never outward. This enables the application to be driven by different clients (humans, tests, other apps) and tested in isolation from external systems (databases, servers, APIs).

### Why It Matters

Despite being published in 2005, the pattern has become **more relevant over time** precisely because it promotes decoupling from technology. As frameworks and technologies evolve rapidly, business logic protected inside the hexagon remains stable. The article explicitly addresses this concern, noting that "good things are timeless, like wine."

### The Symmetry/Asymmetry Insight

The pattern exhibits both:

1. **Symmetry** - All adapters (both driver and driven) depend on the hexagon; the application is technology-agnostic on both sides
2. **Asymmetry** - Configurable Dependency works differently:
   - **Driver side:** Adapter knows about application; application doesn't know which driver is driving it
   - **Driven side:** Application knows about the driven adapter it must talk to (since it initiates the conversation)

Cockburn initially called this "Symmetrical Asymmetry" then refined it to "Asymmetrical Symmetry" as understanding evolved.

## Identified Entities

### Primary Architectural Entities

1. **Hexagonal Architecture / Ports and Adapters Pattern**
   - Architectural pattern for technology-agnostic application structure
   - Created by Alistair Cockburn in 2005
   - Name comes from hexagonal shape used in diagrams (shape itself is arbitrary)

2. **Alistair Cockburn**
   - Creator of Hexagonal Architecture
   - Software architecture thought leader
   - Published original pattern in 2005

3. **Configurable Dependency Pattern**
   - Foundation pattern enabling Hexagonal Architecture
   - Generalization of Dependency Injection coined by Gerard Meszaros
   - Dependencies are on interfaces configured at runtime
   - Better term than "Dependency Injection" (describes property, not action) or "Inversion of Control" (double negative)

### Supporting Patterns and Concepts

4. **Dependency Injection**
   - Implementation technique for Configurable Dependency
   - Specific interface implementations injected into constructors at runtime

5. **Inversion of Control**
   - Alternative name for Dependency Injection
   - Less preferred term according to Cockburn

6. **Composition Root**
   - Startup component that assembles the entire system
   - Also called "Main Component" by Robert C. Martin
   - Initializes environment, creates adapters, wires them to ports, starts drivers

7. **Command Bus**
   - Design pattern for organizing driver ports
   - Allows single port interface to handle multiple use cases via command handlers
   - Helps maintain Single Responsibility Principle

8. **CQRS (Command Query Responsibility Segregation)**
   - Pattern separating command execution from query execution
   - Can be applied to ports: one port for commands, another for queries

9. **BDD (Behaviour Driven Development)**
   - Development approach using acceptance criteria as scenarios
   - Test adapters drive application through driver ports to verify scenarios

10. **Clean Architecture**
    - Robert C. Martin's architecture book
    - Aligns with Hexagonal Architecture principles (dependency inversion, technology independence)
    - References Composition Root concept as "Main Component"

## Identified Concepts

### Core Architectural Concepts

**Technology Agnostic Design**
- Business logic has zero references to technology, frameworks, or real-world devices
- Hexagon contains only what matters for the business problem
- Makes application immune to technology evolution

**Ports (Driver and Driven)**
- **Driver Ports** - Application's API; use case boundary; how external actors trigger functionality
- **Driven Ports** - Application's SPI (Service Provider Interface); interfaces for functionality the app needs but doesn't provide
- Ports define the **application boundary** - external actors can only interact through ports
- Named by purpose (verb + "ing"), not by technology: "for adding products to cart" not "HTTP endpoint"

**Adapters (Driver and Driven)**
- **Driver Adapters** - Convert technology requests into technology-agnostic port calls (examples: test frameworks, CLIs, GUIs, REST controllers, event subscribers)
- **Driven Adapters** - Implement driven ports using specific technology (examples: mock adapters, SQL adapters, email adapters, event publishers)
- Minimum **two adapters per port**: one real, one for testing

**Application Boundary**
- The hexagon edge where ports are located
- Enforces **Information Hiding Principle** - internal implementation hidden from external actors
- Only ports are visible from outside world

### Dependency Management Concepts

**API vs SPI**
- **API (Application Programming Interface)** - Driver ports collectively form the application's API
- **SPI (Service Provider Interface)** - Driven ports collectively form what the application requires from external services

**Required Interface**
- Martin Fowler's concept: interfaces defining what a component needs from environment
- Driven ports are Required Interfaces - they specify what app needs from driven actors

**Mock Adapters**
- Driven adapters mimicking real secondary actors without actual connections
- Essential for testing hexagon in isolation
- Example: in-memory database simulating real database behavior

### Testing and Quality Concepts

**Testability in Isolation**
- Ability to test application without real external systems
- Achieved through test driver adapters + mock driven adapters
- Enables complete control over testing environment

**Test Types Hierarchy** (from Nat Pryce)
- **Unit Tests** - Single objects inside hexagon
- **Integration Tests** - Adapters (translation between ports and outside world)
- **Acceptance Tests** - Driver ports in isolation (verifies behavior meets user expectations)
- **System Tests** - Whole system including deployment and startup

**Separation of Concerns**
- Hexagon contains only business logic
- All technology concerns pushed to adapters outside hexagon
- Makes code easier to locate, modify, understand

**Business Logic Decoupling**
- Business logic completely decoupled from technology choices
- Technology changes only affect adapters, never the hexagon
- Foundation of pattern's flexibility and maintainability

**Technical Debt Reduction**
- Hexagonal Architecture reduces long-term cost of poor decisions
- Increased maintainability and separation of concerns make future changes easier

### Actor and Interaction Concepts

**Actors (Driver and Driven)**
- **Driver Actors (Primary)** - Trigger interactions; users of the application (humans or devices)
- **Driven Actors (Secondary)** - Provide functionality needed by application; two types:
  - **Repository** - Bidirectional (send and retrieve, e.g., database)
  - **Recipient** - Unidirectional (send and forget, e.g., SMTP server)

**Use Case Boundary**
- Driver ports represent the use case boundary
- Define what the application can do and how users interact with it

## Known Limitations and Misconceptions

### Common Misconceptions (According to Article)

1. **NOT a Layered Architecture**
   - Many incorrectly describe it as three layers (domain, ports, adapters)
   - Pattern says nothing about layers
   - It's about hexagon + ports at boundary + adapters outside

2. **Port Location Error**
   - Some show: Actor → Port → Adapter → Hexagon (WRONG)
   - Correct: Actor → Adapter → (Port) Hexagon
   - Ports belong to the hexagon, are part of it, at its boundary

3. **Hexagon Shape Significance**
   - Number six has no special meaning
   - Cockburn chose hexagon because: enough space for drawing, easy to draw, evokes inside/outside better than square
   - Could be pentagon, heptagon, octagon - doesn't matter

4. **Inside Structure is Unspecified**
   - Pattern deliberately says nothing about how to structure code inside hexagon
   - You can use layers, features, DDD, CRUD, even "Big Ball of Mud"
   - That's an independent architectural decision

### Actual Limitations

**Complexity**
- Requires separate modules for hexagon, each adapter, and startup
- Complex structure with many modules and explicit dependencies
- Dependencies must be carefully managed: hexagon depends on nothing, adapters depend on hexagon

**Build Process Performance**
- Many modules mean longer compile times
- Running tests across all modules takes time
- Building and starting entire project can be slow for large systems

**Indirection and Mappings**
- Adapters add extra method calls (indirection)
- May require mapping between application and outside world objects
- Performance overhead though typically negligible

**Not for Small Projects**
- Complexity may not be justified for small/trivial problems
- "The cure is worse than the disease" for simple projects
- Best suited for medium/large projects with long lifecycles

## Recommended Patterns and Practices

### Implementation Order

The article provides a specific sequence for building hexagonal applications:

1. **Test Drivers + Mock Driven** - Implement driver ports driven by tests (BDD scenarios), mock all driven ports
2. **Real Drivers + Mock Driven** - Add real driver adapters (Web UI, REST API), keep mock driven adapters (enables driver testing)
3. **Test Drivers + Real Driven** - Keep test drivers, add real driven adapters (enables driven adapter testing)
4. **Real Drivers + Real Driven** - Full end-to-end with all real adapters

This progressive approach enables testing at every stage.

### Port Design Guidelines

**Naming Convention**
- Name by purpose using gerunds (verb + "ing")
- Template: "this port is for [verb]ing something"
- Good: "for adding products to cart", "for obtaining order information", "for sending notifications"
- Bad: "HTTP port", "database port" (technology-based)

**Granularity Options**
- Can have many ports (one per use case) to follow Single Responsibility Principle
- Or use Command Bus pattern: single port interface with command handler per use case
- Can apply CQRS: separate ports for commands vs queries

**Minimum Adapter Rule**
- Every driver port needs ≥2 adapters: one real driver, one test adapter
- Every driven port needs ≥2 adapters: one real implementation, one mock
- Non-negotiable for proper testing

### When to Use Hexagonal Architecture

**Good Fit**
- Medium to large projects with long lifecycles
- Applications expected to be modified many times over their lifetime
- Systems where technology choices may evolve
- Projects requiring high testability and maintainability

**Still Beneficial Even When**
- Technology is locked/won't change - enables mock adapters for unavailable services
- Supports different runtime environments (dev, test, prod)

**Poor Fit**
- Small projects or trivial problems
- Short-lived applications
- When simplicity is more valuable than flexibility

### Testing Strategy

**Isolation Testing Benefits**
- Run regression tests to ensure changes don't break existing functionality
- Do BDD with test adapters driving acceptance criteria scenarios
- Test each component independently (unit, integration, acceptance, system)

**Test Adapter Responsibilities**
- Test drivers convert test cases into driver port requests
- Mock driven adapters mimic real behavior without actual connections
- Enables complete control over test environment

### Composition Root Responsibilities

The startup component must:
1. Initialize and configure environment (databases, servers)
2. For each driven port: choose an adapter, create instance
3. Create application instance, injecting driven adapters into constructor
4. For each driver port: choose adapter, create instance (injecting app), run it

## Gotchas to Avoid

1. **Don't Expose Ports Outside Hexagon** - Ports ARE the hexagon boundary, not separate from it. They belong to and are part of the hexagon.

2. **Don't Let Application Depend on Adapters** - Dependency always points inward. Hexagon depends on nothing (or just language utilities). Adapters depend on hexagon.

3. **Don't Forget the Asymmetry** - While all adapters depend on hexagon (symmetric), Configurable Dependency works differently on each side (asymmetric). Driver adapters inject the app; app injects driven adapters.

4. **Don't Skip Mock Adapters** - Every driven port MUST have a mock adapter for isolation testing. This is not optional.

5. **Don't Use Technology Names for Ports** - Port names should describe purpose, not technology. "For managing user sessions" not "Redis cache port".

6. **Don't Assume Three Layers** - This is not a layered architecture despite what many articles claim. It's hexagon + boundary + adapters.

7. **Don't Tightly Couple Hexagon Internals** - While the pattern doesn't specify internal structure, whatever structure you choose should still maintain cohesion and low coupling inside the hexagon.

8. **Don't Forget Driver Test Adapters** - Just as driven ports need mocks, driver ports need test adapters. Minimum two adapters per port applies to both sides.

9. **Don't Over-Apply to Tiny Projects** - The complexity overhead isn't worth it for simple, short-lived applications. Be pragmatic about when to apply the pattern.

10. **Don't Ignore Composition Root Complexity** - The startup component can become complex as it wires everything together. Keep it organized and potentially split it into multiple configuration modules.

## Recommended Wiki Pages

### Entity Pages

1. **wiki/entities/hexagonal-architecture.md**
   - Document the pattern itself, its history, structure, and key principles
   - Relationships to Configurable Dependency, Clean Architecture, other patterns

2. **wiki/entities/alistair-cockburn.md**
   - Creator of Hexagonal Architecture
   - Contributions to software architecture field

3. **wiki/entities/configurable-dependency-pattern.md**
   - Foundation pattern enabling Hexagonal Architecture
   - Generalization of Dependency Injection
   - Why it's a better term than DI or IoC

### Concept Pages

4. **wiki/concepts/ports.md**
   - Driver ports (API) vs Driven ports (SPI)
   - Naming conventions and granularity options
   - Relationship to use case boundary and application boundary

5. **wiki/concepts/adapters.md**
   - Driver adapters vs Driven adapters
   - Adapter pattern implementation
   - Minimum two-adapter rule
   - Examples of different adapter types

6. **wiki/concepts/technology-agnostic-design.md**
   - Principle of designing systems independent of technology choices
   - Benefits for longevity and maintainability
   - Broader than just Hexagonal Architecture

7. **wiki/concepts/testing-in-isolation.md**
   - Four test types (unit, integration, acceptance, system)
   - Role of test adapters and mock adapters
   - Benefits of isolation testing

8. **wiki/concepts/application-boundary.md**
   - Defining clear boundaries between business logic and external concerns
   - Information Hiding Principle enforcement
   - Ports as boundary definition

9. **wiki/concepts/composition-root.md**
   - Startup component that assembles the application
   - Responsibilities and implementation approaches
   - Managing complexity as system grows

### Source Page

10. **wiki/sources/hexagonal-architecture-article-2018-08-29.md**
    - This research session as a citable reference
    - Links to all session artifacts
    - Key takeaways and recommended pages

## Session Artifacts

All artifacts for this research session are stored in:
`.kiro/research/sessions/hexagonal-architecture-article/`

### Files Created

1. **session.json** - Session metadata, state tracking, article information
2. **raw-article.md** - Original fetched article content (29,879 bytes)
3. **article-content.json** - Structured intermediate representation with extracted entities and concepts
4. **article-analysis.md** - Detailed analysis with 12 entities, 19 concepts, 15 key insights
5. **findings-summary.md** - This consolidated findings document

### Next Steps

Ready to proceed to **FINALIZE** step where I will ask whether to publish these findings to the wiki. Type `finalize research` when you're ready to move forward.
