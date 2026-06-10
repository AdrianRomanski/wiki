---
title: Adapters
type: concept
tags: [hexagonal-architecture, adapter-pattern, technology, implementation]
sources: [hexagonal-architecture-article-2018-08-29]
created: 2026-06-10
updated: 2026-06-10
---

# Adapters

## Explanation

In [[Hexagonal Architecture]], **adapters** are software components that allow specific technologies to interact with the application's [[Ports]]. They bridge the gap between technology-specific interfaces (HTTP, SQL, SMTP, etc.) and the technology-agnostic interfaces defined by ports.

Adapters are **outside the application** (hexagon). They depend on the hexagon but the hexagon doesn't depend on them, following the [[Configurable Dependency Pattern]].

There are two types of adapters corresponding to the two types of ports:

### Driver Adapters (Primary Adapters)

**Driver adapters** use driver port interfaces. They:
- Convert technology-specific requests into technology-agnostic port calls
- Depend on the application (know about driver ports)
- Are **used to drive** the application
- Trigger application functionality on behalf of external actors

**Examples:**
- Automated test framework - converts test cases into driver port requests
- CLI (Command Line Interface) - converts text entered in console
- GUI - converts events triggered by graphical components
- MVC web application - Controller converts View actions into port requests
- REST API controller - converts REST API requests
- Event subscriber - converts messages from message queue

### Driven Adapters (Secondary Adapters)

**Driven adapters** implement driven port interfaces. They:
- Convert technology-agnostic port methods into specific technology calls
- Depend on the application (implement driven ports)
- Are **driven by** the application
- Provide services the application needs

**Examples:**
- Mock adapter - mimics real behavior (e.g., in-memory database)
- SQL adapter - persists data by accessing SQL database
- Email adapter - sends notifications via SMTP
- App-to-App adapter - retrieves data from remote application
- Event publisher - publishes events to message queue

## Key Principles

### Adapter Pattern Implementation

Adapters in Hexagonal Architecture implement the classic **Adapter Design Pattern** - they convert one interface into another. The conversion happens in both directions:

- **Driver adapters** convert from technology interface → port interface
- **Driven adapters** convert from port interface → technology interface

### Minimum Two Adapters Per Port

For each port (driver or driven), you must have **at least two adapters**:

**Driver Port:**
1. One real driver adapter (for production use)
2. One test driver adapter (for automated testing)

**Driven Port:**
1. One real driven adapter (for production use)
2. One mock driven adapter (for isolated testing)

This is **non-negotiable** for proper hexagonal architecture implementation. It enables [[Testing in Isolation]].

### Configuration at Startup

Which adapter to use for each port is determined at application startup through the [[Composition Root]]. This provides flexibility - you can switch technologies by changing configuration, without modifying source code.

**Example startup configuration:**
- Development: Test driver + Mock driven adapters
- Testing: Test driver + Mock driven adapters
- Staging: Real driver + Real driven adapters (staging database)
- Production: Real driver + Real driven adapters (production database)

## Applications

### Driver Adapter Examples

**REST API Controller:**
```typescript
// Converts HTTP requests to port calls
export class TaskController {
  constructor(private taskService: ManageTasksPort) {}
  
  @Post('/tasks')
  async createTask(@Body() request: CreateTaskRequest): Promise<TaskResponse> {
    // HTTP (technology) → Port (technology-agnostic)
    const taskId = await this.taskService.createTask(
      request.title,
      request.assignee
    );
    return { taskId, status: 'created' };
  }
  
  @Get('/tasks/:id')
  async getTask(@Param('id') id: string): Promise<TaskResponse> {
    const task = await this.taskService.getTask(id);
    return this.mapToResponse(task);
  }
}
```

**CLI Adapter:**
```typescript
// Converts command-line input to port calls
export class TaskCLI {
  constructor(private taskService: ManageTasksPort) {}
  
  async run(args: string[]): Promise<void> {
    const [command, ...params] = args;
    
    switch (command) {
      case 'create':
        const [title, assignee] = params;
        const taskId = await this.taskService.createTask(title, assignee);
        console.log(`Task created: ${taskId}`);
        break;
        
      case 'list':
        const tasks = await this.taskService.getAllTasks();
        tasks.forEach(t => console.log(`${t.id}: ${t.title}`));
        break;
    }
  }
}
```

**Test Adapter:**
```typescript
// Converts test scenarios to port calls
export class TaskTestAdapter {
  constructor(private taskService: ManageTasksPort) {}
  
  async testTaskAssignment(): Promise<void> {
    // Arrange
    const taskId = await this.taskService.createTask(
      'Fix bug',
      'alice@example.com'
    );
    
    // Act
    await this.taskService.assignTask(taskId, 'bob@example.com');
    
    // Assert
    const task = await this.taskService.getTask(taskId);
    expect(task.assignee).toBe('bob@example.com');
  }
}
```

