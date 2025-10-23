import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const validateRegistration = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("role")
    .optional()
    .isIn(["student", "teacher", "admin"])
    .withMessage("Role must be either student, teacher, or admin"),

  body("profile.firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("profile.lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("profile.phone")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
      // Accept Vietnamese phone numbers: 10 digits, start with 0 or +84 and valid prefix (3,5,7,8,9)
      return /^0[35789]\d{8}$/.test(value) || /^\+84[35789]\d{8}$/.test(value);
    })
    .withMessage("Please enter a valid phone number"),

  handleValidationErrors,
];

export const validateLogin = [
  body("username").notEmpty().withMessage("Username or email is required"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

export const validateUpdateProfile = [
  body("profile.firstName")
    .optional()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("profile.lastName")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("profile.phone")
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
      return /^0[35789]\d{8}$/.test(value) || /^\+84[35789]\d{8}$/.test(value);
    })
    .withMessage("Please enter a valid phone number"),

  body("profile.dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date"),

  handleValidationErrors,
];

export const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  handleValidationErrors,
];
