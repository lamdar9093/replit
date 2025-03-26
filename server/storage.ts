import { 
  users, type User, type InsertUser,
  departments, type Department, type InsertDepartment,
  shifts, type Shift, type InsertShift,
  timeOffRequests, type TimeOffRequest, type InsertTimeOffRequest,
  activities, type Activity, type InsertActivity,
  messages, type Message, type InsertMessage
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, data: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Shifts
  getShift(id: number): Promise<Shift | undefined>;
  getShifts(): Promise<Shift[]>;
  getShiftsByUser(userId: number): Promise<Shift[]>;
  getShiftsByDateRange(startDate: Date, endDate: Date): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, data: Partial<InsertShift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;

  // Time Off Requests
  getTimeOffRequest(id: number): Promise<TimeOffRequest | undefined>;
  getTimeOffRequests(): Promise<TimeOffRequest[]>;
  getPendingTimeOffRequests(): Promise<TimeOffRequest[]>;
  getTimeOffRequestsByUser(userId: number): Promise<TimeOffRequest[]>;
  createTimeOffRequest(request: InsertTimeOffRequest): Promise<TimeOffRequest>;
  updateTimeOffRequest(id: number, data: Partial<TimeOffRequest>): Promise<TimeOffRequest | undefined>;
  approveTimeOffRequest(id: number, reviewerId: number): Promise<TimeOffRequest | undefined>;
  denyTimeOffRequest(id: number, reviewerId: number): Promise<TimeOffRequest | undefined>;

  // Activities
  getActivity(id: number): Promise<Activity | undefined>;
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  getMessages(): Promise<Message[]>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private shifts: Map<number, Shift>;
  private timeOffRequests: Map<number, TimeOffRequest>;
  private activities: Map<number, Activity>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private departmentIdCounter: number;
  private shiftIdCounter: number;
  private timeOffRequestIdCounter: number;
  private activityIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.shifts = new Map();
    this.timeOffRequests = new Map();
    this.activities = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.departmentIdCounter = 1;
    this.shiftIdCounter = 1;
    this.timeOffRequestIdCounter = 1;
    this.activityIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Create default departments
    const departments = [
      { name: "Service", color: "#67e8f9" },
      { name: "Cuisine", color: "#a3e635" },
      { name: "Réception", color: "#818cf8" },
      { name: "Administration", color: "#fb923c" },
    ];
    
    departments.forEach(dept => this.createDepartment(dept));
    
    // Create default users
    const defaultUsers = [
      { 
        username: "admin", 
        password: "password", 
        firstName: "Thomas", 
        lastName: "Martin", 
        role: "manager", 
        department: "Administration",
        position: "Gestionnaire", 
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
      },
      { 
        username: "sophie", 
        password: "password", 
        firstName: "Sophie", 
        lastName: "Martin", 
        role: "employee", 
        department: "Service",
        position: "Service", 
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
      },
      { 
        username: "alex", 
        password: "password", 
        firstName: "Alex", 
        lastName: "Dubois", 
        role: "employee", 
        department: "Cuisine",
        position: "Cuisine", 
        profileImage: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
      },
      { 
        username: "julie", 
        password: "password", 
        firstName: "Julie", 
        lastName: "Moreau", 
        role: "employee", 
        department: "Réception",
        position: "Réception", 
        profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
      }
    ];
    
    const userIds: { [key: string]: number } = {};
    
    defaultUsers.forEach(user => {
      const createdUser = this.createUser(user);
      userIds[user.username] = createdUser.id;
    });
    
    // Create some default shifts
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    // Create shifts for the current week
    const shifts = [
      {
        userId: userIds.sophie,
        date: new Date(monday),
        startTime: '09:00:00',
        endTime: '17:00:00',
        department: 'Service',
        notes: ''
      },
      {
        userId: userIds.sophie,
        date: new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000), // Wednesday
        startTime: '13:00:00',
        endTime: '21:00:00',
        department: 'Service',
        notes: ''
      },
      {
        userId: userIds.sophie,
        date: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000), // Friday
        startTime: '10:00:00',
        endTime: '18:00:00',
        department: 'Service',
        notes: ''
      },
      {
        userId: userIds.alex,
        date: new Date(monday.getTime() + 1 * 24 * 60 * 60 * 1000), // Tuesday
        startTime: '08:00:00',
        endTime: '16:00:00',
        department: 'Cuisine',
        notes: ''
      },
      {
        userId: userIds.alex,
        date: new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000), // Wednesday
        startTime: '08:00:00',
        endTime: '16:00:00',
        department: 'Cuisine',
        notes: ''
      },
      {
        userId: userIds.alex,
        date: new Date(monday.getTime() + 3 * 24 * 60 * 60 * 1000), // Thursday
        startTime: '08:00:00',
        endTime: '16:00:00',
        department: 'Cuisine',
        notes: ''
      },
      {
        userId: userIds.alex,
        date: new Date(monday.getTime() + 5 * 24 * 60 * 60 * 1000), // Saturday
        startTime: '11:00:00',
        endTime: '19:00:00',
        department: 'Cuisine',
        notes: ''
      },
      {
        userId: userIds.julie,
        date: new Date(monday.getTime() + 3 * 24 * 60 * 60 * 1000), // Thursday
        startTime: '14:00:00',
        endTime: '22:00:00',
        department: 'Réception',
        notes: ''
      },
      {
        userId: userIds.julie,
        date: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000), // Friday
        startTime: '14:00:00',
        endTime: '22:00:00',
        department: 'Réception',
        notes: ''
      },
      {
        userId: userIds.julie,
        date: new Date(monday.getTime() + 5 * 24 * 60 * 60 * 1000), // Saturday
        startTime: '12:00:00',
        endTime: '20:00:00',
        department: 'Réception',
        notes: ''
      }
    ];
    
    shifts.forEach(shift => this.createShift(shift));
    
    // Create sample time off requests
    const timeOffRequests = [
      {
        userId: userIds.julie,
        startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000),
        reason: 'Congé pour raisons personnelles'
      },
      {
        userId: userIds.alex,
        startDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        reason: 'Demande d\'échange de quart avec Sophie'
      },
      {
        userId: userIds.sophie,
        startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        reason: 'Rendez-vous médical'
      }
    ];
    
    timeOffRequests.forEach(request => this.createTimeOffRequest(request));
    
    // Create sample activities
    const activities = [
      {
        type: 'approval',
        description: 'Demande de congé approuvée',
        userId: userIds.admin,
        relatedUserId: userIds.sophie
      },
      {
        type: 'shift_added',
        description: 'Nouveau quart ajouté',
        userId: userIds.admin,
        relatedUserId: userIds.alex
      },
      {
        type: 'shift_swap',
        description: 'Échange de quart',
        userId: userIds.julie,
        relatedUserId: userIds.sophie
      },
      {
        type: 'denial',
        description: 'Demande de congé refusée',
        userId: userIds.admin,
        relatedUserId: userIds.alex
      },
      {
        type: 'late',
        description: 'Pointage en retard',
        userId: null,
        relatedUserId: userIds.sophie
      }
    ];
    
    activities.forEach(activity => this.createActivity(activity));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Departments
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const newDepartment: Department = { ...department, id };
    this.departments.set(id, newDepartment);
    return newDepartment;
  }

  async updateDepartment(id: number, data: Partial<InsertDepartment>): Promise<Department | undefined> {
    const department = await this.getDepartment(id);
    if (!department) return undefined;
    
    const updatedDepartment: Department = { ...department, ...data };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
  }

  // Shifts
  async getShift(id: number): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }

  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values());
  }

  async getShiftsByUser(userId: number): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => shift.userId === userId);
  }

  async getShiftsByDateRange(startDate: Date, endDate: Date): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= startDate && shiftDate <= endDate;
    });
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const id = this.shiftIdCounter++;
    const newShift: Shift = { ...shift, id };
    this.shifts.set(id, newShift);
    return newShift;
  }

  async updateShift(id: number, data: Partial<InsertShift>): Promise<Shift | undefined> {
    const shift = await this.getShift(id);
    if (!shift) return undefined;
    
    const updatedShift: Shift = { ...shift, ...data };
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }

  async deleteShift(id: number): Promise<boolean> {
    return this.shifts.delete(id);
  }

  // Time Off Requests
  async getTimeOffRequest(id: number): Promise<TimeOffRequest | undefined> {
    return this.timeOffRequests.get(id);
  }

  async getTimeOffRequests(): Promise<TimeOffRequest[]> {
    return Array.from(this.timeOffRequests.values());
  }

  async getPendingTimeOffRequests(): Promise<TimeOffRequest[]> {
    return Array.from(this.timeOffRequests.values()).filter(request => request.status === 'pending');
  }

  async getTimeOffRequestsByUser(userId: number): Promise<TimeOffRequest[]> {
    return Array.from(this.timeOffRequests.values()).filter(request => request.userId === userId);
  }

  async createTimeOffRequest(request: InsertTimeOffRequest): Promise<TimeOffRequest> {
    const id = this.timeOffRequestIdCounter++;
    const newRequest: TimeOffRequest = { 
      ...request, 
      id, 
      status: 'pending', 
      createdAt: new Date(), 
      reviewedBy: null, 
      reviewedAt: null 
    };
    this.timeOffRequests.set(id, newRequest);
    return newRequest;
  }

  async updateTimeOffRequest(id: number, data: Partial<TimeOffRequest>): Promise<TimeOffRequest | undefined> {
    const request = await this.getTimeOffRequest(id);
    if (!request) return undefined;
    
    const updatedRequest: TimeOffRequest = { ...request, ...data };
    this.timeOffRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async approveTimeOffRequest(id: number, reviewerId: number): Promise<TimeOffRequest | undefined> {
    const request = await this.getTimeOffRequest(id);
    if (!request) return undefined;
    
    const updatedRequest: TimeOffRequest = { 
      ...request, 
      status: 'approved', 
      reviewedBy: reviewerId, 
      reviewedAt: new Date() 
    };
    this.timeOffRequests.set(id, updatedRequest);
    
    // Create an activity for this approval
    const reviewer = await this.getUser(reviewerId);
    const requester = await this.getUser(request.userId);
    
    if (reviewer && requester) {
      await this.createActivity({
        type: 'approval',
        description: `La demande de congé de ${requester.firstName} ${requester.lastName} a été approuvée par ${reviewer.firstName} ${reviewer.lastName}`,
        userId: reviewerId,
        relatedUserId: request.userId
      });
    }
    
    return updatedRequest;
  }

  async denyTimeOffRequest(id: number, reviewerId: number): Promise<TimeOffRequest | undefined> {
    const request = await this.getTimeOffRequest(id);
    if (!request) return undefined;
    
    const updatedRequest: TimeOffRequest = { 
      ...request, 
      status: 'denied', 
      reviewedBy: reviewerId, 
      reviewedAt: new Date() 
    };
    this.timeOffRequests.set(id, updatedRequest);
    
    // Create an activity for this denial
    const reviewer = await this.getUser(reviewerId);
    const requester = await this.getUser(request.userId);
    
    if (reviewer && requester) {
      await this.createActivity({
        type: 'denial',
        description: `La demande de congé de ${requester.firstName} ${requester.lastName} a été refusée par ${reviewer.firstName} ${reviewer.lastName}`,
        userId: reviewerId,
        relatedUserId: request.userId
      });
    }
    
    return updatedRequest;
  }

  // Activities
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const allActivities = Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? allActivities.slice(0, limit) : allActivities;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const newActivity: Activity = { ...activity, id, createdAt: new Date() };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Messages
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId);
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.isRead)
      .length;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = { ...message, id, isRead: false, createdAt: new Date() };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;
    
    const updatedMessage: Message = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

export const storage = new MemStorage();
