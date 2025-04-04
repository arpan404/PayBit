/**
 * Validates email format
 * @param email - Email to validate
 * @returns boolean indicating if email is valid
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * Password must be at least 8 characters long and contain at least:
 * - One uppercase letter
 * - One lowercase letter
 * - One number
 * - One special character
 * 
 * @param password - Password to validate
 * @returns boolean indicating if password meets requirements
 */
export const validatePassword = (password: string): boolean => {
  // At least 8 characters
  if (password.length < 8) return false;
  
  // Check for uppercase, lowercase, number, and special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};