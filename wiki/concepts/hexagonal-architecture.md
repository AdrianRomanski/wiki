---
title: Hexagonal Architecture
type: concept
tags:
  - architecture
  - design-pattern
  - ports-and-adapters
created: 2026-05-30
updated: 2026-05-30
---

# Hexagonal Architecture

## Overview

Hexagonal Architecture (also known as Ports and Adapters) is an architectural pattern that organizes code around the separation between business logic and external concerns. It can be applied to enhance [[Modulith Architecture]] by providing additional structure for how modules interact with external systems and each other.

## Core Principles

### Ports and Adapters
- **Ports:** Interfaces defining how the application interacts with the outside world
- **Adapters:** Implementations that connect ports to specific technologies
- **Core:** Business logic isolated from external dependencies

### Dependency Direction
- External concerns depend on business logic, not vice versa
- Business logic remains independent of frameworks and infrastructure
- Enables testing business logic in isolation

## Application to Modulith Architecture

### Module Organization
Can complement [[Project Types]] in [[Nx]] workspaces:
- **Core/Domain modules:** Business logic (feature libraries)
- **Port modules:** Interface definitions (utility libraries)
- **Adapter modules:** External integrations (data-access libraries)

### Boundary Definition
Enhances [[Module Boundary Rules]] by:
- Clearly separating business logic from infrastructure
- Defining explicit interfaces between layers
- Enabling independent evolution of adapters

## Related Concepts

- [[Modulith Architecture]] - Can be enhanced by hexagonal principles
- [[Architecture]] - Broader architectural context
- [[Domain Driven Design]] - Often used together with hexagonal architecture

## Sources

- [[The virtuous cycle of workspace structure]] - Mentions hexagonal architecture as complementary to modulith pattern
