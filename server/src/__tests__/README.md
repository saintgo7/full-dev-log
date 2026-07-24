# DevLog Hub Server - Unit Test Suite

This directory contains comprehensive unit tests for the DevLog Hub server application using Jest.

## Test Structure

```
__tests__/
├── setup.ts                    # Global test setup and mocks
├── mocks/
│   └── prisma.mock.ts         # Prisma mock utilities and test data generators
├── services/
│   ├── auth.service.test.ts   # Authentication service tests
│   ├── event.service.test.ts  # Event service tests
│   ├── report.service.test.ts # Report service tests
│   └── notification.service.test.ts # Notification service tests
├── middleware/
│   └── auth.test.ts           # Auth middleware tests
└── lib/
    └── cache.test.ts          # Cache manager tests
```

## Test Coverage

### Current Coverage Summary
- **Total Tests**: 126 passing
- **Test Suites**: 6
- **Coverage Areas**:
  - Auth Service: 100% coverage
  - Event Service: 75.6% coverage
  - Report Service: 89.51% coverage
  - Notification Service: 95.89% coverage
  - Auth Middleware: 100% coverage
  - Cache Library: 100% coverage (lib/cache.ts)

### Tested Components

#### 1. Authentication Service (`auth.service.test.ts`)
- User registration with validation
- Login with email/password
- Token generation (access & refresh)
- Token refresh flow
- Session management
- Password hashing verification
- User profile retrieval
- Error handling for invalid credentials

#### 2. Event Service (`event.service.test.ts`)
- Batch event creation
- Event filtering and pagination
- Event search functionality
- Event statistics generation
- Terminal event tracking
- Cursor-based pagination
- Date range filtering
- Project-based filtering

#### 3. Report Service (`report.service.test.ts`)
- Daily/Weekly/Monthly report generation
- Custom date range reports
- Report pagination and filtering
- Report export (JSON, Markdown, HTML)
- Report regeneration
- Activity statistics calculation
- Project breakdown analysis
- Summary metrics generation

#### 4. Notification Service (`notification.service.test.ts`)
- Notification creation
- Real-time WebSocket broadcasting
- Notification pagination
- Mark as read/unread
- Bulk operations (mark all as read, clear all)
- Type-specific notifications (report_ready, team_invite, etc.)
- Authorization checks
- Unread count tracking

#### 5. Auth Middleware (`auth.test.ts`)
- JWT token validation
- Token expiration handling
- Invalid token rejection
- Agent authentication with API tokens
- Agent status management (active/inactive/revoked)
- Authorization header parsing
- Error response formatting

#### 6. Cache Manager (`cache.test.ts`)
- Cache set/get operations
- TTL (Time To Live) expiration
- LRU (Least Recently Used) eviction
- Pattern-based operations
- Statistics tracking (hits, misses, hit rate)
- Async/Sync wrapper functions
- Memory estimation
- Cleanup operations

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- auth.service.test
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should authenticate"
```

## Test Configuration

The test suite uses the following configuration:

- **Framework**: Jest 29.7.0
- **TypeScript**: ts-jest 29.1.2
- **Environment**: Node.js
- **Test Timeout**: 10 seconds
- **Coverage Threshold**: 70% (statements, branches, functions, lines)

## Mock Strategy

### Prisma Database Mocks
All database operations are mocked using Jest mock functions. The setup file (`setup.ts`) provides a comprehensive mock of the Prisma client with all necessary models.

### Socket.IO Mocks
WebSocket operations are mocked to prevent actual socket connections during tests.

### Environment Variables
Test-specific environment variables are set in the setup file:
- `JWT_SECRET`: test-secret-key
- `JWT_ACCESS_EXPIRY`: 15m
- `JWT_REFRESH_EXPIRY`: 7d

## Test Data Generators

The `mocks/prisma.mock.ts` file provides factory functions for generating test data:

- `mockUser()` - Generate test users
- `mockAgent()` - Generate test agents
- `mockEvent()` - Generate test events
- `mockSession()` - Generate test sessions
- `mockNotification()` - Generate test notifications
- `mockReport()` - Generate test reports

Each factory accepts optional overrides for customization.

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Mocking**: External dependencies are properly mocked
3. **Assertions**: Clear and specific assertions for expected behavior
4. **Error Cases**: Both success and error scenarios are tested
5. **Cleanup**: Tests clean up after themselves using beforeEach/afterEach
6. **Naming**: Descriptive test names following "should [expected behavior]" pattern
7. **AAA Pattern**: Tests follow Arrange-Act-Assert structure

## Adding New Tests

When adding new tests:

1. Create test file in appropriate directory
2. Import necessary mocks from `mocks/prisma.mock.ts`
3. Follow existing test structure and patterns
4. Mock all external dependencies
5. Clear mocks in beforeEach
6. Write descriptive test names
7. Test both success and error cases
8. Aim for >80% coverage of new code

## Continuous Integration

Tests are run automatically on:
- Pull requests to main branch
- Pushes to main and develop branches
- Pre-commit hooks (if configured)

## Troubleshooting

### Common Issues

**Issue**: Tests timing out
- **Solution**: Increase timeout in jest.config.js or specific test

**Issue**: Mock not working
- **Solution**: Ensure mock is imported before the module using it

**Issue**: TypeScript errors
- **Solution**: Check tsconfig.json has `isolatedModules: true`

**Issue**: Coverage not meeting threshold
- **Solution**: Add tests for uncovered code paths

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://jestjs.io/docs/testing-best-practices)
- [TypeScript with Jest](https://jestjs.io/docs/getting-started#using-typescript)
