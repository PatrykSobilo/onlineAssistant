const UserSettings = require('../models/UserSettings');

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let settings = await UserSettings.findOne({ where: { userId } });
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await UserSettings.create({
        userId,
        language: 'pl-PL',
        theme: 'light',
        notificationsEnabled: true
      });
    }
    
    res.json({
      language: settings.language,
      theme: settings.theme,
      notificationsEnabled: settings.notificationsEnabled
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Błąd pobierania ustawień' });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language, theme, notificationsEnabled } = req.body;
    
    let settings = await UserSettings.findOne({ where: { userId } });
    
    if (!settings) {
      settings = await UserSettings.create({
        userId,
        language,
        theme,
        notificationsEnabled
      });
    } else {
      await settings.update({
        language,
        theme,
        notificationsEnabled
      });
    }
    
    res.json({ 
      message: 'Ustawienia zaktualizowane',
      settings: {
        language: settings.language,
        theme: settings.theme,
        notificationsEnabled: settings.notificationsEnabled
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Błąd aktualizacji ustawień' });
  }
};
