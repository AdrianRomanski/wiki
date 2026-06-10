---
title: Application Boundary
type: concept
tags: [architecture, boundary, encapsulation, information-hiding, hexagonal-architecture]
sources: [hexagonal-architecture-article-2018-08-29]
created: 2026-06-10
updated: 2026-06-10
---

# Application Boundary

## Explanation

The **Application Boundary** is the clear line separating an application's business logic from the external world. In [[Hexagonal Architecture]], this boundary is defined by [[Ports]] - interfaces that sit at the edges of the hexagon.

The application boundary enforces the **Information Hiding Principle**: external actors can only interact with the application through its ports. They cannot directly access the internals of the hexagon. This creates a protected zone where business logic lives free from external concerns.

The boundary serves two purposes:
1. **Isolation** - Protects business logic from technology changes
2. **Contracts** - Defines explicit contracts for how the outside world interacts with the application

## Key Principles

### Ports ARE the Boundary

In hexagonal architecture, ports are located **at** the hexagon boundary, not outside it. They are part of the hexagon, belonging to the application.

**Correct understanding:**
```
                Outside World
                      ↓
                  Adapter
                      ↓
              ┌───────────────┐
              │  Port         │ ← Boundary is here
              │ ┌───────────┐ │
              │ │           │ │
              │ │ Business  │ │
              │ │ Logic     │ │
              │ │           │ │
              │ └───────────┘ │
              └───────────────┘
                  Hexagon
```

**Common mistake:**
```
Outside World → Port → Adapter → Hexagon
```
(Shows ports outside adapters, which is incorrect)

### One-Way Visibility

From the application boundary:
- **Outward visibility:** The application can "see" port interfaces (it implements driver ports, depends on driven port interfaces)
- **No inward visibility:** External actors cannot see inside the hexagon; they only see ports

This asymmetry protects the application's internals from external changes.

### Information Hiding Principle

The application should hide its implementation details. External actors should only know:
- What ports exist
- What operations each port provides
- What parameters those operations require
- What results those operations return

They should NOT know:
- How the application implements those operations
- What data structures the application uses internally
- What algorithms the application uses
- What other internal components exist

## Applications

### Defining Clear Boundaries

**Port as Boundary:**
```typescript
// Port interface defines the boundary
export interface OrderManagement {
  // What the outside world can do
  placeOrder(customerId: string, items: OrderItem[]): Promise<OrderId>;
  cancelOrder(orderId: OrderId): Promise<void>;
  getOrderStatus(orderId: OrderId): Promise<OrderStatus>;
}

// Implementation is hidden behind the boundary
class OrderManagementImpl implements OrderManagement {
  // Internal details not visible to outside world
  private orderRepository: OrderRepository;
  private paymentGateway: PaymentGateway;
  private inventoryService: InventoryService;
  
  async placeOrder(customerId: string, items: OrderItem[]): Promise<OrderId> {
    // Complex internal logic hidden from external actors
    const order = this.createOrder(customerId, items);
    await this.validateInventory(order);
    await this.processPayment(order);
    await this.reserveInventory(order);
    await this.orderRepository.save(order);
    return order.id;
  }
  
  private createOrder(customerId: string, items: OrderItem[]): Order {
    // Internal implementation detail
  }
  
  private async validateInventory(order: Order): Promise<void> {
    // Internal implementation detail
  }
  
  // More internal methods...
}
```

External actors (adapters) only see the `OrderManagement` interface, not the implementation class or its internal methods.

### Boundary Enforcement

The boundary prevents external code from reaching into the application:

**Bad (No Boundary):**
```typescript
// External code directly manipulates internal state
export class Order {
  public items: OrderItem[] = [];
  public total: number = 0;
  public status: string = 'pending';
}

// Adapter directly modifies internal state
const order = new Order();
order.items.push(item);
order.total += item.price;
order.status = 'confirmed';
```

