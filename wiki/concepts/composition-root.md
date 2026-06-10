---
title: Composition Root
type: concept
tags: [architecture, dependency-injection, startup, wiring, hexagonal-architecture]
sources: [hexagonal-architecture-article-2018-08-29]
created: 2026-06-10
updated: 2026-06-10
---

# Composition Root

## Explanation

The **Composition Root** (also called the **Main Component** by Robert C. Martin in "Clean Architecture") is the startup component that assembles the entire application by wiring [[Adapters]] to [[Ports]]. It is the single place where the whole system comes together.

The Composition Root is responsible for:
1. Initializing and configuring the environment (databases, servers, etc.)
2. Creating driven adapter instances
3. Creating the application instance, injecting driven adapters
4. Creating driver adapter instances, injecting the application
5. Starting driver adapters

This is where the [[Configurable Dependency Pattern]] is applied - the Composition Root determines which concrete adapters to use for each port at runtime, typically based on configuration or environment variables.

## Key Principles

### Single Responsibility

The Composition Root has exactly one responsibility: **assemble the application**. It should not contain business logic, infrastructure logic, or application logic - only wiring code.

### Run at Startup

The Composition Root runs once at application startup, before any business logic executes. It constructs the entire object graph and starts the driver adapters that will handle external requests.

### Configuration-Driven

Which adapters to use for each port is determined by configuration:
- **Development:** Mock adapters for fast feedback
- **Testing:** Test drivers + mock driven adapters
- **Staging:** Real adapters with staging infrastructure
- **Production:** Real adapters with production infrastructure

The business logic (hexagon) doesn't change - only the Composition Root's wiring changes.

### Dependency Direction

The Composition Root depends on **everything**:
- It imports the application (hexagon)
- It imports all adapters (driver and driven)
- It imports infrastructure clients (database connections, HTTP servers)

But nothing depends on the Composition Root - it's the outermost component.

## Applications

### Basic Composition Root

```typescript
// Main entry point - the Composition Root
export class ApplicationBootstrap {
  static async start(environment: 'dev' | 'test' | 'prod') {
    // 1. Initialize environment
    const config = loadConfig(environment);
    const dbClient = await createDatabaseConnection(config.database);
    const httpServer = createHttpServer(config.server);
    
    // 2. Create driven adapters
    const orderRepo = new PostgresOrderRepository(dbClient);
    const paymentGateway = new StripePaymentAdapter(config.stripe);
    const notifier = new SmtpEmailAdapter(config.smtp);
    
    // 3. Create application, injecting driven adapters
    const orderMgmt = new OrderManagement(
      orderRepo,
      paymentGateway,
      notifier
    );
    
    // 4. Create driver adapters, injecting application
    const orderController = new OrderRestController(orderMgmt);
    const orderCLI = new OrderCLI(orderMgmt);
    
    // 5. Start driver adapters
    httpServer.registerController(orderController);
    await httpServer.listen(config.server.port);
    
    console.log(`Application started in ${environment} mode`);
    
    return { orderMgmt, httpServer };
  }
}

// Application entry point
if (require.main === module) {
  const environment = process.env.NODE_ENV || 'dev';
  ApplicationBootstrap.start(environment as any);
}
```

### Environment-Specific Wiring

The Composition Root changes adapter selection based on environment:

```typescript
export class ApplicationBootstrap {
  static async start(environment: string) {
    const config = loadConfig(environment);
    
    // Environment-specific driven adapter selection
    let orderRepo: OrderRepository;
    let paymentGateway: PaymentGateway;
    let notifier: Notifier;
    
    if (environment === 'test' || environment === 'dev') {
      // Development/Test: Use mocks for fast feedback
      orderRepo = new InMemoryOrderRepository();
      paymentGateway = new MockPaymentGateway();
      notifier = new MockEmailNotifier();
    } else if (environment === 'staging') {
      // Staging: Real adapters with staging infrastructure
      const db = await connectToDatabase(config.stagingDatabase);
      orderRepo = new PostgresOrderRepository(db);
      paymentGateway = new StripePaymentAdapter(config.stagingStripeKey);
      notifier = new SmtpEmailAdapter(config.stagingSmtp);
    } else {
      // Production: Real adapters with production infrastructure
      const db = await connectToDatabase(config.productionDatabase);
      orderRepo = new PostgresOrderRepository(db);
      paymentGateway = new StripePaymentAdapter(config.productionStripeKey);
      notifier = new SmtpEmailAdapter(config.productionSmtp);
    }
    
    // Application creation is the same regardless of environment
    const orderMgmt = new OrderManagement(
      orderRepo,
      paymentGateway,
      notifier
    );
    
    // Environment-specific driver adapter selection
    let driver;
    if (environment === 'test') {
      driver = new OrderTestAdapter(orderMgmt);
    } else {
      driver = new OrderRestController(orderMgmt);
      const server = createHttpServer();
      server.registerController(driver);
      await server.listen(config.server.port);
    }
    
    return { orderMgmt, driver };
  }
}
```

### Multiple Applications in One System

Complex systems may have multiple hexagons. The Composition Root wires them all:

