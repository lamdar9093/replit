import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertDepartmentSchema,
  insertShiftSchema,
  insertTimeOffRequestSchema,
  insertActivitySchema,
  insertMessageSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to validate request body with zod schema
  function validateRequest(req: Request, schema: any) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new Error(`Validation error: ${result.error.message}`);
    }
    return result.data;
  }

  // Auth routes
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Don't send the password back
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // User routes
  app.get('/api/users', async (req, res) => {
    const users = await storage.getUsers();
    // Filter out passwords
    const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
    res.json(usersWithoutPasswords);
  });

  app.get('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't send the password back
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = validateRequest(req, insertUserSchema);
      const user = await storage.createUser(userData);
      
      // Don't send the password back
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
      const userData = validateRequest(req, insertUserSchema.partial());
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send the password back
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const success = await storage.deleteUser(id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(204).end();
  });

  // Department routes
  app.get('/api/departments', async (req, res) => {
    const departments = await storage.getDepartments();
    res.json(departments);
  });

  app.get('/api/departments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const department = await storage.getDepartment(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  });

  app.post('/api/departments', async (req, res) => {
    try {
      const departmentData = validateRequest(req, insertDepartmentSchema);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put('/api/departments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
      const departmentData = validateRequest(req, insertDepartmentSchema.partial());
      const updatedDepartment = await storage.updateDepartment(id, departmentData);
      
      if (!updatedDepartment) {
        return res.status(404).json({ message: 'Department not found' });
      }
      
      res.json(updatedDepartment);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete('/api/departments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const success = await storage.deleteDepartment(id);
    if (!success) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(204).end();
  });

  // Shift routes
  app.get('/api/shifts', async (req, res) => {
    const { startDate, endDate, userId } = req.query;
    
    if (startDate && endDate) {
      try {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        const shifts = await storage.getShiftsByDateRange(start, end);
        return res.json(shifts);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    } else if (userId) {
      const id = parseInt(userId as string);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      const shifts = await storage.getShiftsByUser(id);
      return res.json(shifts);
    } else {
      const shifts = await storage.getShifts();
      res.json(shifts);
    }
  });

  app.get('/api/shifts/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const shift = await storage.getShift(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    res.json(shift);
  });

  app.post('/api/shifts', async (req, res) => {
    try {
      const shiftData = validateRequest(req, insertShiftSchema);
      const shift = await storage.createShift(shiftData);
      
      // Create an activity for the new shift
      const user = await storage.getUser(shiftData.userId);
      if (user) {
        await storage.createActivity({
          type: 'shift_added',
          description: `Nouveau quart ajouté pour ${user.firstName} ${user.lastName} le ${new Date(shiftData.date).toLocaleDateString()}`,
          userId: req.body.createdBy || null,
          relatedUserId: shiftData.userId
        });
      }
      
      res.status(201).json(shift);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put('/api/shifts/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
      const shiftData = validateRequest(req, insertShiftSchema.partial());
      const updatedShift = await storage.updateShift(id, shiftData);
      
      if (!updatedShift) {
        return res.status(404).json({ message: 'Shift not found' });
      }
      
      res.json(updatedShift);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete('/api/shifts/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const success = await storage.deleteShift(id);
    if (!success) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    res.status(204).end();
  });

  // Time Off Request routes
  app.get('/api/time-off', async (req, res) => {
    const { userId, status } = req.query;
    
    if (userId) {
      const id = parseInt(userId as string);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      const requests = await storage.getTimeOffRequestsByUser(id);
      return res.json(requests);
    } else if (status === 'pending') {
      const requests = await storage.getPendingTimeOffRequests();
      return res.json(requests);
    } else {
      const requests = await storage.getTimeOffRequests();
      res.json(requests);
    }
  });

  app.get('/api/time-off/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const request = await storage.getTimeOffRequest(id);
    if (!request) {
      return res.status(404).json({ message: 'Time off request not found' });
    }

    res.json(request);
  });

  app.post('/api/time-off', async (req, res) => {
    try {
      const requestData = validateRequest(req, insertTimeOffRequestSchema);
      const request = await storage.createTimeOffRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post('/api/time-off/:id/approve', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const { reviewerId } = req.body;
    if (!reviewerId) {
      return res.status(400).json({ message: 'Reviewer ID is required' });
    }

    const approvedRequest = await storage.approveTimeOffRequest(id, reviewerId);
    if (!approvedRequest) {
      return res.status(404).json({ message: 'Time off request not found' });
    }

    res.json(approvedRequest);
  });

  app.post('/api/time-off/:id/deny', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const { reviewerId } = req.body;
    if (!reviewerId) {
      return res.status(400).json({ message: 'Reviewer ID is required' });
    }

    const deniedRequest = await storage.denyTimeOffRequest(id, reviewerId);
    if (!deniedRequest) {
      return res.status(404).json({ message: 'Time off request not found' });
    }

    res.json(deniedRequest);
  });

  // Activity routes
  app.get('/api/activities', async (req, res) => {
    const { limit } = req.query;
    
    let activities;
    if (limit) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum)) {
        return res.status(400).json({ message: 'Invalid limit format' });
      }
      
      activities = await storage.getActivities(limitNum);
    } else {
      activities = await storage.getActivities();
    }
    
    res.json(activities);
  });

  app.post('/api/activities', async (req, res) => {
    try {
      const activityData = validateRequest(req, insertActivitySchema);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Message routes
  app.get('/api/messages', async (req, res) => {
    const { userId } = req.query;
    
    if (userId) {
      const id = parseInt(userId as string);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      const messages = await storage.getMessagesByUser(id);
      return res.json(messages);
    } else {
      const messages = await storage.getMessages();
      res.json(messages);
    }
  });

  app.get('/api/messages/unread-count/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const count = await storage.getUnreadMessageCount(userId);
    res.json({ count });
  });

  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = validateRequest(req, insertMessageSchema);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post('/api/messages/:id/read', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const updatedMessage = await storage.markMessageAsRead(id);
    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(updatedMessage);
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
