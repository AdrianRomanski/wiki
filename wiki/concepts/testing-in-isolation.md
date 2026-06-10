---
title: Testing in Isolation
type: concept
tags: [testing, hexagonal-architecture, mock, testability, quality]
sources: [hexagonal-architecture-article-2018-08-29]
created: 2026-06-10
updated: 2026-06-10
---

# Testing in Isolation

## Explanation

**Testing in Isolation** is the practice of testing an application's business logic without connecting to real external systems like databases, web servers, email services, or third-party APIs. The application is tested using **test driver adapters** on the input side and **mock driven adapters** on the output side.

This is the primary benefit of [[Hexagonal Architecture]]. By isolating the application (hexagon) from the outside world through [[Ports]] and [[Adapters]], you can test business logic independently of infrastructure.

Isolation testing provides:
- **Faster tests** - No I/O means tests run in milliseconds, not seconds
- **Deterministic tests** - No external dependencies means no flakiness
- **Complete control** - You control all inputs and can verify all outputs
- **Environment independence** - Tests run anywhere without setup

## Key Principles

### Test Adapters Replace Real Adapters

Instead of using real adapters (REST controllers, PostgreSQL repositories, SMTP email senders), use:

**Test Driver Adapters** - Convert test scenarios into driver port calls
- Replace real driver adapters (REST controllers, CLIs, GUIs)
- Allow automated test frameworks to drive the application
- Enable BDD scenarios to execute against driver ports

**Mock Driven Adapters** - Implement driven ports without real external systems
- Replace real driven adapters (database clients, email services, external APIs)
- Simulate behavior of real systems
- Allow verification of application's interactions with external world

### Four Types of Tests

Nat Pryce (co-author of "Growing Object-Oriented Software, Guided by Tests") defines four test types for hexagonal architecture:

1. **Unit Tests** - Test single objects inside the hexagon
2. **Integration Tests** - Test adapters (ensure correct translation between ports and technology)
3. **Acceptance Tests** - Test driver ports (hexagon in isolation, verify behavior meets user expectations)
4. **System Tests** - Test whole system (adapters + hexagon + deployment)

**Testing in Isolation** primarily refers to **Acceptance Tests** - testing the hexagon through driver ports using mock driven adapters.

### Test Pyramid Application

```
       System Tests           ← Few, slow, complete system
      /            \
     /  Acceptance   \        ← More, fast, hexagon in isolation
    /    Tests        \
   /                   \
  /  Integration Tests  \    ← Many, fast, individual adapters
 /                       \
/      Unit Tests         \  ← Most, fastest, individual objects
---------------------------
```

## Applications

### Basic Isolation Test Setup

```typescript
describe('OrderManagement in isolation', () => {
  let orderMgmt: OrderManagement;
  let mockOrderRepo: MockOrderRepository;
  let mockPaymentGateway: MockPaymentGateway;
  let mockNotifier: MockNotifier;
  
  beforeEach(() => {
    // Use mock driven adapters - no real infrastructure
    mockOrderRepo = new MockOrderRepository();
    mockPaymentGateway = new MockPaymentGateway();
    mockNotifier = new MockNotifier();
    
    // Create application with mocks injected
    orderMgmt = new OrderManagement(
      mockOrderRepo,
      mockPaymentGateway,
      mockNotifier
    );
  });
  
  it('should create order with correct total', async () => {
    // Test driver adapter calls driver port
    const orderId = await orderMgmt.placeOrder('customer-1', [
      { productId: 'p1', quantity: 2, price: 10.00 },
      { productId: 'p2', quantity: 1, price: 15.00 }
    ]);
    
    // Verify through mock
    const savedOrder = mockOrderRepo.findById(orderId);
    expect(savedOrder.total).toBe(35.00);
  });
  
  it('should charge payment gateway with correct amount', async () => {
    await orderMgmt.placeOrder('customer-1', [
      { productId: 'p1', quantity: 3, price: 20.00 }
    ]);
    
    // Verify interaction with mock
    expect(mockPaymentGateway.getLastCharge().amount).toBe(60.00);
  });
  
  it('should send confirmation notification', async () => {
    const orderId = await orderMgmt.placeOrder('customer-1', [
      { productId: 'p1', quantity: 1, price: 100.00 }
    ]);
    
    // Verify notification was sent
    expect(mockNotifier.wasSentTo('customer-1')).toBe(true);
    expect(mockNotifier.getLastMessage()).toContain(orderId);
  });
});
```

**Key characteristics:**
- No database connection
- No HTTP server
- No email service
- No external dependencies
- Runs in milliseconds
- Completely deterministic

