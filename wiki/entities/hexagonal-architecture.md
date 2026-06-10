---
title: Hexagonal Architecture
type: entity
tags: [architecture, design-pattern, ports-adapters, alistair-cockburn, testability]
sources: [hexagonal-architecture-article-2018-08-29]
created: 2026-06-10
updated: 2026-06-10
---

# Hexagonal Architecture

## Definition

Hexagonal Architecture (also known as the **Ports and Adapters Pattern**) is an architectural pattern created by Dr. Alistair Cockburn in 2005. It structures applications to be technology-agnostic by isolating business logic inside a "hexagon" and connecting to the outside world exclusively through **ports** (interfaces) and **adapters** (technology-specific implementations).

The core principle is that all dependencies point **inward** toward the application, never outward. This enables applications to be driven by different clients (humans, tests, other applications) and tested in isolation from external systems (databases, servers, APIs).

## Properties

### Core Components

**The Hexagon (Application)**
- Contains business logic with no references to technology, frameworks, or real-world devices
- Technology-agnostic by design
- The pattern says nothing about internal structure (can use layers, features, DDD, CRUD, etc.)

**Ports**
- Interfaces defining the application boundary
- **Driver Ports** - Application's API; use case boundary; how external actors trigger functionality
- **Driven Ports** - Application's SPI (Service Provider Interface); interfaces for functionality the app needs but doesn't provide
- Named by purpose (verb + "ing"), not by technology: "for adding products to cart" not "HTTP endpoint"

**Adapters**
- Technology-specific implementations connecting to ports
- **Driver Adapters** - Convert technology requests into technology-agnostic port calls (test frameworks, CLIs, GUIs, REST controllers, event subscribers)
- **Driven Adapters** - Implement driven ports using specific technology (mock adapters, SQL adapters, email adapters, event publishers)
- Minimum two adapters per port: one real, one for testing

**Actors**
- **Driver Actors (Primary)** - Trigger interactions; users of the application
- **Driven Actors (Secondary)** - Provide functionality needed by application
  - **Repository** - Bidirectional (send and retrieve, e.g., database)
  - **Recipient** - Unidirectional (send and forget, e.g., SMTP server)

### Architectural Principles

**Dependency Direction**
- All dependencies point inward toward the hexagon
- Hexagon depends on nothing (or just language utilities)
- Adapters depend on hexagon
- Based on [[Configurable Dependency Pattern]]

**Symmetry and Asymmetry**
- **Symmetry** - All adapters (driver and driven) depend on the hexagon; application is technology-agnostic on both sides
- **Asymmetry** - Configurable Dependency works differently:
  - **Driver side:** Adapter knows about application; application doesn't know which driver is driving it
  - **Driven side:** Application knows about the driven adapter it must talk to (since it initiates the conversation)

**Technology Agnosticism**
- Business logic remains stable as technologies evolve
- Technology changes only affect adapters, never the hexagon
- Enables swapping technologies through configuration

### The Hexagon Shape

The hexagonal shape itself is **arbitrary** - the number six has no special meaning. Alistair Cockburn chose a hexagon because:
- Provides enough space for drawing multiple ports
- Easy to draw
- Evokes inside/outside asymmetry better than a square
- Could be pentagon, heptagon, octagon - shape doesn't matter

## Relationships

### Foundation Patterns
- Built on [[Configurable Dependency Pattern]] - the core enabling pattern
- Related to [[Dependency Injection]] and [[Inversion of Control]]
- Uses [[Composition Root]] for application assembly

### Complementary Patterns
- Can apply [[Command Bus]] pattern to organize driver ports
- Can apply [[CQRS]] to separate command and query ports
- Aligns with [[Clean Architecture]] principles

### Testing Approaches
- Enables [[Testing in Isolation]] through mock adapters
- Supports [[BDD (Behaviour Driven Development)]] via test adapters
- Implements the [[Adapter Design Pattern]] for technology bridging

### Core Concepts
- Enforces [[Application Boundary]] through ports
- Implements [[Technology Agnostic Design]]
- Achieves [[Separation of Concerns]] between business logic and technology

## Examples

### Basic Port Definition

**Driver Port (TypeScript)**
```typescript
// Named by purpose, not technology
export interface ManageShoppingCart {
  addProduct(productId: string, quantity: number): Promise<void>;
  removeProduct(productId: string): Promise<void>;
  getCartTotal(): Promise<number>;
}
```

**Driven Port (TypeScript)**
```typescript
// Application's SPI - what it needs from the outside world
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
}
```

### Adapter Implementation

**Driver Adapter - REST Controller**
```typescript
// Converts HTTP requests to port calls
export class ShoppingCartController {
  constructor(private cartService: ManageShoppingCart) {}
  
  @Post('/cart/items')
  async addItem(@Body() request: AddItemRequest) {
    // Technology-specific (HTTP) → Technology-agnostic (port)
    await this.cartService.addProduct(
      request.productId,
      request.quantity
    );
    return { status: 'added' };
  }
}
```

