# MedHel - Health Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive digital health management system built with React, Node.js, and PostgreSQL. MedHel helps users manage medications, track health metrics, schedule appointments, and maintain their health records with an intuitive, modern interface.

## 🚀 Features

### 🔐 Authentication & Security
- User registration and login with JWT tokens
- Password encryption and secure storage
- Protected routes and session management
- Password update functionality

### 💊 Medication Management
- Add, edit, and delete medications
- Set dosage, frequency, and duration
- Mark medications as taken/not taken
- Daily medication status reset
- Automated medication reminders (every 15 minutes)

### 📊 Health Metrics & Analytics
- Track weight, blood pressure, heart rate, and custom metrics
- **Advanced Interactive Charts** with trend analysis and filtering
- **Real-time Statistics** (Average, Min, Max) displayed below charts
- Historical data visualization with date filtering
- Progress tracking over time
- Health score calculation
- Data export capabilities (CSV/PDF)

### 📅 Appointment Scheduling
- Create and manage medical appointments
- Appointment details and descriptions
- Date and time management
- Appointment history

### 🔔 Notification System
- In-app notifications for reminders
- Different notification types (info, warning, success, error)
- Read/unread status tracking
- Automatic cleanup of old notifications

### 🎨 User Interface
- Modern, responsive design
- Dark and light theme support (with auth pages always light)
- Mobile-friendly interface
- Intuitive navigation
- Error handling and user feedback
- **Smooth User Experience** with optimistic UI updates

### 🤖 Automated Features (Cron Jobs)
- **Daily Medication Reset** (12:00 AM): Resets all medications to "not taken"
- **Medication Reminders** (Every 15 minutes): Checks for due medications
- **Health Score Calculation** (6:00 AM): Calculates daily health scores
- **Notification Cleanup** (2:00 AM): Removes old notifications

## 🛠️ Technology Stack

### Frontend
- **React 18** - User interface library
- **React Router** - Navigation and routing
- **Recharts** - Data visualization and charts
- **React Icons** - Icon library
- **CSS3** - Styling with CSS variables for theming

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **node-cron** - Scheduled tasks

### Development Tools
- **nodemon** - Auto-restart server during development
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/medhel.git
cd medhel
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Database Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE medhel;
   ```

2. **Configure Database Connection:**
   - Copy `backend/.env.example` to `backend/.env`
   - Update the database credentials in `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=medhel
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

3. **Initialize Database Schema:**
   ```bash
   cd backend
   node check-schema.js
   ```

### 4. Environment Configuration

**Backend Environment Variables:**
Create `backend/.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medhel
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## 🏃‍♂️ Running the Application

### Development Mode

**Start Backend Server:**
```bash
cd backend
npm run dev
```
Server will start on `http://localhost:5000`

**Start Frontend Development Server:**
```bash
cd frontend
npm start
```
Frontend will start on `http://localhost:3000`

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Production Server:**
```bash
cd backend
npm start
```

## 📖 Usage

### Getting Started

1. **Register an Account:**
   - Navigate to `/register`
   - Fill in your details and create an account

2. **Login:**
   - Use your credentials to log in
   - You'll be redirected to the dashboard

3. **Add Medications:**
   - Click "Add Medication" from the dashboard
   - Fill in medication details (name, dosage, frequency, etc.)

4. **Track Health Metrics:**
   - Go to "Health Metrics" section
   - Add your health data (weight, blood pressure, etc.)
   - View trends and statistics in interactive charts

5. **Schedule Appointments:**
   - Use the "Appointments" section to manage medical appointments

### Key Features

- **Dashboard**: Overview of your health status, medications, and quick actions
- **Medications**: Manage your medication schedule and track adherence
- **Health Metrics**: Visualize your health data with interactive charts
- **History**: View past medication actions and health records
- **Profile**: Update your personal information and preferences
- **Settings**: Customize your experience and manage notifications

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `PUT /api/profile` - Update user profile

### Medications
- `GET /api/medications` - Get user medications
- `POST /api/medications` - Add new medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### Health Metrics
- `GET /api/health-metrics` - Get user health metrics
- `POST /api/health-metrics` - Add new health metric
- `PUT /api/health-metrics/:id` - Update health metric
- `DELETE /api/health-metrics/:id` - Delete health metric

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Add new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🗄️ Database Schema

### Users Table
- `id` (Primary Key)
- `username`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

### Medications Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `name`
- `dosage`
- `frequency`
- `start_date`
- `end_date`
- `taken`
- `created_at`

### Health Metrics Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `type`
- `value`
- `unit`
- `metric_date`
- `created_at`

### Appointments Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `title`
- `description`
- `appointment_date`
- `created_at`

### Notifications Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `type`
- `message`
- `read`
- `created_at`

## 🎨 Customization

### Themes
The application supports both light and dark themes. Auth pages are always light-themed for consistency.

### Adding New Health Metrics
To add new metric types:
1. Update the `getMetricTypes()` function in `HealthMetricsTrend.js`
2. Add corresponding labels in `getMetricLabel()`
3. Update the database schema if needed

### Customizing Cron Jobs
Modify the cron schedules in `backend/medicationScheduler.js`:
```javascript
// Example: Change medication reset time to 6 AM
cron.schedule('0 6 * * *', resetMedications);
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed:**
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists

**Port Already in Use:**
- Change port in `backend/server.js` (default: 5000)
- Change port in `frontend/package.json` (default: 3000)

**Module Not Found Errors:**
- Run `npm install` in both backend and frontend directories
- Clear `node_modules` and reinstall if needed

**CORS Errors:**
- Ensure both servers are running
- Check API URLs in `frontend/src/api.js`

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing frontend framework
- **Express.js Team** for the robust backend framework
- **PostgreSQL Team** for the reliable database
- **Recharts Team** for the beautiful charting library

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [MedHel Complete Beginner's Guide](MedHel_Complete_Beginners_Guide.md)
3. Open an issue on GitHub
4. Contact the development team

---

**Made with ❤️ for better health management** 