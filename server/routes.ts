import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertDepartmentSchema,
  insertShiftSchema,
  updateShiftSchema,
  insertTimeOffRequestSchema,
  insertActivitySchema,
  insertMessageSchema
} from "@shared/schema";
import { authenticate, checkPermission } from "./middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to validate request body with zod schema
  function validateRequest(req: Request, schema: any) {
    console.log("Validating request body:", req.body);
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedError = JSON.stringify(result.error.format(), null, 2);
      console.error("Validation errors:", formattedError);
      throw new Error(`Validation error: ${formattedError}`);
    }
    console.log("Validation successful. Transformed data:", result.data);
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
  app.get('/api/users', authenticate, checkPermission('viewUsers'), async (req, res) => {
    const users = await storage.getUsers();
    // Filter out passwords
    const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
    res.json(usersWithoutPasswords);
  });

  app.get('/api/users/:id', authenticate, checkPermission('viewUsers'), async (req, res) => {
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

  app.post('/api/users', authenticate, checkPermission('createUser'), async (req, res) => {
    try {
      const userData = validateRequest(req, insertUserSchema);
      const user = await storage.createUser(userData);
      
      // Don't send the password back
      const { password, ...userWithoutPassword } = user;
      
      // Créer une activité pour tracer la création d'utilisateur
      await storage.createActivity({
        type: 'user_created',
        description: `Nouvel utilisateur créé: ${userData.firstName} ${userData.lastName}`,
        userId: req.currentUser?.id || null,
        relatedUserId: user.id
      });
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put('/api/users/:id', authenticate, async (req, res, next) => {
    // Permission spéciale: chaque utilisateur peut modifier son propre profil
    const id = parseInt(req.params.id);
    if (req.currentUser?.id === id) {
      // Limiter les champs que l'utilisateur peut modifier
      const allowedFields = ['firstName', 'lastName', 'password', 'profileImage'];
      const filteredData = Object.keys(req.body)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as any);
      
      req.body = filteredData;
      next();
    } else {
      // Sinon, vérifier la permission d'édition
      checkPermission('editUser')(req, res, next);
    }
  }, async (req, res) => {
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

  app.delete('/api/users/:id', authenticate, checkPermission('deleteUser'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const success = await storage.deleteUser(id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Créer une activité pour tracer la suppression d'utilisateur
    await storage.createActivity({
      type: 'user_deleted',
      description: `Utilisateur supprimé (ID: ${id})`,
      userId: req.currentUser?.id || null,
    });
    
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

  app.post('/api/departments', authenticate, checkPermission('createDepartment'), async (req, res) => {
    try {
      const departmentData = validateRequest(req, insertDepartmentSchema);
      const department = await storage.createDepartment(departmentData);
      
      // Créer une activité pour tracer la création de département
      await storage.createActivity({
        type: 'department_created',
        description: `Nouveau département créé: ${departmentData.name}`,
        userId: req.currentUser?.id || null,
      });
      
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put('/api/departments/:id', authenticate, checkPermission('editDepartment'), async (req, res) => {
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
      
      // Créer une activité pour tracer la modification de département
      await storage.createActivity({
        type: 'department_updated',
        description: `Département modifié: ${updatedDepartment.name}`,
        userId: req.currentUser?.id || null,
      });
      
      res.json(updatedDepartment);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete('/api/departments/:id', authenticate, checkPermission('deleteDepartment'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Récupérer le département avant de le supprimer pour l'activité
    const department = await storage.getDepartment(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const success = await storage.deleteDepartment(id);
    if (!success) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Créer une activité pour tracer la suppression de département
    await storage.createActivity({
      type: 'department_deleted',
      description: `Département supprimé: ${department.name}`,
      userId: req.currentUser?.id || null,
    });
    
    res.status(204).end();
  });

  // Shift routes
  app.get('/api/shifts', authenticate, checkPermission('viewShifts'), async (req, res) => {
    const { startDate, endDate, userId } = req.query;
    
    // Si l'utilisateur actuel est un employé, il ne peut voir que ses propres quarts
    if (req.currentUser?.role === 'employee' && !userId) {
      const shifts = await storage.getShiftsByUser(req.currentUser.id);
      return res.json(shifts);
    }
    
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

  app.get('/api/shifts/:id', authenticate, checkPermission('viewShifts'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const shift = await storage.getShift(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Si l'utilisateur est un employé, il ne peut voir que ses propres quarts
    if (req.currentUser?.role === 'employee' && shift.userId !== req.currentUser.id) {
      return res.status(403).json({ message: 'Permission refusée' });
    }

    res.json(shift);
  });

  app.post('/api/shifts', authenticate, checkPermission('createShift'), async (req, res) => {
    try {
      console.log("Données reçues pour le quart:", req.body);
      
      // Valider les données entrantes
      const validatedData = validateRequest(req, insertShiftSchema);
      console.log("Données validées:", validatedData);
      
      const shift = await storage.createShift(validatedData);
      
      // Récupérer les informations de l'utilisateur pour l'activité et la notification
      const user = await storage.getUser(validatedData.userId);
      if (user) {
        // Formater la date pour l'affichage
        const formattedDate = new Date(validatedData.date).toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long',
          year: 'numeric'
        });
        
        // Créer une activité pour le nouveau quart
        await storage.createActivity({
          type: 'shift_added',
          description: `Nouveau quart ajouté pour ${user.firstName} ${user.lastName} le ${formattedDate}`,
          userId: req.currentUser?.id || null,
          relatedUserId: validatedData.userId
        });
        
        // Si notification est demandée, envoyer un message à l'employé
        if (req.body.notifyEmployee) {
          // Créer un message dans le système
          await storage.createMessage({
            senderId: req.currentUser?.id || null,
            receiverId: user.id,
            subject: "Nouveau quart de travail",
            content: `Un nouveau quart de travail a été ajouté à votre horaire:\n\nDate: ${formattedDate}\nHoraire: ${validatedData.startTime.substring(0, 5)} à ${validatedData.endTime.substring(0, 5)}\nDépartement: ${validatedData.department}`,
            priority: "high",
            messageType: "notification"
          });
          
          // Ici, on pourrait ajouter l'envoi d'un email à l'employé
        }
      }
      
      res.status(201).json(shift);
    } catch (error) {
      console.error("Erreur lors de la création du quart:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put('/api/shifts/:id', authenticate, async (req, res, next) => {
    // Récupérer le quart existant
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    const shift = await storage.getShift(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Si l'utilisateur est un employé et que c'est son propre quart, utiliser la permission editOwnShift
    if (req.currentUser?.role === 'employee' && shift.userId === req.currentUser.id) {
      checkPermission('editOwnShift')(req, res, next);
    } else {
      // Sinon, vérifier la permission générale d'édition
      checkPermission('editShift')(req, res, next);
    }
  }, async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      // Récupérer le quart existant pour l'activité et les notifications
      const existingShift = await storage.getShift(id);
      if (!existingShift) {
        return res.status(404).json({ message: 'Shift not found' });
      }
      
      const shiftData = validateRequest(req, updateShiftSchema);
      const updatedShift = await storage.updateShift(id, shiftData);
      
      // Récupérer l'utilisateur concerné
      const user = await storage.getUser(existingShift.userId);
      if (user) {
        // Créer une activité pour la modification du quart
        await storage.createActivity({
          type: 'shift_updated',
          description: `Quart modifié pour ${user.firstName} ${user.lastName} le ${new Date(existingShift.date).toLocaleDateString()}`,
          userId: req.currentUser?.id || null,
          relatedUserId: existingShift.userId
        });
        
        // Si notification est demandée, envoyer un message à l'employé
        if (req.body.notifyEmployee) {
          // Créer un message dans le système
          await storage.createMessage({
            senderId: req.currentUser?.id || null,
            receiverId: user.id,
            subject: "Modification de votre horaire",
            content: `Votre quart de travail du ${new Date(existingShift.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a été modifié.\n\nNouveaux horaires: ${updatedShift?.startTime.substring(0, 5) || ''} à ${updatedShift?.endTime.substring(0, 5) || ''} - ${updatedShift?.department || ''}`,
            priority: "high",
            messageType: "notification"
          });
          
          // Ici, on pourrait ajouter l'envoi d'un email à l'employé
        }
      }
      
      res.json(updatedShift);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete('/api/shifts/:id', authenticate, checkPermission('deleteShift'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Récupérer le quart avant de le supprimer pour l'activité et les notifications
    const shift = await storage.getShift(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    const success = await storage.deleteShift(id);
    if (!success) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Récupérer l'utilisateur concerné
    const user = await storage.getUser(shift.userId);
    if (user) {
      // Créer une activité pour la suppression du quart
      await storage.createActivity({
        type: 'shift_deleted',
        description: `Quart supprimé pour ${user.firstName} ${user.lastName} le ${new Date(shift.date).toLocaleDateString()}`,
        userId: req.currentUser?.id || null,
        relatedUserId: shift.userId
      });
      
      // Si notification est demandée, envoyer un message à l'employé
      if (req.body.notifyEmployee) {
        // Créer un message dans le système
        await storage.createMessage({
          senderId: req.currentUser?.id || null,
          receiverId: user.id,
          subject: "Suppression d'un quart de travail",
          content: `Votre quart de travail du ${new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} (${shift.startTime.substring(0, 5)} à ${shift.endTime.substring(0, 5)} - ${shift.department}) a été supprimé.`,
          priority: "high",
          messageType: "notification"
        });
        
        // Ici, on pourrait ajouter l'envoi d'un email à l'employé
      }
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
