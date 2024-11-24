import { PrismaClient } from '@prisma/client';

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
}); 