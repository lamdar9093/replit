import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Types de rôles disponibles
export type Role = "admin" | "manager" | "employee";

// Définition des permissions par fonctionnalité
export interface Permission {
  // Utilisateurs
  viewUsers: boolean;
  createUser: boolean;
  editUser: boolean;
  deleteUser: boolean;
  
  // Départements
  viewDepartments: boolean;
  createDepartment: boolean;
  editDepartment: boolean;
  deleteDepartment: boolean;
  
  // Quarts de travail
  viewShifts: boolean;
  createShift: boolean;
  editShift: boolean;
  editOwnShift: boolean;
  deleteShift: boolean;
  
  // Demandes de congé
  viewTimeOff: boolean;
  createTimeOff: boolean;
  approveTimeOff: boolean;
  
  // Messages
  viewMessages: boolean;
  sendMessages: boolean;
}

// Définition des permissions pour chaque rôle
const rolePermissions: Record<Role, Permission> = {
  admin: {
    viewUsers: true,
    createUser: true,
    editUser: true,
    deleteUser: true,
    
    viewDepartments: true,
    createDepartment: true,
    editDepartment: true,
    deleteDepartment: true,
    
    viewShifts: true,
    createShift: true,
    editShift: true,
    editOwnShift: true,
    deleteShift: true,
    
    viewTimeOff: true,
    createTimeOff: true,
    approveTimeOff: true,
    
    viewMessages: true,
    sendMessages: true
  },
  manager: {
    viewUsers: true,
    createUser: false,
    editUser: true,
    deleteUser: false,
    
    viewDepartments: true,
    createDepartment: false,
    editDepartment: false,
    deleteDepartment: false,
    
    viewShifts: true,
    createShift: true,
    editShift: true,
    editOwnShift: true, 
    deleteShift: true,
    
    viewTimeOff: true,
    createTimeOff: true,
    approveTimeOff: true,
    
    viewMessages: true,
    sendMessages: true
  },
  employee: {
    viewUsers: true,
    createUser: false,
    editUser: false,
    deleteUser: false,
    
    viewDepartments: true,
    createDepartment: false,
    editDepartment: false,
    deleteDepartment: false,
    
    viewShifts: true,
    createShift: false,
    editShift: false,
    editOwnShift: true, // Peut modifier ses propres quarts
    deleteShift: false,
    
    viewTimeOff: true,
    createTimeOff: true,
    approveTimeOff: false,
    
    viewMessages: true,
    sendMessages: true
  }
};

// Interface pour enrichir l'objet request d'Express
declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      userPermissions?: Permission;
    }
  }
}

// Middleware d'authentification
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Récupérer l'ID de l'utilisateur à partir d'un en-tête d'authentification
  const userId = req.headers["x-user-id"];
  
  if (!userId) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  
  try {
    const id = parseInt(userId as string);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
    
    // Attacher l'utilisateur à la requête
    req.currentUser = user;
    
    // Attacher les permissions à la requête
    const role = user.role as Role || "employee"; // Par défaut, un utilisateur est un employé
    req.userPermissions = rolePermissions[role];
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Erreur d'authentification" });
  }
};

// Middleware de vérification des permissions
export const checkPermission = (permissionKey: keyof Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Si l'utilisateur n'est pas authentifié, le middleware authenticate aurait dû bloquer la requête
    if (!req.currentUser || !req.userPermissions) {
      return res.status(401).json({ message: "Authentification requise" });
    }
    
    // Vérifier la permission
    if (!req.userPermissions[permissionKey]) {
      return res.status(403).json({ 
        message: "Permission refusée",
        detail: `Vous n'avez pas l'autorisation d'effectuer cette action (${permissionKey})`
      });
    }
    
    // Cas spécial pour la modification de ses propres quarts de travail
    if (permissionKey === "editShift" && !req.userPermissions.editShift) {
      // Si l'utilisateur ne peut pas modifier tous les quarts mais peut modifier les siens
      if (req.userPermissions.editOwnShift) {
        const shiftId = parseInt(req.params.id);
        const shiftUserId = parseInt(req.body.userId);
        
        // Vérifier si l'utilisateur essaie de modifier son propre quart
        if (req.currentUser.id !== shiftUserId) {
          return res.status(403).json({ 
            message: "Permission refusée",
            detail: "Vous ne pouvez modifier que vos propres quarts de travail"
          });
        }
      } else {
        return res.status(403).json({ 
          message: "Permission refusée",
          detail: "Vous n'avez pas l'autorisation de modifier des quarts de travail"
        });
      }
    }
    
    next();
  };
};

// Helper pour obtenir les permissions d'un rôle
export const getPermissionsForRole = (role: Role): Permission => {
  return rolePermissions[role] || rolePermissions.employee;
};