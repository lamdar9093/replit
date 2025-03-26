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
  
  // Mode développement/transition: permettre l'accès même sans authentification
  // mais avec des permissions réduites
  if (!userId) {
    // Si la route est publique (login, etc.), autoriser 
    if (req.path === '/api/login' || req.method === 'GET') {
      req.userPermissions = rolePermissions.employee;
      return next();
    }

    // Pour toutes les autres routes qui nécessitent une authentification,
    // utiliser un utilisateur "admin" temporaire pour le développement
    try {
      // Tenter de récupérer l'utilisateur admin (ID 1)
      const adminUser = await storage.getUser(1);
      if (adminUser) {
        req.currentUser = adminUser;
        req.userPermissions = rolePermissions.admin;
        return next();
      }
    } catch (error) {
      // Ignorer l'erreur et continuer avec la réponse 401
    }
    
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
    // Mode développement: Si les permissions sont déjà définies par le middleware d'authentification, on continue
    if (req.userPermissions) {
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
        if (req.userPermissions.editOwnShift && req.currentUser) {
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
    }
    // En mode développement, autoriser l'accès pour le moment
    else {
      // Pour la phase de développement, attribuer les permissions d'un admin provisoirement
      req.userPermissions = rolePermissions.admin;
    }
    
    next();
  };
};

// Helper pour obtenir les permissions d'un rôle
export const getPermissionsForRole = (role: Role): Permission => {
  return rolePermissions[role] || rolePermissions.employee;
};