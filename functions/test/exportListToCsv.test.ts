import * as admin from 'firebase-admin';
import * as functionsTest from 'firebase-functions-test';
import { exportListToCsv } from './index';

// Initialize Firebase Test SDK
const test = functionsTest();

// Mock data for testing
const mockUserId = 'test-user-id';
const mockListId = 'test-list-id';
const mockMovieItems = [
  {
    id: '123',
    title: 'Test Movie',
    release_date: '2022-01-01',
    poster_path: '/test-poster.jpg',
    vote_average: 8.5,
    media_type: 'movie',
    dateAdded: new Date().toISOString(),
  },
  {
    id: '456',
    title: 'Another Test Movie',
    release_date: '2023-05-15',
    poster_path: '/test-poster2.jpg',
    vote_average: 7.8,
    media_type: 'movie',
    dateAdded: new Date().toISOString(),
  }
];

describe('Export List to CSV Function', () => {
  let mockAuth: any;
  let mockFirestore: any;

  beforeAll(() => {
    // Initialize Firebase Admin SDK with test project ID
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'test-project',
      });
    }
    
    // Mock auth and Firestore
    mockAuth = jest.spyOn(admin, 'auth');
    mockFirestore = jest.spyOn(admin, 'firestore');
  });

  afterAll(() => {
    test.cleanup();
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header is provided', async () => {
    const req = {
      method: 'GET',
      query: { listId: mockListId },
      headers: {},
    };
    
    const res = { 
      status: jest.fn(() => res), 
      json: jest.fn(),
      set: jest.fn(() => res),
      send: jest.fn()
    };

    await exportListToCsv(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid authorization header' });
  });

  it('should return 401 if invalid token is provided', async () => {
    const req = {
      method: 'GET',
      query: { listId: mockListId },
      headers: {
        authorization: 'Bearer invalid-token',
      },
    };
    
    const res = { 
      status: jest.fn(() => res), 
      json: jest.fn(),
      set: jest.fn(() => res),
      send: jest.fn()
    };

    // Mock auth verification to fail
    const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error('Invalid token'));
    mockAuth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    await exportListToCsv(req as any, res as any);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('invalid-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
  });

  it('should return 404 if list does not exist', async () => {
    const req = {
      method: 'GET',
      query: { listId: mockListId },
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    
    const res = { 
      status: jest.fn(() => res), 
      json: jest.fn(),
      set: jest.fn(() => res),
      send: jest.fn()
    };

    // Mock auth verification to succeed
    const mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: mockUserId });
    mockAuth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });
    
    // Mock Firestore to return a non-existing list
    const mockGet = jest.fn().mockResolvedValue({ exists: false });
    const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
    const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
    const mockDb = {
      collection: mockCollection,
    };
    
    mockFirestore.mockReturnValue(mockDb);

    await exportListToCsv(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'List not found' });
  });

  it('should return 403 if user does not own the list', async () => {
    const req = {
      method: 'GET',
      query: { listId: mockListId },
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    
    const res = { 
      status: jest.fn(() => res), 
      json: jest.fn(),
      set: jest.fn(() => res),
      send: jest.fn()
    };

    // Mock auth verification to succeed
    const mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: mockUserId });
    mockAuth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });
    
    // Mock Firestore to return a list that doesn't belong to the user
    const mockGet = jest.fn().mockResolvedValue({ 
      exists: true,
      data: () => ({ ownerId: 'different-user-id' }) 
    });
    const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
    const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
    const mockDb = {
      collection: mockCollection,
    };
    
    mockFirestore.mockReturnValue(mockDb);

    await exportListToCsv(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: You do not have permission to access this list' });
  });

  it('should return CSV with correct format when list has items', async () => {
    const req = {
      method: 'GET',
      query: { listId: mockListId },
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    
    const res = { 
      status: jest.fn(() => res), 
      json: jest.fn(),
      set: jest.fn(() => res),
      send: jest.fn()
    };

    // Mock auth verification to succeed
    const mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: mockUserId });
    mockAuth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });
    
    // Mock Firestore to return a valid list and items
    const mockItemsSnapshot = {
      empty: false,
      docs: mockMovieItems.map(item => ({
        data: () => item,
      })),
    };
    
    const mockItemsGet = jest.fn().mockResolvedValue(mockItemsSnapshot);
    const mockItemsCollectionRef = jest.fn().mockReturnValue({ get: mockItemsGet });
    
    const mockListGet = jest.fn().mockResolvedValue({ 
      exists: true,
      data: () => ({ ownerId: mockUserId }) 
    });
    const mockListDoc = jest.fn().mockReturnValue({ get: mockListGet });
    
    const mockCollection = jest.fn((...args) => {
      if (args[0] === 'users') {
        const mockUserCollection = jest.fn((userId) => {
          if (userId === mockUserId) {
            const mockCustomListsCollection = jest.fn((listType) => {
              if (listType === 'custom_lists') {
                const mockListRef = jest.fn((listId) => {
                  if (listId === mockListId) {
                    return { get: mockListGet, collection: mockItemsCollectionRef };
                  }
                  return { get: jest.fn().mockResolvedValue({ exists: false }) };
                });
                return mockListRef;
              }
              return jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) });
            });
            return mockCustomListsCollection;
          }
          return jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) });
        });
        return mockUserCollection;
      }
      return jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) });
    });
    
    const mockDb = {
      collection: mockCollection,
    };
    
    mockFirestore.mockReturnValue(mockDb);

    await exportListToCsv(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.set).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="list-${mockListId}-export.csv"`);
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    
    // Check that CSV content has the correct headers and data
    const csvContent = res.send.mock.calls[0][0];
    expect(csvContent).toContain('tmdbId,Name,Year,Letterboxd URI');
    expect(csvContent).toContain('123,Test Movie,2022,https://letterboxd.com/film/tmdb-123');
    expect(csvContent).toContain('456,Another Test Movie,2023,https://letterboxd.com/film/tmdb-456');
  });

  it('should return CSV with only headers when list is empty', async () => {
    const req = {
      method: 'GET',
      query: { listId: mockListId },
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    
    const res = { 
      status: jest.fn(() => res), 
      json: jest.fn(),
      set: jest.fn(() => res),
      send: jest.fn()
    };

    // Mock auth verification to succeed
    const mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: mockUserId });
    mockAuth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });
    
    // Mock Firestore to return an empty list
    const mockItemsSnapshot = {
      empty: true,
      docs: [],
    };
    
    const mockItemsGet = jest.fn().mockResolvedValue(mockItemsSnapshot);
    const mockItemsCollectionRef = jest.fn().mockReturnValue({ get: mockItemsGet });
    
    const mockListGet = jest.fn().mockResolvedValue({ 
      exists: true,
      data: () => ({ ownerId: mockUserId }) 
    });
    const mockListDoc = jest.fn().mockReturnValue({ get: mockListGet });
    
    const mockCollection = jest.fn((...args) => {
      if (args[0] === 'users') {
        const mockUserCollection = jest.fn((userId) => {
          if (userId === mockUserId) {
            const mockCustomListsCollection = jest.fn((listType) => {
              if (listType === 'custom_lists') {
                const mockListRef = jest.fn((listId) => {
                  if (listId === mockListId) {
                    return { get: mockListGet, collection: mockItemsCollectionRef };
                  }
                  return { get: jest.fn().mockResolvedValue({ exists: false }) };
                });
                return mockListRef;
              }
              return jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) });
            });
            return mockCustomListsCollection;
          }
          return jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) });
        });
        return mockUserCollection;
      }
      return jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) });
    });
    
    const mockDb = {
      collection: mockCollection,
    };
    
    mockFirestore.mockReturnValue(mockDb);

    await exportListToCsv(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.set).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="list-${mockListId}-export.csv"`);
    
    // Check that CSV content has only headers
    const csvContent = res.send.mock.calls[0][0];
    expect(csvContent).toBe('tmdbId,Name,Year,Letterboxd URI\n');
  });
});