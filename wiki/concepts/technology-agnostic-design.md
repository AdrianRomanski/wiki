---
title: Technology Agnostic Design
type: concept
tags: [architecture, design-principle, decoupling, independence, hexagonal-architecture]
sources: [hexagonal-architecture-article-2018-08-29]
created: 2026-06-10
updated: 2026-06-10
---

# Technology Agnostic Design

## Explanation

**Technology Agnostic Design** is the architectural principle of designing software systems so that business logic has **zero references** to specific technologies, frameworks, or real-world devices. The core application contains only what matters for the business problem, remaining completely independent of implementation technologies.

This principle is fundamental to [[Hexagonal Architecture]], where the hexagon (application) is technology-agnostic and all technology concerns are pushed to [[Adapters]] outside the hexagon boundary.

The goal is to make technology a replaceable detail rather than a fundamental constraint. Business logic should be expressed in terms of the business domain, not in terms of HTTP, SQL, JSON, or any other technology.

## Key Principles

### Zero Technology References

The application should have:
- **No** framework dependencies (no Spring annotations, no Angular decorators in business logic)
- **No** infrastructure imports (no database clients, no HTTP libraries)
- **No** technology-specific types (no `HttpRequest`, no `ResultSet`)
- **Only** domain types and business interfaces

### Business Logic Independence

Business rules should be:
- Expressed in domain language
- Free from technology constraints
- Testable without any infrastructure
- Understandable by domain experts

### Technology as Implementation Detail

Technologies should be:
- Isolated to [[Adapters]] outside the application
- Swappable without changing business logic
- Configurable at startup/deployment
- Independent of business rule evolution

## Benefits

### Immunity to Technology Evolution

Technology evolves **faster** than business logic. In traditional applications where business logic is tightly coupled to technology:
- Framework updates require business logic changes
- Technology migrations force complete rewrites
- Business rules accidentally change during tech upgrades

With technology-agnostic design:
- Technology changes affect only adapters
- Business logic remains stable across technology evolution
- Upgrades are isolated and safe

### Delayed Technology Decisions

You can:
- Focus on business logic first
- Defer technology choices until needed
- Make informed decisions based on actual requirements
- Avoid premature optimization and commitment

### Flexibility

Enables:
- Swapping technologies by changing configuration
- A/B testing different technology stacks
- Supporting multiple technologies simultaneously
- Environment-specific technology choices (dev vs prod)

### Testability

Allows:
- Testing business logic without any infrastructure
- Running tests without databases, servers, or external services
- Fast test execution (no I/O)
- Deterministic tests (no external dependencies)

## Applications

### Hexagonal Architecture Implementation

The hexagon contains only technology-agnostic business logic:

```typescript
// Inside hexagon - technology agnostic
export class OrderManagement {
  constructor(
    private orderRepo: OrderRepository,      // Port (interface)
    private paymentGateway: PaymentGateway,  // Port (interface)
    private notifier: Notifier               // Port (interface)
  ) {}
  
  async placeOrder(customerId: string, items: OrderItem[]): Promise<OrderId> {
    // Pure business logic - no technology references
    const order = this.createOrder(customerId, items);
    
    if (!this.validateOrder(order)) {
      throw new InvalidOrderError('Order validation failed');
    }
    
    const total = this.calculateTotal(order);
    const transactionId = await this.paymentGateway.charge(
      total,
      customerId
    );
    
    order.markAsPaid(transactionId);
    await this.orderRepo.save(order);
    
    await this.notifier.sendOrderConfirmation(customerId, order);
    
    return order.id;
  }
  
  private validateOrder(order: Order): boolean {
    return order.items.length > 0 && order.customerId !== null;
  }
  
  private calculateTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

Notice:
- No HTTP types, SQL queries, or framework annotations
- Only domain types (`Order`, `OrderItem`, `OrderId`)
- Dependencies on interfaces ([[Ports]]), not concrete implementations
- Business logic expressed in domain terms

### Technology in Adapters

Technology lives exclusively in [[Adapters]]:

```typescript
// Outside hexagon - technology specific (PostgreSQL)
export class PostgresOrderRepository implements OrderRepository {
  constructor(private db: Pool) {} // PostgreSQL-specific
  
  async save(order: Order): Promise<void> {
    // Technology-specific SQL code
    await this.db.query(
      'INSERT INTO orders (id, customer_id, total, status) VALUES ($1, $2, $3, $4)',
      [order.id, order.customerId, order.total, order.status]
    );
    
    for (const item of order.items) {
      await this.db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.productId, item.quantity, item.price]
      );
    }
  }
}
```

```typescript
// Outside hexagon - technology specific (Express HTTP)
export class OrderController {
  constructor(private orderService: OrderManagement) {}
  
