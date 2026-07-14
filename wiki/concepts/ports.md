---
title: Ports
type: concept
tags: [hexagonal-architecture, api, spi, interface, boundary]
sources: [hexagonal-architecture-article-2018-08-29, hexagonal-architecture-is-just-an-island-article-2025-01-22]
created: 2026-06-10
updated: 2026-07-14
---

# Ports

## Explanation

In [[Hexagonal Architecture]], **ports** are interfaces that define the application boundary. They specify how the application interacts with the outside world, acting as contracts between the application (hexagon) and external actors.

Ports belong to the application - they are part of the hexagon, not separate from it. They sit at the hexagon boundary (edges in the hexagonal diagram) and enforce the [[Information Hiding Principle]] by preventing external actors from directly accessing the application's internals.

There are two types of ports, corresponding to the two directions of communication:

### Driver Ports (Primary Ports)

**Driver ports** represent the application's **API** (Application Programming Interface). They:
- Offer application functionality to the outside world
- Define the **use case boundary** - what the application can do
- Are **used by** driver adapters
- Are triggered by external actors (drivers) who want to achieve a goal

### Driven Ports (Secondary Ports)

**Driven ports** represent the application's **SPI** (Service Provider Interface). They:
- Define functionality the application needs but doesn't provide itself
- Are **implemented by** driven adapters
- Are triggered by the application when it needs external services
- Act as **Required Interfaces** - specifying what the app requires from the environment

## Key Principles

### Naming Convention

Ports should be named according to **what they are for**, not according to technology. Use a verb ending with "ing" and complete the sentence: "this port is for [verb]ing something."

**Good Examples:**
- "for adding products to the shopping cart"
- "for obtaining information about orders"
- "for sending notifications"
- "for managing user sessions"

**Bad Examples (Technology-Based):**
- "HTTP port"
- "database port"
- "Redis cache port"
- "REST API port"

### Dependency Direction

- **Driver ports** - Driver adapters depend on driver ports; the application doesn't know which driver is using it
- **Driven ports** - The application depends on driven port interfaces; driven adapters implement these interfaces

Both cases follow the [[Configurable Dependency Pattern]]: dependencies point toward the hexagon through interfaces.

### Ports ARE the Application Boundary

Ports are not separate from the hexagon - they **are** the hexagon boundary. External actors cannot access the inside of the hexagon directly; they can only interact through ports.

**Correct understanding:** `Actor → Adapter → (Port) Hexagon`

**Common mistake:** `Actor → Port → Adapter → Hexagon` (ports shown outside adapters)

## Applications

### Organizing Driver Ports

**Granularity Options:**

1. **One port per use case** - Follows Single Responsibility Principle strictly
   - Results in many small port interfaces
   - Each interface has a single, focused purpose

2. **Command Bus pattern** - One port interface with multiple command handlers
   - Single port handles multiple use cases
   - Each use case implemented as a command handler
   - Can combine with CQRS (separate command port and query port)

**Example - Fine-Grained Ports:**
```typescript
// One port per use case
export interface AddProductToCart {
  execute(productId: string, quantity: number): Promise<void>;
}

export interface RemoveProductFromCart {
  execute(productId: string): Promise<void>;
}

export interface CalculateCartTotal {
  execute(): Promise<number>;
}
```

**Example - Command Bus:**
```typescript
// Single port with command handlers
export interface ExecuteCommand {
  execute<T>(command: Command): Promise<T>;
}

// Commands
export class AddProductCommand {
  constructor(
    public productId: string,
    public quantity: number
  ) {}
}

export class RemoveProductCommand {
  constructor(public productId: string) {}
}
```

### Defining Driven Ports

Driven ports specify what the application needs from external services. They are technology-agnostic interfaces.

**Example - Repository Port:**
```typescript
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**Example - Notification Port:**
```typescript
export interface NotificationService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSMS(to: string, message: string): Promise<void>;
}
```

**Example - Event Publishing Port:**
```typescript
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
```

## Related Concepts

- [[Adapters]] - Technology-specific implementations that connect to ports
- [[Application Boundary]] - Ports define where the application ends and the outside world begins
- [[Hexagonal Architecture]] - The architectural pattern that uses ports and adapters
- [[Configurable Dependency Pattern]] - The dependency management pattern enabling ports
- [[API vs SPI]] - Driver ports form the API; driven ports form the SPI
- [[Use Case Boundary]] - Driver ports represent the use case boundary

## Examples

### Driver Port with Multiple Adapters

**Port Definition:**
```typescript
// Driver port - application's API
export interface ManageOrders {
  createOrder(items: OrderItem[]): Promise<string>;
  cancelOrder(orderId: string): Promise<void>;
  getOrderStatus(orderId: string): Promise<OrderStatus>;
}
```

**REST Adapter (Driver):**
```typescript
export class OrdersRestController {
  constructor(private orderService: ManageOrders) {}
  
