const logger = require('./logger');

class NotificationService {
  constructor() {
    this.notifications = new Map(); // In-memory storage for notifications
  }

  // Add a notification for a user
  addNotification(userId, type, message, data = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      userId,
      type,
      message,
      data,
      timestamp: new Date(),
      read: false
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    this.notifications.get(userId).push(notification);
    logger.info(`Notification added for user ${userId}: ${type} - ${message}`);
    
    return notification;
  }

  // Get notifications for a user
  getNotifications(userId, unreadOnly = false) {
    const userNotifications = this.notifications.get(userId) || [];
    
    if (unreadOnly) {
      return userNotifications.filter(n => !n.read);
    }
    
    return userNotifications.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Mark notification as read
  markAsRead(userId, notificationId) {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      logger.debug(`Notification ${notificationId} marked as read for user ${userId}`);
      return true;
    }
    
    return false;
  }

  // Mark all notifications as read for a user
  markAllAsRead(userId) {
    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.forEach(n => n.read = true);
    logger.debug(`All notifications marked as read for user ${userId}`);
  }

  // Delete a notification
  deleteNotification(userId, notificationId) {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      userNotifications.splice(index, 1);
      logger.debug(`Notification ${notificationId} deleted for user ${userId}`);
      return true;
    }
    
    return false;
  }

  // Create medication reminder notification
  createMedicationReminder(userId, medication) {
    const message = `Time to take ${medication.name} (${medication.dosage})`;
    return this.addNotification(userId, 'medication_reminder', message, {
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      time: medication.time
    });
  }

  // Create appointment reminder notification
  createAppointmentReminder(userId, appointment) {
    const message = `Upcoming appointment: ${appointment.title} on ${appointment.date} at ${appointment.time}`;
    return this.addNotification(userId, 'appointment_reminder', message, {
      appointmentId: appointment.id,
      title: appointment.title,
      date: appointment.date,
      time: appointment.time,
      location: appointment.location
    });
  }

  // Create health score update notification
  createHealthScoreNotification(userId, score, trend) {
    let message = `Your health score is ${score}/100`;
    if (trend > 0) {
      message += ` (improved by ${trend} points)`;
    } else if (trend < 0) {
      message += ` (decreased by ${Math.abs(trend)} points)`;
    } else {
      message += ` (no change)`;
    }
    
    return this.addNotification(userId, 'health_score', message, {
      score,
      trend,
      date: new Date().toISOString().split('T')[0]
    });
  }

  // Get notification count for a user
  getNotificationCount(userId, unreadOnly = true) {
    const notifications = this.getNotifications(userId, unreadOnly);
    return notifications.length;
  }

  // Clear old notifications (older than 30 days)
  cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const [userId, notifications] of this.notifications.entries()) {
      const filteredNotifications = notifications.filter(n => n.timestamp > thirtyDaysAgo);
      this.notifications.set(userId, filteredNotifications);
    }
    
    logger.info('Old notifications cleaned up');
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Cleanup old notifications every day at 2 AM
const cron = require('node-cron');
cron.schedule('0 2 * * *', () => {
  notificationService.cleanupOldNotifications();
});

module.exports = notificationService; 