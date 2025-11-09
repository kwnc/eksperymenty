/**
 * Authentication Module - Handles user registration, login, and session management
 * Uses bcrypt-like hashing simulation for password security
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
    }

    // Simple hash function for passwords (in production, use proper bcrypt)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'noteNestSalt2023');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Validate password strength
    validatePassword(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Register new user
    async register(userData) {
        try {
            const { username, email, password, firstName, lastName } = userData;

            // Validate input
            if (!username || username.length < 3) {
                throw new Error('Username must be at least 3 characters long');
            }

            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }

            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors[0]);
            }

            // Check if user already exists
            const existingUser = await window.storage.getUserByUsername(username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            // Hash password and create user
            const hashedPassword = await this.hashPassword(password);
            const newUserId = await window.storage.createUser({
                username,
                email,
                password: hashedPassword,
                firstName: firstName || '',
                lastName: lastName || '',
                isActive: true,
                lastLoginAt: null,
                preferences: {
                    theme: 'light',
                    autoSave: true,
                    autoSaveInterval: 30000
                }
            });

            const newUser = await window.storage.getUser(newUserId);
            return {
                success: true,
                user: this.sanitizeUser(newUser),
                message: 'Account created successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // User login
    async login(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            const user = await window.storage.getUserByUsername(username);
            if (!user) {
                throw new Error('Invalid username or password');
            }

            if (!user.isActive) {
                throw new Error('Account has been deactivated');
            }

            // Verify password
            const hashedPassword = await this.hashPassword(password);
            if (hashedPassword !== user.password) {
                throw new Error('Invalid username or password');
            }

            // Update last login time
            user.lastLoginAt = new Date().toISOString();
            await window.storage.update('users', user);

            // Set current user and start session
            this.currentUser = this.sanitizeUser(user);
            window.storage.setCurrentUser(this.currentUser);
            this.startSession();

            return {
                success: true,
                user: this.currentUser,
                message: 'Login successful'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // User logout
    async logout() {
        try {
            this.currentUser = null;
            await window.storage.logout();
            this.clearSession();

            return {
                success: true,
                message: 'Logged out successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Restore session on page load
    async restoreSession() {
        try {
            const user = await window.storage.getCurrentUser();
            if (user) {
                this.currentUser = this.sanitizeUser(user);
                this.startSession();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error restoring session:', error);
            return false;
        }
    }

    // Start session timer
    startSession() {
        this.clearSession();
        this.sessionTimer = setTimeout(() => {
            this.logout();
            window.dispatchEvent(new CustomEvent('sessionExpired'));
        }, this.sessionTimeout);
    }

    // Clear session timer
    clearSession() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    // Extend session (call on user activity)
    extendSession() {
        if (this.currentUser) {
            this.startSession();
        }
    }

    // Update user profile
    async updateProfile(userData) {
        try {
            if (!this.currentUser) {
                throw new Error('Not authenticated');
            }

            const user = await window.storage.getUser(this.currentUser.id);
            if (!user) {
                throw new Error('User not found');
            }

            // Update allowed fields
            const allowedFields = ['firstName', 'lastName', 'email'];
            const updatedData = { ...user };

            allowedFields.forEach(field => {
                if (userData[field] !== undefined) {
                    updatedData[field] = userData[field];
                }
            });

            if (userData.email && !this.validateEmail(userData.email)) {
                throw new Error('Invalid email format');
            }

            await window.storage.update('users', updatedData);
            this.currentUser = this.sanitizeUser(updatedData);
            window.storage.setCurrentUser(this.currentUser);

            return {
                success: true,
                user: this.currentUser,
                message: 'Profile updated successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('Not authenticated');
            }

            const user = await window.storage.getUser(this.currentUser.id);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const hashedCurrentPassword = await this.hashPassword(currentPassword);
            if (hashedCurrentPassword !== user.password) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password
            const passwordValidation = this.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors[0]);
            }

            // Update password
            user.password = await this.hashPassword(newPassword);
            await window.storage.update('users', user);

            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Remove sensitive data from user object
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    // Initialize auth manager
    async init() {
        // Restore session if exists
        await this.restoreSession();

        // Set up activity listeners to extend session
        const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                this.extendSession();
            }, { passive: true });
        });
    }
}

// Global auth instance
window.auth = new AuthManager();