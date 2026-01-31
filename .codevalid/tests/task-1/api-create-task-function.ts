import { createTask } from '../../../frontend/src/api';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('api.createTask', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Valid Task Creation
  it('Valid Task Creation', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: 'Write documentation',
    };
    const responseTask = {
      ...inputTask,
      id: 'generated_by_backend',
    };
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: responseTask,
    });

    const result = await createTask(inputTask);
    expect(result).toEqual(responseTask);
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 2: Missing Required Field
  it('Missing Required Field', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      // title missing
    };
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Title is required' } },
    });

    await expect(createTask(inputTask)).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 3: Invalid Field Type
  it('Invalid Field Type', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: 12345, // invalid type
    };
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Title must be a string' } },
    });

    await expect(createTask(inputTask)).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 4: Empty String Title
  it('Empty String Title', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: '',
    };
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Title cannot be empty' } },
    });

    await expect(createTask(inputTask)).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 5: Boundary Long Title
  it('Boundary Long Title', async () => {
    const longTitle = 'T'.repeat(255);
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: longTitle,
    };
    const responseTask = {
      ...inputTask,
      id: 'generated_by_backend',
    };
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: responseTask,
    });

    const result = await createTask(inputTask);
    expect(result).toEqual(responseTask);
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 6: Invalid dueDate Format
  it('Invalid dueDate Format', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: 'not-a-date',
      priority: 'high',
      title: 'Write documentation',
    };
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Invalid dueDate format' } },
    });

    await expect(createTask(inputTask)).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 7: Priority Out of Allowed Values
  it('Priority Out of Allowed Values', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'urgent', // not allowed
      title: 'Write documentation',
    };
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Priority must be low, medium, or high' } },
    });

    await expect(createTask(inputTask)).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 8: Server Error Response
  it('Server Error Response', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: 'Write documentation',
    };
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Internal Server Error' } },
    });

    await expect(createTask(inputTask)).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 9: Network Failure
  it('Network Failure', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: 'Write documentation',
    };
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    await expect(createTask(inputTask)).rejects.toThrow('Network Error');
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });

  // Test Case 10: Extra Fields in Task
  it('Extra Fields in Task', async () => {
    const inputTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: 'Write documentation',
      unexpectedField: 'unexpectedValue',
    };
    // Option 1: API ignores extra fields and returns created task without them
    const responseTask = {
      description: 'Prepare API documentation for the new endpoint.',
      dueDate: '2024-07-01',
      priority: 'high',
      title: 'Write documentation',
      id: 'generated_by_backend',
    };
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: responseTask,
    });

    const result = await createTask(inputTask);
    expect(result).toEqual(responseTask);
    expect(result).not.toHaveProperty('unexpectedField');
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);

    // Option 2: API throws error for extra fields
    // Uncomment below to test error scenario
    // mockedAxios.post.mockRejectedValueOnce({
    //   response: { status: 400, data: { error: 'Unexpected field: unexpectedField' } },
    // });
    // await expect(createTask(inputTask)).rejects.toMatchObject({
    //   response: { status: 400 },
    // });
  });

  // Test Case 11: Minimum Fields Only
  it('Minimum Fields Only', async () => {
    const inputTask = {
      title: 'Write documentation',
    };
    const responseTask = {
      id: 'generated_by_backend',
      title: 'Write documentation',
    };
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: responseTask,
    });

    const result = await createTask(inputTask);
    expect(result).toEqual(responseTask);
    expect(mockedAxios.post).toHaveBeenCalledWith('/tasks', inputTask);
  });
});