### Mock Driven Adapter Implementation

Mock adapters implement driven ports but store data in memory:

```typescript
export class MockOrderRepository implements OrderRepository {
  private orders = new Map<OrderId, Order>();
  
  async save(order: Order): Promise<void> {
    // In-memory storage - instant, deterministic
    this.orders.set(order.id, this.deepCopy(order));
  }
  
  async findById(id: OrderId): Promise<Order | null> {
    const order = this.orders.get(id);
    return order ? this.deepCopy(order) : null;
  }
  
  async findAll(): Promise<Order[]> {
    return Array.from(this.orders.values()).map(o => this.deepCopy(o));
  }
  
  // Test helpers
  clear(): void {
    this.orders.clear();
  }
  
  count(): number {
    return this.orders.size;
  }
  
  private deepCopy(order: Order): Order {
    return JSON.parse(JSON.stringify(order));
  }
}
```

```typescript
export class MockPaymentGateway implements PaymentGateway {
  private charges: Array<{ amount: number; method: string }> = [];
  
  async charge(amount: number, paymentMethod: string): Promise<TransactionId> {
    this.charges.push({ amount, paymentMethod });
    return `mock_tx_${Date.now()}`;
  }
  
  async refund(transactionId: TransactionId): Promise<void> {
    // Simulate refund - no actual payment processing
  }
  
  // Test helpers
  getLastCharge() {
    return this.charges[this.charges.length - 1];
  }
  
  getTotalCharged(): number {
    return this.charges.reduce((sum, c) => sum + c.amount, 0);
  }
  
  clear(): void {
    this.charges = [];
  }
}
```

### BDD with Test Adapters

Behavior-Driven Development uses test adapters to run acceptance scenarios:

```typescript
export class OrderTestAdapter {
  constructor(private orderMgmt: OrderManagement) {}
  
  async scenario_customer_places_order_successfully() {
    // Given: Customer wants to buy products
    const customerId = 'customer-1';
    const items = [
      { productId: 'laptop', quantity: 1, price: 1200.00 },
      { productId: 'mouse', quantity: 2, price: 25.00 }
    ];
    
    // When: Customer places order
    const orderId = await this.orderMgmt.placeOrder(customerId, items);
    
    // Then: Order is created with correct total
    const order = await this.orderMgmt.getOrder(orderId);
    expect(order).toBeDefined();
    expect(order.total).toBe(1250.00);
    expect(order.status).toBe('confirmed');
  }
  
  async scenario_insufficient_payment_rejects_order() {
    // Given: Payment gateway will reject charge
    const mockGateway = this.getMockGateway();
    mockGateway.setNextChargeToFail();
    
    // When: Customer attempts to place order
    const promise = this.orderMgmt.placeOrder('customer-1', [
      { productId: 'expensive-item', quantity: 1, price: 10000.00 }
    ]);
    
    // Then: Order is rejected
    await expect(promise).rejects.toThrow('Payment failed');
  }
}
```

### Regression Testing

Isolation tests enable fast regression test suites:

```typescript
describe('Order Management Regression Suite', () => {
  let testAdapter: OrderTestAdapter;
  
  beforeEach(() => {
    const mocks = createMockDrivenAdapters();
    const app = new OrderManagement(
      mocks.orderRepo,
      mocks.paymentGateway,
      mocks.notifier
    );
    testAdapter = new OrderTestAdapter(app);
  });
  
  it('Feature: Basic order placement', async () => {
    await testAdapter.scenario_customer_places_order_successfully();
  });
  
  it('Feature: Payment validation', async () => {
    await testAdapter.scenario_insufficient_payment_rejects_order();
  });
  
  it('Feature: Order cancellation', async () => {
    await testAdapter.scenario_customer_cancels_order();
  });
  
  // Hundreds more scenarios can run in seconds
});
```

## Related Concepts

- [[Hexagonal Architecture]] - Architectural pattern enabling isolation testing
- [[Ports]] - Interfaces that define testable boundaries
- [[Adapters]] - Mock adapters simulate real behavior for testing
- [[Technology Agnostic Design]] - Business logic free from infrastructure enables testing without infrastructure
- [[Composition Root]] - Assembles application with mock adapters for testing

## Examples

### Comparison: With vs Without Isolation