  @Post('/orders')
  async createOrder(@Body() request: CreateOrderRequest): Promise<Response> {
    // Technology-specific HTTP handling
    try {
      const orderId = await this.orderService.placeOrder(
        request.customerId,
        request.items
      );
      return { orderId, status: 201 };
    } catch (error) {
      return { error: error.message, status: 400 };
    }
  }
}
```

### Clean Separation

The separation is absolute:

| Inside Hexagon | Outside Hexagon (Adapters) |
|---|---|
| Domain types | HTTP types |
| Business rules | SQL queries |
| Port interfaces | Framework annotations |
| Pure logic | Database clients |
| No I/O | I/O operations |
| Fast, deterministic | Slow, non-deterministic |

## Related Concepts

- [[Hexagonal Architecture]] - Architectural pattern enforcing technology agnosticism
- [[Ports]] - Technology-agnostic interfaces defining application boundary
- [[Adapters]] - Technology-specific implementations outside the application
- [[Application Boundary]] - Clear line separating business logic from technology
- [[Dependency Inversion Principle]] - Dependencies point toward abstractions, not concretions
- [[Testing in Isolation]] - Made possible by technology independence

## Examples

### Before: Technology-Coupled

```typescript
// Business logic tightly coupled to Express and PostgreSQL
export class OrderService {
  async createOrder(req: Request, res: Response) {
    // Business logic mixed with HTTP
    const { customerId, items } = req.body;
    
    // Business logic mixed with SQL
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Business validation mixed with data access
      const result = await client.query(
        'INSERT INTO orders (customer_id) VALUES ($1) RETURNING id',
        [customerId]
      );
      const orderId = result.rows[0].id;
      
      // Business calculation
      let total = 0;
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
          [orderId, item.productId, item.quantity]
        );
        total += item.price * item.quantity;
      }
      
      await client.query('COMMIT');
      
      // HTTP response
      res.status(201).json({ orderId, total });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to create order' });
    } finally {
      client.release();
    }
  }
}
```

**Problems:**
- Business logic (`total` calculation, validation) buried in SQL and HTTP code
- Cannot test without database and HTTP framework
- Cannot swap database or HTTP framework without rewriting everything
- Business logic hard to understand due to technology noise

### After: Technology-Agnostic

**Business Logic (Hexagon):**
```typescript
export class OrderManagement {
  constructor(
    private orders: OrderRepository,
    private notifier: Notifier
  ) {}
  
  async placeOrder(customerId: string, items: OrderItem[]): Promise<OrderConfirmation> {
    // Pure business logic
    const order = new Order(customerId, items);
    order.validate();
    
    const total = order.calculateTotal();
    await this.orders.save(order);
    await this.notifier.sendConfirmation(customerId, order.id);
    
    return new OrderConfirmation(order.id, total);
  }
}
```

**HTTP Adapter:**
```typescript
export class OrderController {
  constructor(private orderMgmt: OrderManagement) {}
  
  @Post('/orders')
  async create(@Body() req: CreateOrderRequest, @Res() res: Response) {
    try {
      const confirmation = await this.orderMgmt.placeOrder(
        req.customerId,
        req.items
      );
      res.status(201).json(confirmation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

**PostgreSQL Adapter:**
```typescript
export class PostgresOrderRepository implements OrderRepository {
  constructor(private db: Pool) {}
  
  async save(order: Order): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO orders (id, customer_id, total) VALUES ($1, $2, $3)',
        [order.id, order.customerId, order.total]
      );
      // ... save items
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
```

**Benefits:**
- Business logic clear and testable
- Can test `OrderManagement` with mock repository (no database)
- Can swap PostgreSQL for MongoDB by writing new adapter
- Can swap Express for FastAPI by writing new adapter
- Business logic unchanged during technology changes

### Testing Without Technology

```typescript
describe('OrderManagement', () => {
  it('should calculate total correctly', async () => {
    // No database, no HTTP, no external services
    const mockRepo = new InMemoryOrderRepository();
    const mockNotifier = new MockNotifier();
    const orderMgmt = new OrderManagement(mockRepo, mockNotifier);
    
    const confirmation = await orderMgmt.placeOrder('customer-1', [
      { productId: 'p1', quantity: 2, price: 10 },
      { productId: 'p2', quantity: 1, price: 20 }
    ]);
    
    expect(confirmation.total).toBe(40); // 2*10 + 1*20
  });
});
```

Fast, deterministic, no infrastructure required.

## When to Apply

### Always Apply When
- Building medium/large applications with long lifecycles
- Business logic is complex and likely to evolve
- Technology choices are uncertain or likely to change
- High testability is required
- Multiple technologies need to coexist (e.g., REST + GraphQL + gRPC)

### May Skip When
- Building small, short-lived applications
- Business logic is trivial (simple CRUD)
- Technology is mandated and guaranteed not to change
- Time-to-market is more important than long-term maintainability

## Common Pitfalls

### Leaking Technology into Domain

**Bad:**
```typescript
export class Order {
  @Column()
  id: string;  // Database annotation in domain model
  
  @Column()
  customerId: string;
}
```

**Good:**
```typescript
export class Order {
  constructor(
    public readonly id: string,
    public readonly customerId: string
  ) {}
}
```

### Using Technology Types in Ports

**Bad:**
```typescript
export interface OrderRepository {
  save(order: Order): Promise<QueryResult>;  // PostgreSQL type
}
```

**Good:**
```typescript
export interface OrderRepository {
  save(order: Order): Promise<void>;  // Technology-agnostic
}
```

### Framework Annotations in Business Logic

**Bad:**
```typescript
export class OrderManagement {
  @Inject()  // Framework annotation
  private repo: OrderRepository;
}
```

**Good:**
```typescript
export class OrderManagement {
  constructor(private repo: OrderRepository) {}  // Pure dependency injection
}
```

## References

- [[Hexagonal Architecture Article — 2018-08-29]]
- [[Hexagonal Architecture]]
- [[Ports]]
- [[Adapters]]
- [[Application Boundary]]
- [[Testing in Isolation]]