**Driven Adapter - PostgreSQL Repository**
```typescript
// Implements driven port using specific technology
export class PostgresProductRepository implements ProductRepository {
  constructor(private db: PostgresClient) {}
  
  async findById(id: string): Promise<Product | null> {
    // Technology-agnostic (port) → Technology-specific (SQL)
    const result = await this.db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToProduct(result.rows[0]) : null;
  }
  
  async save(product: Product): Promise<void> {
    await this.db.query(
      'INSERT INTO products (id, name, price) VALUES ($1, $2, $3)',
      [product.id, product.name, product.price]
    );
  }
}
```

**Mock Driven Adapter - In-Memory Repository**
```typescript
// Enables testing in isolation
export class InMemoryProductRepository implements ProductRepository {
  private products = new Map<string, Product>();
  
  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }
  
  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }
}
```

### Composition Root

```typescript
// Assembles the entire application at startup
export class ApplicationBootstrap {
  static createApplication(): Application {
    // 1. Initialize environment
    const dbClient = new PostgresClient(config.database);
    
    // 2. Create driven adapters
    const productRepo = new PostgresProductRepository(dbClient);
    const emailService = new SmtpEmailAdapter(config.smtp);
    
    // 3. Create application, injecting driven adapters
    const app = new ShoppingApplication(productRepo, emailService);
    
    // 4. Create and configure driver adapters
    const restController = new ShoppingCartController(app);
    const testAdapter = new ShoppingCartTestAdapter(app);
    
    return app;
  }
}
```

## Benefits

### Testability
- Test application in isolation from external systems
- Use test driver adapters for automated testing
- Use mock driven adapters to simulate external dependencies
- Supports regression testing, BDD, acceptance testing

### Maintainability
- Clear separation of concerns makes code easier to locate and modify
- Business logic decoupled from technology reduces technical debt
- Changes to technology only affect adapters

### Flexibility
- Swap technologies by changing adapter configuration
- No source code changes, recompilation, or rebuilding required
- Add new adapters without touching existing code

### Immunity to Technology Evolution
- Business logic remains stable as frameworks evolve
- Technology upgrades isolated to adapters
- Business rules don't change when technology does

### Delayed Technology Decisions
- Focus on business logic first
- Defer technology choices until needed
- Add technology adapters later

## Trade-offs

### Complexity
- Requires separate modules for hexagon, adapters, and startup
- Many modules with explicit dependency management
- Complex structure may not be justified for small projects

### Build Performance
- Many modules increase compile time
- Running tests across modules takes longer
- Startup and assembly overhead

### Indirection
- Extra method calls through adapter layer
- May require object mapping between application and external world
- Performance overhead (typically negligible)

### Not for Small Projects
- Complexity overhead not worth it for trivial problems
- Best suited for medium/large projects with long lifecycles
- "The cure is worse than the disease" for simple applications

## When to Use

### Good Fit
- Medium to large projects with long lifecycles
- Applications expected to be modified many times
- Systems where technology choices may evolve
- Projects requiring high testability and maintainability

### Still Beneficial When
- Technology is locked/won't change - enables mock adapters for unavailable services
- Need to support different runtime environments (dev, test, prod)

### Poor Fit
- Small projects or trivial problems
- Short-lived applications
- When simplicity is more valuable than flexibility

## Common Misconceptions

### Not a Layered Architecture
Many incorrectly describe it as three layers (domain, ports, adapters). The pattern says nothing about layers - it's about hexagon + ports at boundary + adapters outside.

### Port Location
Some show: `Actor → Port → Adapter → Hexagon` (WRONG)

Correct: `Actor → Adapter → (Port) Hexagon`

Ports belong to the hexagon, are part of it, at its boundary.

### Hexagon Shape Significance
The number six has no special meaning. The shape is arbitrary and chosen for practical drawing purposes.

## Implementation Approach

### Progressive Implementation Order

1. **Test Drivers + Mock Driven** - Implement driver ports driven by tests, mock all driven ports
2. **Real Drivers + Mock Driven** - Add real driver adapters, keep mock driven adapters
3. **Test Drivers + Real Driven** - Keep test drivers, add real driven adapters
4. **Real Drivers + Real Driven** - Full end-to-end with all real adapters

This enables testing at every stage.

### Port Design Guidelines

- Name by purpose using gerunds: "for [verb]ing something"
- Can have many ports (one per use case) for Single Responsibility Principle
- Or use Command Bus: single port with command handler per use case
- Minimum two adapters per port (one real, one test/mock)

## References

- [[Hexagonal Architecture Article — 2018-08-29]]
- [[Ports]]
- [[Adapters]]
- [[Technology Agnostic Design]]
- [[Testing in Isolation]]
- [[Application Boundary]]
- [[Composition Root]]
- [[Configurable Dependency Pattern]]