  @Post('/orders')
  async create(@Body() request: CreateOrderRequest) {
    const orderId = await this.orderService.createOrder(request.items);
    return { orderId };
  }
  
  @Delete('/orders/:id')
  async cancel(@Param('id') id: string) {
    await this.orderService.cancelOrder(id);
    return { status: 'cancelled' };
  }
}
```

**Test Adapter (Driver):**
```typescript
export class OrdersTestAdapter {
  constructor(private orderService: ManageOrders) {}
  
  async testOrderCreation() {
    const orderId = await this.orderService.createOrder([
      { productId: 'p1', quantity: 2 }
    ]);
    
    const status = await this.orderService.getOrderStatus(orderId);
    expect(status).toBe('pending');
  }
}
```

### Driven Port with Multiple Adapters

**Port Definition:**
```typescript
// Driven port - application's SPI
export interface PaymentGateway {
  charge(amount: number, paymentMethod: string): Promise<TransactionId>;
  refund(transactionId: TransactionId): Promise<void>;
}
```

**Stripe Adapter (Driven):**
```typescript
export class StripePaymentAdapter implements PaymentGateway {
  constructor(private stripeClient: StripeClient) {}
  
  async charge(amount: number, paymentMethod: string): Promise<TransactionId> {
    const charge = await this.stripeClient.charges.create({
      amount: amount * 100, // Stripe uses cents
      currency: 'usd',
      source: paymentMethod
    });
    return charge.id;
  }
  
  async refund(transactionId: TransactionId): Promise<void> {
    await this.stripeClient.refunds.create({
      charge: transactionId
    });
  }
}
```

**Mock Adapter (Driven):**
```typescript
export class MockPaymentAdapter implements PaymentGateway {
  private transactions = new Map<TransactionId, number>();
  
  async charge(amount: number, paymentMethod: string): Promise<TransactionId> {
    const id = `mock_tx_${Date.now()}`;
    this.transactions.set(id, amount);
    return id;
  }
  
  async refund(transactionId: TransactionId): Promise<void> {
    this.transactions.delete(transactionId);
  }
  
  // Test helper
  hasTransaction(id: TransactionId): boolean {
    return this.transactions.has(id);
  }
}
```

### Minimum Two Adapters Rule

For proper [[Hexagonal Architecture]] implementation, every port must have at least two adapters:

**Driver Ports:**
- One **real driver** adapter (e.g., REST controller, CLI, GUI)
- One **test driver** adapter (e.g., test framework, BDD scenario runner)

**Driven Ports:**
- One **real driven** adapter (e.g., PostgreSQL, SMTP server, external API)
- One **mock driven** adapter (e.g., in-memory database, fake email sender)

This enables [[Testing in Isolation]] and allows the application to be tested without external dependencies.

### Driver Port Optionality (Nuance)

While the minimum-two-adapters rule applies once a driver port exists, the driver (inbound) port interface itself is not strictly mandatory the way the driven (outbound) port interface is:

- The **driven port is essential** — without it, the application cannot invert its dependency on external services, breaking the Dependency Inversion Principle. The driven port interface must exist for [[Configurable Dependency Pattern]] to work on that side.
- The **driver port is optional** — a driver adapter could call the application service directly without an interface in between, and the application would still function.

Defining a driver port anyway is still recommended, because it provides looser coupling between the adapter and the service, and improves testability by allowing the adapter to be tested against an interface rather than a concrete class. Skipping it is a valid but lesser choice, typically made only for very small or throwaway driver adapters.

## References

- [[Hexagonal Architecture Article — 2018-08-29]]
- [[Hexagonal Architecture is just an island — Article — 2025-01-22]]
- [[Hexagonal Architecture]]
- [[Adapters]]
- [[Application Boundary]]
- [[Technology Agnostic Design]]
- [[Island Analogy for Hexagonal Architecture]]
