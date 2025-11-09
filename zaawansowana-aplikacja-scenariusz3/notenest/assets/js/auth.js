// NoteNest - Authentication System
class AuthManager {
    constructor() {
        this.storageManager = null;
        this.currentUser = null;
        this.sessionKey = 'current_session';
        this.onAuthStateChanged = null;
        this.init();
    }

    async init() {
        // Wait for storage manager to be available
        if (typeof StorageManager !== 'undefined') {
            this.storageManager = new StorageManager();
        } else {
            // Fallback if StorageManager is not loaded yet
            setTimeout(() => this.init(), 100);
            return;
        }

        // Check for existing session
        await this.loadSession();
    }

    // Simple password hashing (Note: In production, use proper hashing like bcrypt)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'notenest_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Register new user
    async register(name, email, password) {
        try {
            if (!this.storageManager) {
                throw new Error('Storage manager not initialized');
            }

            // Validate inputs
            if (!name || !email || !password) {
                throw new Error('All fields are required');
            }

            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            // Check if user already exists
            const existingUser = await this.storageManager.getUserByEmail(email);
            if (existingUser) {
                throw new Error('An account with this email already exists');
            }

            // Hash password and create user
            const passwordHash = await this.hashPassword(password);
            const userData = {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                passwordHash: passwordHash,
                createdAt: new Date().toISOString()
            };

            const newUser = await this.storageManager.saveUser(userData);

            // Create default notebook
            await this.storageManager.saveNotebook({
                userId: newUser.id,
                name: 'Personal Notes',
                description: 'Your default notebook',
                color: '#E97900'
            });

            // Log the user in
            await this.login(email, password);

            return {
                success: true,
                message: 'Account created successfully!'
            };

        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Login user
    async login(email, password) {
        try {
            if (!this.storageManager) {
                throw new Error('Storage manager not initialized');
            }

            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Get user by email
            const user = await this.storageManager.getUserByEmail(email.toLowerCase().trim());
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Verify password
            const passwordHash = await this.hashPassword(password);
            if (passwordHash !== user.passwordHash) {
                throw new Error('Invalid email or password');
            }

            // Update last login
            await this.storageManager.updateUser(user.id, {
                lastLogin: new Date().toISOString()
            });

            // Create session
            this.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                lastLogin: new Date().toISOString()
            };

            // Save session
            this.storageManager.setSessionData(this.sessionKey, {
                userId: user.id,
                email: user.email,
                loginTime: new Date().toISOString()
            });

            // Trigger auth state change
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(this.currentUser);
            }

            return {
                success: true,
                message: 'Login successful',
                user: this.currentUser
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Logout user
    async logout() {
        try {
            this.currentUser = null;

            // Clear session data
            if (this.storageManager) {
                this.storageManager.clearSessionData(this.sessionKey);
            }

            // Trigger auth state change
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(null);
            }

            return {
                success: true,
                message: 'Logged out successfully'
            };

        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: 'Error during logout'
            };
        }
    }

    // Load existing session
    async loadSession() {
        try {
            if (!this.storageManager) return false;

            const sessionData = this.storageManager.getSessionData(this.sessionKey);
            if (!sessionData || !sessionData.userId) {
                return false;
            }

            // Check session age (expire after 30 days)
            const loginTime = new Date(sessionData.loginTime);
            const now = new Date();
            const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);

            if (daysDiff > 30) {
                this.storageManager.clearSessionData(this.sessionKey);
                return false;
            }

            // Get user data
            const user = await this.storageManager.getUserByEmail(sessionData.email);
            if (!user) {
                this.storageManager.clearSessionData(this.sessionKey);
                return false;
            }

            // Restore current user
            this.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin
            };

            // Trigger auth state change
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(this.currentUser);
            }

            return true;

        } catch (error) {
            console.error('Session load error:', error);
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Update user profile
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('Not authenticated');
            }

            const allowedUpdates = ['name'];
            const filteredUpdates = {};

            for (const key of allowedUpdates) {
                if (updates[key] !== undefined) {
                    filteredUpdates[key] = updates[key];
                }
            }

            if (Object.keys(filteredUpdates).length === 0) {
                throw new Error('No valid updates provided');
            }

            // Update in storage
            const updatedUser = await this.storageManager.updateUser(
                this.currentUser.id,
                filteredUpdates
            );

            // Update current user
            this.currentUser = {
                ...this.currentUser,
                ...filteredUpdates
            };

            return {
                success: true,
                message: 'Profile updated successfully',
                user: this.currentUser
            };

        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('Not authenticated');
            }

            // Get current user data
            const user = await this.storageManager.getUserByEmail(this.currentUser.email);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const currentPasswordHash = await this.hashPassword(currentPassword);
            if (currentPasswordHash !== user.passwordHash) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password
            const passwordValidation = this.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            // Hash new password and update
            const newPasswordHash = await this.hashPassword(newPassword);
            await this.storageManager.updateUser(this.currentUser.id, {
                passwordHash: newPasswordHash
            });

            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            console.error('Password change error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Delete account
    async deleteAccount(password) {
        try {
            if (!this.currentUser) {
                throw new Error('Not authenticated');
            }

            // Get current user data
            const user = await this.storageManager.getUserByEmail(this.currentUser.email);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify password
            const passwordHash = await this.hashPassword(password);
            if (passwordHash !== user.passwordHash) {
                throw new Error('Password is incorrect');
            }

            // Clear all user data
            await this.storageManager.clearUserData(this.currentUser.id);

            // Delete user account
            const transaction = this.storageManager.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            await new Promise((resolve, reject) => {
                const request = store.delete(this.currentUser.id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Logout
            await this.logout();

            return {
                success: true,
                message: 'Account deleted successfully'
            };

        } catch (error) {
            console.error('Account deletion error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Export user data
    async exportUserData() {
        try {
            if (!this.currentUser) {
                throw new Error('Not authenticated');
            }

            const data = await this.storageManager.exportData(this.currentUser.id);
            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('Data export error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Set authentication state change callback
    setAuthStateChangeCallback(callback) {
        this.onAuthStateChanged = callback;
    }
}

// Export for use in other modules
window.AuthManager = AuthManager;