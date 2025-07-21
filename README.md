# MarkSense - Production-Ready Attendance Management System

A comprehensive attendance management system built with React, Flask, and MongoDB, featuring AI-powered face recognition, mask detection, and liveness detection.

## Features

### Employee Features
- **Email/Password Authentication** - Secure login system
- **Face Recognition Attendance** - AI-powered attendance marking with GPS validation
- **Real-time Dashboard** - View attendance status, working hours, and notifications
- **Leave Management** - Submit and track leave requests
- **Attendance History** - View daily, weekly, and monthly attendance records
- **Mobile Responsive** - Works seamlessly on all devices

### Admin Features
- **Comprehensive Dashboard** - Real-time analytics and employee metrics
- **Employee Management** - View and manage all employees
- **Leave Approval System** - Approve or reject leave requests
- **Advanced Analytics** - Charts and reports for attendance insights
- **Settings Management** - Configure attendance rules and office location
- **Report Generation** - Export attendance reports in CSV/PDF/Excel formats

### Technical Features
- **AI/ML Integration** - Placeholder APIs for face recognition, mask detection, liveness detection
- **Face Encoding Storage** - Automatic face encoding extraction and storage during registration
- **GPS Validation** - Location-based attendance marking
- **Role-based Access Control** - Separate interfaces for employees and admins
- **Real-time Notifications** - Toast notifications for all actions
- **Production-ready Architecture** - Clean code, proper error handling, and scalability

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, professional UI
- **React Router** for navigation
- **Axios** for API calls
- **Chart.js** for data visualization
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

### Backend
- **Python Flask** with REST APIs
- **JWT Authentication** for secure sessions
- **MongoDB** for data storage
- **Flask-CORS** for cross-origin requests
- **PyMongo** for database operations

### Database Structure
- **users** - Employee and admin information
- **departments** - Company departments with office locations
- **face_encodings** - Face recognition data for each user
- **attendance_records** - Daily attendance with GPS coordinates
- **leave_requests** - Employee leave management
- **notifications** - System notifications
- **admin_settings** - Company-wide configuration

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB (local or cloud)

### Frontend Setup
```bash
# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Copy environment variables  
cp .env.example .env
# Edit .env and add your configuration

# Install Python dependencies
python install_dependencies.py

# Start Flask server
python app.py
```

### Database Setup
The application includes sample data initialization:
- Sample departments (HR, Sales, Finance, IT, Operations)
- Default admin user (admin@company.com / admin123)
- Face encodings collection for user face recognition data
- Default system settings

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

### Attendance Endpoints
- `POST /api/attendance/mark` - Mark attendance (ML integration placeholder)
- `POST /api/attendance/punch-out` - Punch out (ML integration placeholder)
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/stats` - Get attendance statistics

### Leave Management Endpoints
- `POST /api/leaves` - Submit leave request
- `GET /api/leaves` - Get leave requests
- `PATCH /api/leaves/:id/approve` - Approve leave (admin only)
- `PATCH /api/leaves/:id/reject` - Reject leave (admin only)

### Admin Endpoints
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/employees` - Employee management
- `PATCH /api/admin/employees/:id` - Update employee status
- `GET /api/admin/settings` - System settings
- `PATCH /api/admin/settings` - Update settings
- `GET /api/admin/reports` - Generate reports
- `GET /api/admin/departments` - Get departments list

## ML Integration Points

The system includes placeholder APIs for ML model integration:
### Face Recognition API (Integrated)

This endpoint performs:

- ✅ **Face Recognition**: Matches the user’s live face with stored encoding
- ✅ **Mask Detection**: Ensures mask compliance
- ✅ **Liveness Detection**: Detects blink to confirm it’s not a spoof
- ✅ **GPS Validation**: Verifies the user is within the office location

```python
@app.route('/api/attendance/mark', methods=['POST'])
@employee_required
def mark_attendance():
    # ...integrates with run_attendance_check(email, location) for full ML validation
```

### Required ML Model Features
1. **Face Recognition** - Match employee face with registered photo
2. **Mask Detection** - Detect if employee is wearing a mask
3. **Liveness Detection** - Verify real person through blink detection
4. **GPS Validation** - Ensure employee is at office location

## Security Features

- **JWT Token Authentication** - Secure API access
- **Role-based Access Control** - Separate admin and employee permissions
- **Password Security** - Secure password handling (hash in production)
- **Input Validation** - Comprehensive form validation
- **Error Handling** - Proper error responses and logging

## Production Deployment

### Environment Variables
```env
# Frontend (.env)
VITE_API_URL=http://localhost:5000/api

# Backend
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET_KEY=your-production-secret-key
FLASK_ENV=production
```

### Build Commands
```bash
# Frontend build
npm run build

# Backend production
gunicorn app:app --bind 0.0.0.0:5000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