### Driven Adapter Examples

**SQL Database Adapter:**
```typescript
// Implements port using SQL database
export class PostgresTaskRepository implements TaskRepositoryPort {
  constructor(private db: PostgresClient) {}
  
  async save(task: Task): Promise<void> {
    // Port (technology-agnostic) → SQL (technology)
    await this.db.query(
      'INSERT INTO tasks (id, title, assignee, status) VALUES ($1, $2, $3, $4)',
      [task.id, task.title, task.assignee, task.status]
    );
  }
  
  async findById(id: string): Promise<Task | null> {
    const result = await this.db.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToTask(result.rows[0]) : null;
  }
}
```

**Mock In-Memory Adapter:**
```typescript
// Mimics real database behavior without actual database
export class InMemoryTaskRepository implements TaskRepositoryPort {
  private tasks = new Map<string, Task>();
  
  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, { ...task });
  }
  
  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }
  
  // Test helpers
  clear(): void {
    this.tasks.clear();
  }
  
  count(): number {
    return this.tasks.size;
  }
}
```

**Email Notification Adapter:**
```typescript
// Implements port using SMTP
export class SmtpEmailAdapter implements NotificationPort {
  constructor(private smtpClient: SmtpClient) {}
  
  async sendNotification(recipient: string, message: string): Promise<void> {
    await this.smtpClient.sendMail({
      from: 'noreply@example.com',
      to: recipient,
      subject: 'Task Assignment',
      text: message
    });
  }
}
```

**Mock Email Adapter:**
```typescript
// Mimics email sending for testing
export class MockEmailAdapter implements NotificationPort {
  private sentMessages: Array<{ recipient: string; message: string }> = [];
  
  async sendNotification(recipient: string, message: string): Promise<void> {
    this.sentMessages.push({ recipient, message });
  }
  
  // Test helpers
  getLastMessage() {
    return this.sentMessages[this.sentMessages.length - 1];
  }
  
  getSentCount(): number {
    return this.sentMessages.length;
  }
  
  clear(): void {
    this.sentMessages = [];
  }
}
```

### Adapter Wiring at Startup

The [[Composition Root]] creates adapter instances and injects them:

```typescript
export class ApplicationBootstrap {
  static createApplication(environment: 'test' | 'dev' | 'prod') {
    // Choose driven adapters based on environment
    let taskRepo: TaskRepositoryPort;
    let notifier: NotificationPort;
    
    if (environment === 'test' || environment === 'dev') {
      taskRepo = new InMemoryTaskRepository();
      notifier = new MockEmailAdapter();
    } else {
      const db = new PostgresClient(config.database);
      taskRepo = new PostgresTaskRepository(db);
      
      const smtp = new SmtpClient(config.smtp);
      notifier = new SmtpEmailAdapter(smtp);
    }
    
    // Create application, inject driven adapters
    const app = new TaskManagementApplication(taskRepo, notifier);
    
    // Choose driver adapter based on environment
    let driver: any;
    if (environment === 'test') {
      driver = new TaskTestAdapter(app);
    } else {
      driver = new TaskController(app); // REST API
    }
    
    return { app, driver };
  }
}
```

## Related Concepts

- [[Ports]] - Interfaces that adapters connect to
- [[Hexagonal Architecture]] - The architectural pattern using ports and adapters
- [[Configurable Dependency Pattern]] - Enables runtime adapter selection
- [[Composition Root]] - Assembles adapters and application at startup
- [[Testing in Isolation]] - Achieved through mock adapters
- [[Technology Agnostic Design]] - Adapters isolate technology from business logic

## Examples

### Multiple Adapters for Same Port

A driven port can have multiple adapters for different technologies:

**Port:**
```typescript
export interface CachePort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}
```

**Redis Adapter:**
```typescript
export class RedisCacheAdapter implements CachePort {
  constructor(private redis: RedisClient) {}
  
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }
  
  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, value);
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

**In-Memory Adapter:**
```typescript
export class InMemoryCacheAdapter implements CachePort {
  private cache = new Map<string, { value: string; expires: number }>();
  
  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  async set(key: string, value: string, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    });
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
```

You can switch between Redis and in-memory cache by changing configuration, without modifying application code.

### Progressive Implementation

Follow this order when building adapters:

1. **Test Drivers + Mock Driven** - Start with test adapters and mocks
2. **Real Drivers + Mock Driven** - Add real drivers, keep mocks (test drivers)
3. **Test Drivers + Real Driven** - Keep test drivers, add real driven adapters
4. **Real Drivers + Real Driven** - Full system with all real adapters

This enables testing at every stage of development.

## References

- [[Hexagonal Architecture Article — 2018-08-29]]
- [[Hexagonal Architecture]]
- [[Ports]]
- [[Technology Agnostic Design]]
- [[Composition Root]]
- [[Testing in Isolation]]
