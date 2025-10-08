const userService = require('../services/userService');
const logger = require('../config/logger');

class UserController {
  async register(req, res) {
    try {
      const result = await userService.registerUser(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Registration controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      const result = await userService.loginUser(identifier, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await userService.getUserById(req.user._id);
      
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'User not found'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await userService.updateUserProfile(req.user._id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Profile update failed'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await userService.changePassword(req.user._id, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Change password controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed'
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const filters = {
        role: req.query.role,
        isActive: req.query.isActive,
        search: req.query.search
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await userService.getAllUsers(filters, pagination);
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Get all users controller error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Get user by ID controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'User not found'
      });
    }
  }

  async deactivateUser(req, res) {
    try {
      const user = await userService.deactivateUser(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Deactivate user controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to deactivate user'
      });
    }
  }

  async activateUser(req, res) {
    try {
      const user = await userService.activateUser(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Activate user controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to activate user'
      });
    }
  }

  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();
      
      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Get user stats controller error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user statistics'
      });
    }
  }

  async logout(req, res) {
    try {
      // In a more advanced implementation, you might want to blacklist the token
      // For now, we'll just send a success response
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
}

module.exports = new UserController();