**Good (Clear Boundary):**
```typescript
// Application exposes only port interface
export interface OrderManagement {
  addItemToOrder(orderId: OrderId, item: OrderItem): Promise<void>;
  confirmOrder(orderId: OrderId): Promise<void>;
}

// Internal Order class is hidden
class Order {
  private items: OrderItem[] = [];
  private total: number = 0;
  private status: OrderStatus = OrderStatus.PENDING;
  
  addItem(item: OrderItem): void {
    this.items.push(item);
    this.total += item.price;
  }
  
  confirm(): void {
    if (this.items.length === 0) {
      throw new Error('Cannot confirm empty order');
    }
    this.status = OrderStatus.CONFIRMED;
  }
}

// Adapter uses port, cannot directly manipulate Order
export class OrderController {
  constructor(private orderMgmt: OrderManagement) {}
  
  @Post('/orders/:id/items')
  async addItem(@Param('id') id: string, @Body() item: OrderItem) {
    await this.orderMgmt.addItemToOrder(id, item);
  }
}
```

### Use Case Boundary

[[Ports#Driver Ports (Primary Ports)|Driver ports]] represent the **use case boundary** - they define what the application can do from a user's perspective.

**Use case boundary example:**
```typescript
// Driver port defines use cases
export interface LibraryManagement {
  // Use case: Borrow a book
  borrowBook(userId: UserId, bookId: BookId): Promise<DueDate>;
  
  // Use case: Return a book
  returnBook(userId: UserId, bookId: BookId): Promise<void>;
  
  // Use case: Search catalog
  searchBooks(query: string): Promise<Book[]>;
  
  // Use case: Reserve a book
  reserveBook(userId: UserId, bookId: BookId): Promise<ReservationId>;
}
```

Each method represents a use case - a goal a user wants to achieve. The port defines the complete set of use cases the application supports.

### Required Services Boundary

[[Ports#Driven Ports (Secondary Ports)|Driven ports]] represent the **required services boundary** - they define what external services the application needs.

**Required services boundary example:**
```typescript
// Driven ports define required external services
export interface BookRepository {
  findById(id: BookId): Promise<Book | null>;
  save(book: Book): Promise<void>;
  search(query: string): Promise<Book[]>;
}

export interface NotificationService {
  sendDueReminder(userId: UserId, bookTitle: string): Promise<void>;
  sendOverdueNotice(userId: UserId, bookTitle: string, daysOverdue: number): Promise<void>;
}

export interface FineCalculator {
  calculateFine(daysOverdue: number, bookValue: number): Promise<number>;
}
```

These driven ports define the application's dependencies on external capabilities. The application boundary makes these dependencies explicit.

## Related Concepts

- [[Hexagonal Architecture]] - Architectural pattern using ports to define boundaries
- [[Ports]] - Interfaces that define and enforce the application boundary
- [[Adapters]] - Stay outside the boundary, bridge between ports and technology
- [[Technology Agnostic Design]] - Enabled by clear boundary separating business logic from technology
- [[Information Hiding Principle]] - Design principle enforced by the boundary
- [[Separation of Concerns]] - Boundary separates business concerns from technical concerns

## Examples

### Boundary Violation Example

**Violation:**
```typescript
// Adapter reaches into hexagon internals
export class OrderController {
  constructor(private orderRepo: OrderRepository) {}  // Directly uses driven port!
  
  @Post('/orders')
  async createOrder(@Body() request: CreateOrderRequest) {
    // Controller implements business logic (boundary violation)
    const order = new Order(request.customerId);
    
    for (const item of request.items) {
      order.addItem(item);
    }
    
    const total = order.calculateTotal();
    if (total > 10000) {
      throw new Error('Order too large');
    }
    
    // Directly calls driven adapter (boundary violation)
    await this.orderRepo.save(order);
    
    return { orderId: order.id };
  }
}
```

**Problems:**
- Business logic (item addition, total calculation, validation) in adapter
- Adapter directly uses driven port (bypasses application)
- No clear boundary - can't test business logic in isolation

**Correct:**
```typescript
// Clear boundary enforced
export class OrderController {
  constructor(private orderMgmt: OrderManagement) {}  // Uses driver port
  
  @Post('/orders')
  async createOrder(@Body() request: CreateOrderRequest) {
    // Adapter only handles HTTP concerns, delegates to application through port
    try {
      const orderId = await this.orderMgmt.createOrder(
        request.customerId,
        request.items
      );
      return { orderId, status: 201 };
    } catch (error) {
      if (error instanceof OrderTooLargeError) {
        return { error: error.message, status: 400 };
      }
      throw error;
    }
  }
}

// Business logic protected inside boundary
class OrderManagementImpl implements OrderManagement {
  constructor(private orderRepo: OrderRepository) {}
  
  async createOrder(customerId: string, items: OrderItem[]): Promise<OrderId> {
    const order = new Order(customerId);
    
    for (const item of items) {
      order.addItem(item);
    }
    
    const total = order.calculateTotal();
    if (total > 10000) {
      throw new OrderTooLargeError();
    }
    
    await this.orderRepo.save(order);
    return order.id;
  }
}
```

### Multiple Boundaries Example

Complex applications may have multiple application boundaries:

```typescript
// Ordering bounded context
export interface OrderManagement {
  placeOrder(customerId: string, items: OrderItem[]): Promise<OrderId>;
}

// Inventory bounded context
export interface InventoryManagement {
  checkAvailability(productId: string): Promise<number>;
  reserve(productId: string, quantity: number): Promise<ReservationId>;
}

// Payment bounded context
export interface PaymentProcessing {
  charge(amount: number, method: PaymentMethod): Promise<TransactionId>;
}
```

Each context has its own boundary defined by its ports. This aligns with Domain-Driven Design's **Bounded Context** pattern.

### Testing Through the Boundary

Tests should interact with the application through the boundary (ports), not by reaching into internals:

**Bad (Violates Boundary):**
```typescript
it('should calculate total correctly', () => {
  const order = new Order('customer-1');
  order.items = [  // Direct property access (violates boundary)
    { productId: 'p1', price: 10, quantity: 2 },
    { productId: 'p2', price: 20, quantity: 1 }
  ];
  
  expect(order.total).toBe(40);  // Direct property access (violates boundary)
});
```

**Good (Respects Boundary):**
```typescript
it('should calculate total correctly', async () => {
  const mockRepo = new MockOrderRepository();
  const orderMgmt: OrderManagement = new OrderManagementImpl(mockRepo);
  
  // Interact through port (driver port boundary)
  const orderId = await orderMgmt.createOrder('customer-1', [
    { productId: 'p1', price: 10, quantity: 2 },
    { productId: 'p2', price: 20, quantity: 1 }
  ]);
  
  const order = await orderMgmt.getOrder(orderId);
  expect(order.total).toBe(40);
});
```

## Benefits

### Changeability
- Internal implementation can change without affecting external actors
- Business logic refactoring doesn't break adapters
- New features can be added without changing the boundary (Open/Closed Principle)

### Testability
- Clear boundary makes [[Testing in Isolation]] possible
- Tests interact through ports, not internal implementation
- Mock adapters replace real adapters outside the boundary

### Understandability
- Ports provide a clear API/SPI specification
- New developers understand the application by reading port interfaces
- Use cases are explicit in driver ports

### Technology Independence
- Boundary separates business logic from technology
- Technology changes stay outside the boundary (in adapters)
- [[Technology Agnostic Design]] protected by boundary

## Common Mistakes

### Ports Outside Adapters
Some incorrectly show: `Actor → Port → Adapter → Hexagon`

This is wrong. Correct: `Actor → Adapter → (Port) Hexagon`

Ports ARE the hexagon boundary, not separate from it.

### Leaky Boundaries
Allowing technology types to cross the boundary:

```typescript
// Bad - HTTP type crosses boundary
export interface OrderManagement {
  createOrder(request: HttpRequest): Promise<HttpResponse>;
}

// Good - Domain types at boundary
export interface OrderManagement {
  createOrder(customerId: string, items: OrderItem[]): Promise<OrderId>;
}
```

### Business Logic in Adapters
Implementing business rules in adapters instead of inside the boundary:

```typescript
// Bad - validation logic in adapter
export class OrderController {
  async create(@Body() req: CreateOrderRequest) {
    if (req.items.length === 0) {  // Business rule in adapter!
      throw new BadRequestException('Empty order');
    }
    await this.orderMgmt.createOrder(req.customerId, req.items);
  }
}

// Good - validation inside boundary
export class OrderManagementImpl implements OrderManagement {
  async createOrder(customerId: string, items: OrderItem[]): Promise<OrderId> {
    if (items.length === 0) {  // Business rule inside hexagon
      throw new EmptyOrderError();
    }
    // ...
  }
}
```

## References

- [[Hexagonal Architecture Article — 2018-08-29]]
- [[Hexagonal Architecture]]
- [[Ports]]
- [[Adapters]]
- [[Technology Agnostic Design]]
- [[Information Hiding Principle]]
