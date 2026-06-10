---
title: Hexagonal Architecture Article — 2018-08-29
type: source
author: Juan Manuel Garrido de Paz
date: 2018-08-29
url: https://jmgarridopaz.github.io/content/hexagonalarchitecture.html
tags: [hexagonal-architecture, ports-adapters, alistair-cockburn, architecture-pattern, testability]
created: 2026-06-10
---

# Hexagonal Architecture Article — 2018-08-29

## Metadata

- **Author**: Juan Manuel Garrido de Paz
- **Publication Date**: 2018-08-29
- **URL**: [https://jmgarridopaz.github.io/content/hexagonalarchitecture.html](https://jmgarridopaz.github.io/content/hexagonalarchitecture.html)
- **Type**: Article
- **Research Session**: `.kiro/research/sessions/hexagonal-architecture-article/`

## Key Points

### What is Hexagonal Architecture?

- Architectural pattern created by Dr. Alistair Cockburn in 2005
- Also known as **Ports and Adapters Pattern**
- Structures applications to be **technology-agnostic** by isolating business logic
- Enables applications to be driven by different clients and tested in isolation
- Despite being from 2005, the pattern has become **more relevant** over time due to technology decoupling

### Core Components

**The Hexagon**
- Represents the application containing business logic
- Technology-agnostic with no references to frameworks or infrastructure
- The pattern says nothing about internal structure (can use layers, DDD, CRUD, etc.)
- The hexagonal shape itself is arbitrary - six has no special meaning

**Ports**
- Interfaces defining the application boundary
- Belong to the hexagon, are part of it
- **Driver Ports** - Application's API; use case boundary; what the application offers
- **Driven Ports** - Application's SPI; what the application requires
- Named by purpose (verb + "ing"), not by technology

**Adapters**
- Technology-specific implementations outside the hexagon
- **Driver Adapters** - Convert technology requests into port calls (test frameworks, REST controllers, CLIs, GUIs)
- **Driven Adapters** - Implement driven ports using specific technology (databases, email services, external APIs, mocks)
- Minimum two adapters per port: one real, one for testing

**Actors**
- **Driver Actors** - Trigger interactions (users, other systems)
- **Driven Actors** - Provide services needed by application
  - **Repository** - Bidirectional (databases)
  - **Recipient** - Unidirectional (email servers)

### Foundation: Configurable Dependency Pattern

- Generalization of Dependency Injection coined by Gerard Meszaros
- All dependencies point **inward** toward the hexagon
- Driver side: Adapter depends on application (adapter uses driver port)
- Driven side: Application depends on driven port interface (adapter implements it)
- Enables runtime adapter selection through configuration

### Symmetry and Asymmetry

The pattern exhibits both:

**Symmetry** - All adapters depend on the hexagon; application is technology-agnostic on both sides

**Asymmetry** - Configurable Dependency works differently:
- **Driver side:** Application doesn't know which driver is using it
- **Driven side:** Application knows which driven adapter to talk to (initiates conversation)

Initially called "Symmetrical Asymmetry," later refined to "Asymmetrical Symmetry"

## Insights

### Common Misconceptions Clarified

1. **Not a Layered Architecture** - Despite many articles claiming three layers (domain, ports, adapters), the pattern says nothing about layers. It's about hexagon + ports at boundary + adapters outside.

2. **Port Location** - Ports are NOT outside adapters. Correct: `Actor → Adapter → (Port) Hexagon`. Ports ARE the hexagon boundary.

3. **Hexagon Shape** - Number six is meaningless. Chosen because it's easy to draw, provides space for ports, and evokes inside/outside better than a square.

4. **Internal Structure** - The pattern deliberately doesn't specify how to structure code inside the hexagon. That's an independent decision.

### Testing Benefits

**Four Test Types** (from Nat Pryce):
1. **Unit Tests** - Single objects inside hexagon
2. **Integration Tests** - Adapters (verify port-to-technology translation)
3. **Acceptance Tests** - Driver ports in isolation (verify behavior meets expectations)
4. **System Tests** - Whole system including deployment

**Minimum Two Adapters Rule:**
- Every driver port needs: one real driver, one test driver
- Every driven port needs: one real adapter, one mock adapter
- Non-negotiable for proper implementation

### When to Apply

**Good Fit:**
- Medium/large projects with long lifecycles
- Applications expected to be modified frequently
- Systems where technology may evolve

**Still Beneficial:**
- Even when technology won't change (enables mocks for unavailable services)
- Supports different runtime environments (dev, test, prod)

**Poor Fit:**
- Small projects or trivial problems
- "The cure is worse than the disease"

### Implementation Order

Progressive four-step approach:
1. **Test Drivers + Mock Driven** - Test business logic in isolation
2. **Real Drivers + Mock Driven** - Test driver adapters
3. **Test Drivers + Real Driven** - Test driven adapters
4. **Real Drivers + Real Driven** - Full end-to-end system

This enables testing at every stage.

## Relevant Entities

- [[Hexagonal Architecture]] - The architectural pattern itself
- [[Alistair Cockburn]] - Creator of the pattern (2005)
- [[Configurable Dependency Pattern]] - Foundation pattern enabling hexagonal architecture
- Dependency Injection - Implementation technique for configurable dependency
- Inversion of Control - Alternative name for dependency injection
- [[Composition Root]] - Startup component that assembles the system
- Command Bus - Design pattern for organizing driver ports
- CQRS - Pattern for separating commands from queries
- BDD (Behaviour Driven Development) - Test approach using acceptance scenarios
- Clean Architecture - Robert C. Martin's architecture aligning with hexagonal principles

## Relevant Concepts

- [[Technology Agnostic Design]] - Core principle: business logic free from technology references
- [[Ports]] - Interfaces defining application boundary (driver ports = API, driven ports = SPI)
- [[Adapters]] - Technology-specific implementations (driver adapters use ports, driven adapters implement ports)
- [[Application Boundary]] - Clear separation between business logic and external world
- Information Hiding Principle - Application internals hidden behind ports
- Single Responsibility Principle - Applied to port granularity
- [[Testing in Isolation]] - Test business logic without external systems using mocks
- Separation of Concerns - Business logic vs technology concerns
- Business Logic Decoupling - Changes to technology don't affect business rules
- Technical Debt Reduction - Maintainability reduces long-term costs
- Use Case Boundary - Driver ports represent use cases
- API vs SPI - Driver ports = API, driven ports = SPI
- Required Interface - Driven ports specify what application requires
- Mock Adapters - Simulate real behavior for testing
- Test-Driven Development - Enabled by test adapters
- Symmetry vs Asymmetry in Architecture - Coexistence of symmetric and asymmetric properties

## Quotes

> "Isn't the article too old? How is it that it is still worth it nowadays, being software development a discipline in continous evolution where new technologies and frameworks arise every day and kill the one we used yesterday?"
> 
> "Well the answer is in the question. Ports & Adapters is a pattern that promotes decoupling from technology and frameworks. So no, it isn't too old. Good things are timeless. They are like wine, they get better as time passes by."

---

> "The main idea of Ports & Adapters is to define the structure of an application so that it could be run by different kinds of clients (humans, tests cases, other applications, …), and it could be tested in isolation from external devices of the real world that the application depends on."

---

> "Ports are the application boundary... Ports are interfaces that the application offers to the outside world for allowing actors interact with the application. So the application should follow the Information Hiding Principle."

---

> "For each driver port, there should be at least two adapters: one for the real driver that is going to run it, and another one for testing the behaviour of the port."

---

> "Configurable Dependency is the most important pattern that Ports & Adapters Architecture is based on, as it allows the hexagon to be decoupled from any techonology."

---

> "When the pattern was written in 2005, what the author wanted to show is that the asymmetry of the traditional layered architecture (user side vs data side), was in fact symmetrical. He did it by drawing an hexagon and putting both UI and database outside. Database is the same as UI, just technology, the application doesn't know about it."

---

> "Many articles I've read about this architecture say that it is a layered one. They talk about three layers: domain, ports, adapters. I don't know why they say such thing, the pattern says nothing about layers."

---

> "For small projects, maybe 'the cure is worse than the disease', so that solving trivial problems doesn't deserve the extra complexity added by the architecture. For medium/large projects, which are supposed to have a long life cycle, and are supposed to be modified many times during their lifetime, using Hexagonal Architecture will be worth it in the long-term."

## Session Artifacts

This source was analyzed during the article research session stored at:
`.kiro/research/sessions/hexagonal-architecture-article/`

### Research Artifacts

- **session.json** - Session metadata and state
- **raw-article.md** - Original article content (29,879 bytes)
- **article-content.json** - Structured extraction (entities, concepts, metadata)
- **article-analysis.md** - Detailed analysis with 12 entities, 19 concepts, 15 insights
- **findings-summary.md** - Consolidated findings document

### Wiki Pages Created

From this research session, the following wiki pages were generated:

**Entity Page:**
- [[Hexagonal Architecture]] - Complete pattern documentation

**Concept Pages:**
- [[Ports]] - Driver and driven port interfaces
- [[Adapters]] - Driver and driven adapter implementations
- [[Technology Agnostic Design]] - Principle of technology independence
- [[Testing in Isolation]] - Testing without external systems
- [[Application Boundary]] - Clear separation of concerns
- [[Composition Root]] - Startup assembly component

**Source Page:**
- This page

## Related References

- Original Alistair Cockburn article: [Hexagonal Architecture (2005)](https://web.archive.org/web/20180822100852/http://alistair.cockburn.us/Hexagonal+architecture)
- Configurable Dependency: [Alistair Cockburn's article](https://web.archive.org/web/20170624023207/http://alistair.cockburn.us/Configurable+Dependency)
- Robert C. Martin: "Clean Architecture: A Craftsman's Guide to Software Structure and Design"
- Mark Seemann: [Composition Root](http://blog.ploeh.dk/2011/07/28/CompositionRoot/)
- Martin Fowler: [Inversion of Control](https://martinfowler.com/bliki/InversionOfControl.html)
- Martin Fowler: [Required Interface](https://martinfowler.com/bliki/RequiredInterface.html)
- Nat Pryce: [Visualising Test Terminology](http://www.natpryce.com/articles/000772.html)
