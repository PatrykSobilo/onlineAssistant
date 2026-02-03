const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Create default settings for user
    await UserSettings.create({
      userId: user.id,
      language: 'en-US',
      theme: 'light',
      notificationsEnabled: true,
      defaultVoiceLanguage: 'en-US'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ User registered:', email);

    // Send response (without password)
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ User logged in:', email);

    // Send response (without password)
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    // userId comes from authMiddleware (req.user.id)
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'createdAt'],
      include: [{
        model: UserSettings,
        as: 'settings',
        attributes: ['language', 'theme', 'notificationsEnabled', 'defaultVoiceLanguage']
      }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    console.log('📝 Update profile request:', { userId, name, email });
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Imię i email są wymagane' });
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      where: { 
        email,
        id: { [require('sequelize').Op.ne]: userId }
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Ten email jest już używany przez innego użytkownika' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    await user.update({ name, email });
    
    console.log('✅ Profile updated for user:', user.email);
    
    res.json({
      success: true,
      message: 'Profil zaktualizowany',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Błąd aktualizacji profilu' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Obecne i nowe hasło są wymagane' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Obecne hasło jest nieprawidłowe' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await user.update({ password: hashedPassword });
    
    console.log('✅ Password changed for user:', user.email);
    
    res.json({
      success: true,
      message: 'Hasło zostało zmienione'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ error: 'Błąd zmiany hasła' });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Hasło jest wymagane do usunięcia konta' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Nieprawidłowe hasło' });
    }
    
    const userEmail = user.email;
    
    // Delete user (CASCADE will delete related data: settings, notes, categories, discussions, messages)
    await user.destroy();
    
    console.log('🗑️ Account deleted:', userEmail);
    
    res.json({
      success: true,
      message: 'Konto zostało usunięte'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({ error: 'Błąd usuwania konta' });
  }
};