```typescript
export class SystemBootstrap {
  static async start(environment: string) {
    const config = loadConfig(environment);
    
    // Shared infrastructure
    const db = await createDatabaseConnection(config.database);
    const eventBus = new EventBus();
    
    // === Order Management Application ===
    const orderRepo = new PostgresOrderRepository(db);
    const paymentGateway = new StripePaymentAdapter(config.stripe);
    const orderEvents = new EventPublisherAdapter(eventBus);
    
    const orderMgmt = new OrderManagement(
      orderRepo,
      paymentGateway,
      orderEvents
    );
    
    const orderController = new OrderRestController(orderMgmt);
    
    // === Inventory Management Application ===
    const inventoryRepo = new PostgresInventoryRepository(db);
    const inventoryEvents = new EventPublisherAdapter(eventBus);
    const orderEventSubscriber = new OrderEventSubscriberAdapter(eventBus);
    
    const inventoryMgmt = new InventoryManagement(
      inventoryRepo,
      inventoryEvents
    );
    
    const inventoryController = new InventoryRestController(inventoryMgmt);
    
    // Wire event-driven integration
    orderEventSubscriber.onOrderPlaced(async (orderId, items) => {
      await inventoryMgmt.reserveItems(items);
    });
    
    // === Start HTTP Server ===
    const server = createHttpServer();
    server.registerController(orderController);
    server.registerController(inventoryController);
    await server.listen(config.server.port);
    
    return { orderMgmt, inventoryMgmt, server };
  }
}
```

### Dependency Injection Container

For large systems, a DI container can help manage complexity:

```typescript
import { Container } from 'inversify';

export class ApplicationBootstrap {
  static createContainer(environment: string): Container {
    const container = new Container();
    const config = loadConfig(environment);
    
    // Bind configuration
    container.bind('Config').toConstantValue(config);
    
    // Bind infrastructure
    container.bind('DatabaseClient').toDynamicValue(() => 
      createDatabaseConnection(config.database)
    ).inSingletonScope();
    
    // Bind driven adapters
    if (environment === 'test') {
      container.bind<OrderRepository>('OrderRepository')
        .to(InMemoryOrderRepository);
      container.bind<PaymentGateway>('PaymentGateway')
        .to(MockPaymentGateway);
    } else {
      container.bind<OrderRepository>('OrderRepository')
        .to(PostgresOrderRepository);
      container.bind<PaymentGateway>('PaymentGateway')
        .to(StripePaymentAdapter);
    }
    
    // Bind application
    container.bind<OrderManagement>('OrderManagement')
      .to(OrderManagement)
      .inSingletonScope();
    
    // Bind driver adapters
    container.bind<OrderRestController>('OrderController')
      .to(OrderRestController);
    
    return container;
  }
  
  static async start(environment: string) {
    const container = this.createContainer(environment);
    
    // Resolve and start
    const controller = container.get<OrderRestController>('OrderController');
    const server = createHttpServer();
    server.registerController(controller);
    await server.listen(3000);
    
    return { container, server };
  }
}
```

### Testing Configuration

For tests, create a specialized test composition root:

```typescript
export class TestApplicationBootstrap {
  static createTestApp(): {
    app: OrderManagement;
    mocks: {
      orderRepo: MockOrderRepository;
      paymentGateway: MockPaymentGateway;
      notifier: MockNotifier;
    };
  } {
    // Create mock driven adapters
    const orderRepo = new MockOrderRepository();
    const paymentGateway = new MockPaymentGateway();
    const notifier = new MockNotifier();
    
    // Create application with mocks
    const app = new OrderManagement(
      orderRepo,
      paymentGateway,
      notifier
    );
    
    // Return both app and mocks for test control
    return {
      app,
      mocks: { orderRepo, paymentGateway, notifier }
    };
  }
}

// Usage in tests
describe('OrderManagement', () => {
  let app: OrderManagement;
  let mocks: ReturnType<typeof TestApplicationBootstrap.createTestApp>['mocks'];
  
  beforeEach(() => {
    const setup = TestApplicationBootstrap.createTestApp();
    app = setup.app;
    mocks = setup.mocks;
  });
  
  it('should charge payment gateway', async () => {
    await app.placeOrder('customer-1', [/* items */]);
    
    expect(mocks.paymentGateway.getTotalCharged()).toBeGreaterThan(0);
  });
});
```

## Related Concepts

- [[Hexagonal Architecture]] - Architectural pattern requiring composition at startup
- [[Adapters]] - Components wired by the Composition Root
- [[Ports]] - Interfaces that adapters connect to via Composition Root
- [[Configurable Dependency Pattern]] - Pattern implemented by Composition Root
- [[Dependency Injection]] - Technique used by Composition Root
- [[Testing in Isolation]] - Enabled by test-specific Composition Root

## Examples

### Progressive Wiring During Development

Follow the implementation order:

**Step 1: Test Drivers + Mock Driven**
```typescript
export class Step1Bootstrap {
  static createTestSetup() {
    // All mocks
    const mocks = {
      orderRepo: new MockOrderRepository(),
      paymentGateway: new MockPaymentGateway(),
      notifier: new MockNotifier()
    };
    
    // Application with mocks
    const app = new OrderManagement(
      mocks.orderRepo,
      mocks.paymentGateway,
      mocks.notifier
    );
    
    // Test driver
    const testDriver = new OrderTestAdapter(app);
    
    return { app, testDriver, mocks };
  }
}
```