**Without Isolation (Integration Test):**
```typescript
describe('OrderService integration test', () => {
  let db: PostgresClient;
  let app: Express;
  
  beforeAll(async () => {
    // Start test database
    db = await createTestDatabase();
    await db.migrate();
    
    // Start web server
    app = createApp(db);
    await app.listen(3001);
  });
  
  afterAll(async () => {
    await app.close();
    await db.drop();
    await db.disconnect();
  });
  
  it('should create order', async () => {
    // HTTP request to real server with real database
    const response = await fetch('http://localhost:3001/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'customer-1',
        items: [{ productId: 'p1', quantity: 1, price: 100 }]
      })
    });
    
    expect(response.status).toBe(201);
    
    // Verify in database
    const orders = await db.query('SELECT * FROM orders');
    expect(orders.rows).toHaveLength(1);
  });
});
```

**Problems:**
- Slow (database I/O, HTTP requests)
- Requires database setup/teardown
- Requires web server
- Flaky (network issues, port conflicts)
- Hard to test edge cases (simulate database failures?)

**With Isolation (Acceptance Test):**
```typescript
describe('OrderManagement isolated test', () => {
  let orderMgmt: OrderManagement;
  let mockRepo: MockOrderRepository;
  
  beforeEach(() => {
    mockRepo = new MockOrderRepository();
    orderMgmt = new OrderManagement(mockRepo, new MockPaymentGateway());
  });
  
  it('should create order', async () => {
    // Direct call to business logic, no infrastructure
    const orderId = await orderMgmt.placeOrder('customer-1', [
      { productId: 'p1', quantity: 1, price: 100 }
    ]);
    
    expect(orderId).toBeDefined();
    expect(mockRepo.count()).toBe(1);
  });
  
  it('should handle repository failure', async () => {
    // Easy to test edge cases
    mockRepo.simulateFailure();
    
    await expect(
      orderMgmt.placeOrder('customer-1', [/* ... */])
    ).rejects.toThrow('Repository unavailable');
  });
});
```

**Benefits:**
- Fast (runs in memory, no I/O)
- No infrastructure setup
- Deterministic (no network/database flakiness)
- Easy to test edge cases (mock can simulate any behavior)

### Mock Adapter for Complex External Service

```typescript
export class MockWeatherServiceAdapter implements WeatherService {
  private forecasts = new Map<string, WeatherForecast>();
  private shouldFail = false;
  
  async getForecast(location: string): Promise<WeatherForecast> {
    if (this.shouldFail) {
      throw new Error('Weather service unavailable');
    }
    
    return this.forecasts.get(location) || {
      temperature: 20,
      condition: 'sunny',
      location
    };
  }
  
  // Test control methods
  setForecast(location: string, forecast: WeatherForecast): void {
    this.forecasts.set(location, forecast);
  }
  
  simulateServiceFailure(): void {
    this.shouldFail = true;
  }
  
  reset(): void {
    this.forecasts.clear();
    this.shouldFail = false;
  }
}
```

Usage in test:

```typescript
it('should handle weather service failure gracefully', async () => {
  const mockWeather = new MockWeatherServiceAdapter();
  mockWeather.simulateServiceFailure();
  
  const app = new TripPlanner(mockWeather);
  
  // Application should handle failure gracefully
  const plan = await app.planTrip('Paris', '2024-06-01');
  expect(plan.weatherAvailable).toBe(false);
  expect(plan.recommendations).toContain('Check weather closer to date');
});
```

## Benefits

### Speed
- No database connections (instant in-memory operations)
- No network requests (no HTTP, no external APIs)
- No file I/O (everything in memory)
- Tests run in **milliseconds** instead of seconds

### Reliability
- No external dependencies means no flakiness
- No "works on my machine" issues
- No test database conflicts
- No port conflicts or resource contention

### Flexibility
- Easy to test edge cases (mocks can simulate any scenario)
- Easy to test error paths (mocks can fail on demand)
- Easy to test timing issues (mocks control time)
- Complete control over test environment

### Regression Testing
- Hundreds or thousands of tests can run in seconds
- Fast feedback loop encourages frequent test runs
- Enables true TDD/BDD workflows
- Continuous Integration runs complete test suite quickly

## When to Use

**Always use isolation tests for:**
- Business logic verification
- Edge case testing
- Regression test suites
- TDD/BDD development cycles

**Complement with integration tests for:**
- Adapter correctness (ensure SQL queries work)
- Database schema validation
- API contract verification
- End-to-end workflows

**Complement with system tests for:**
- Deployment verification
- Performance testing
- Security testing
- Cross-system integration

The test pyramid suggests: most tests should be isolated unit/acceptance tests, fewer integration tests, fewest system tests.

## References

- [[Hexagonal Architecture Article — 2018-08-29]]
- [[Hexagonal Architecture]]
- [[Ports]]
- [[Adapters]]
- [[Technology Agnostic Design]]
- [[Composition Root]]