**Step 2: Real Drivers + Mock Driven**
```typescript
export class Step2Bootstrap {
  static async createDevSetup() {
    // Mock driven adapters
    const orderRepo = new MockOrderRepository();
    const paymentGateway = new MockPaymentGateway();
    const notifier = new MockNotifier();
    
    // Application
    const app = new OrderManagement(orderRepo, paymentGateway, notifier);
    
    // Real driver (HTTP)
    const controller = new OrderRestController(app);
    const server = createHttpServer();
    server.registerController(controller);
    await server.listen(3000);
    
    return { app, server };
  }
}
```

**Step 3: Test Drivers + Real Driven**
```typescript
export class Step3Bootstrap {
  static async createIntegrationTestSetup() {
    // Real driven adapters (test database)
    const db = await createTestDatabase();
    const orderRepo = new PostgresOrderRepository(db);
    const paymentGateway = new StripePaymentAdapter(testStripeKey);
    const notifier = new SmtpEmailAdapter(testSmtpConfig);
    
    // Application
    const app = new OrderManagement(orderRepo, paymentGateway, notifier);
    
    // Test driver
    const testDriver = new OrderTestAdapter(app);
    
    return { app, testDriver, db };
  }
}
```

**Step 4: Real Drivers + Real Driven**
```typescript
export class Step4Bootstrap {
  static async createProductionSetup() {
    // Real driven adapters (production)
    const db = await createDatabaseConnection(prodConfig.database);
    const orderRepo = new PostgresOrderRepository(db);
    const paymentGateway = new StripePaymentAdapter(prodStripeKey);
    const notifier = new SmtpEmailAdapter(prodSmtpConfig);
    
    // Application
    const app = new OrderManagement(orderRepo, paymentGateway, notifier);
    
    // Real driver (HTTP)
    const controller = new OrderRestController(app);
    const server = createHttpServer();
    server.registerController(controller);
    await server.listen(prodConfig.server.port);
    
    return { app, server };
  }
}
```

### Graceful Shutdown

The Composition Root should also handle shutdown:

```typescript
export class ApplicationBootstrap {
  private static app: any;
  private static server: any;
  private static db: any;
  
  static async start(environment: string) {
    // ... startup code ...
    
    this.app = orderMgmt;
    this.server = httpServer;
    this.db = dbClient;
    
    // Register shutdown handlers
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    
    return { orderMgmt, httpServer };
  }
  
  static async shutdown() {
    console.log('Shutting down gracefully...');
    
    // Stop accepting new requests
    if (this.server) {
      await this.server.close();
    }
    
    // Close database connections
    if (this.db) {
      await this.db.disconnect();
    }
    
    console.log('Shutdown complete');
    process.exit(0);
  }
}
```

## Benefits

### Single Place for Wiring
- All composition logic in one place
- Easy to understand system structure
- Clear dependency graph

### Environment Flexibility
- Same application, different adapters per environment
- No code changes needed for environment switches
- Configuration-driven behavior

### Testability
- Test-specific composition roots use mock adapters
- Production code unchanged for testing
- Full control over test environment

### Maintainability
- When adding new adapters, only Composition Root changes
- Application code doesn't know about adapter implementations
- Adapter changes don't require application recompilation

## Common Mistakes

### Business Logic in Composition Root
```typescript
// Bad - business logic in composition root
export class Bootstrap {
  static async start() {
    const app = new OrderManagement(/* ... */);
    
    // Business logic doesn't belong here!
    const orders = await app.getPendingOrders();
    for (const order of orders) {
      if (order.isOverdue()) {
        await app.sendReminder(order.id);
      }
    }
    
    // ... start server ...
  }
}
```

Composition Root should only wire, not execute business logic.

### Multiple Composition Roots
```typescript
// Bad - composition scattered across files
export class OrderController {
  constructor() {
    // Composition in controller!
    const db = connectToDatabase();
    const repo = new PostgresOrderRepository(db);
    this.app = new OrderManagement(repo, /* ... */);
  }
}

export class InventoryController {
  constructor() {
    // Composition in another controller!
    const db = connectToDatabase();
    const repo = new PostgresInventoryRepository(db);
    this.app = new InventoryManagement(repo, /* ... */);
  }
}
```

Should have one Composition Root that wires everything.

### Hard-Coded Dependencies
```typescript
// Bad - application creates its own adapters
export class OrderManagement {
  private repo: OrderRepository;
  
  constructor() {
    // Hard-coded dependency!
    this.repo = new PostgresOrderRepository(
      connectToDatabase()
    );
  }
}
```

Dependencies should be injected by Composition Root, not created internally.

## References

- [[Hexagonal Architecture Article — 2018-08-29]]
- [[Hexagonal Architecture]]
- [[Adapters]]
- [[Ports]]
- [[Configurable Dependency Pattern]]
- [[Dependency Injection]]
