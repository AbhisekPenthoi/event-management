# Event Management System

A full-stack event management system built with React (Frontend), Node.js/Express (Backend), and MySQL (Database). This project allows users to discover, book, and manage events seamlessly.

## Features

### Admin Features
- 🔐 **Authentication** - Secure JWT-based login system
- 🎉 **Event Management** - Create, edit, delete, and close events
- 📸 **Custom Images** - Upload images or use URLs
- 👥 **User Management** - View, edit roles, and delete users (Can make users organizers)
- 📊 **Analytics Dashboard** - View statistics and reports
- 📥 **Export Reports** - Export bookings and users as CSV
- 🔔 **Notifications** - Receive booking notifications
- 📋 **Booking Management** - View and reject bookings
- 🚫 **No Booking** - Admins cannot book events

### Organizer Features
- 🎉 **Event Management** - Create, edit, delete, and close events
- 📸 **Custom Images** - Upload images or use URLs
- 🔔 **Notifications** - Receive booking notifications
- 📋 **Booking Management** - View and reject bookings for their events
- 🎫 **Book Tickets** - Can book events created by others

### User Features
- 🔐 **Registration & Login** - Secure account creation
- 🔍 **Browse Events** - Search and filter events by category
- 🎫 **Book Tickets** - Easy ticket booking system
- 📱 **View Tickets** - Download tickets with QR codes
- ⭐ **Rate & Review** - Submit ratings and feedback
- 🎟️ **My Bookings** - View and manage bookings
- 🔔 **Notifications** - Get booking confirmations

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios
- React Toastify
- QRCode React
- CSS3

### Backend
- Node.js
- Express.js
- MySQL2
- bcryptjs
- JSON Web Token (JWT)

### Database
- MySQL

## Project Structure

```
Event System/
├── backend/                 # Backend API
│   ├── config/
│   │   └── database.js     # Database configuration
│   ├── middleware/
│   │   └── auth.js         # Authentication middleware
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── events.js       # Event routes
│   │   ├── bookings.js     # Booking routes
│   │   ├── notifications.js # Notification routes
│   │   ├── users.js        # User routes
│   │   ├── reviews.js      # Review routes
│   │   └── analytics.js    # Analytics routes
│   ├── server.js           # Server entry point
│   ├── package.json
│   └── node_modules/
├── frontend/               # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   ├── package.json
│   └── node_modules/
├── database/               # Database scripts
│   └── setup.sql           # Complete database setup
└── README.md               # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- MySQL Workbench (recommended)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure database in `config/database.js`:
```javascript
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'event_management'
});
```

4. Create database from MySQL Workbench:
   - Open MySQL Workbench
   - Run `database/setup.sql` (this single file contains everything)

5. Start backend server:
```bash
npm start
```

Backend runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/my-events` - Get user's events
- `POST /api/events` - Create event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `PUT /api/events/:id/close` - Close event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/event/:eventId` - Get bookings for event
- `POST /api/bookings` - Create booking (Authenticated)
- `PUT /api/bookings/:id/cancel` - Cancel booking (Authenticated)
- `PUT /api/bookings/:id/reject` - Reject booking (Admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/all` - Get all users (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Reviews
- `GET /api/reviews/event/:eventId` - Get reviews for event
- `GET /api/reviews/event/:eventId/rating` - Get average rating
- `POST /api/reviews` - Create/update review (Users only)
- `DELETE /api/reviews/:id` - Delete review

### Analytics
- `GET /api/analytics/overview` - Get overall analytics (Admin only)
- `GET /api/analytics/event/:eventId` - Get event analytics
- `GET /api/analytics/export/bookings` - Export bookings CSV
- `GET /api/analytics/export/users` - Export users CSV

## Features in Detail

### Event Management
- Create events with custom details
- Upload custom images or use URLs
- Edit events
- Close events
- Delete events
- View bookings for your events

### Booking System
- Book tickets for events
- View booking history
- Cancel bookings
- Reject bookings (Admins only)
- Capacity management
- Payment status tracking

### Notifications
- Booking notifications for organizers
- Confirmation notifications for users
- Real-time unread count
- Mark as read
- Delete notifications

### User Roles
- **User**: Browse events, book tickets, manage own bookings, rate & review events
- **Admin**: Create events, manage all events, manage users, view analytics, export reports

### User Management
- View all users in the system
- Edit user roles (user/organizer/admin)
- Delete users
- Admin-only access

### Reviews & Ratings
- Users can rate events (1-5 stars)
- Submit written feedback
- View all reviews on event details
- See average ratings

### QR Code Tickets
- Generate unique QR code for each booking
- Print tickets
- Display booking information
- Download/print capability

### Analytics Dashboard
- Total events, users, bookings, revenue
- Events by category breakdown
- Top performing events
- Recent booking trends

### Export Reports
- Export all bookings as CSV
- Export all users as CSV
- Download for offline analysis

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- SQL injection prevention
- Input validation
- CORS protection

## Screenshots

### Home Page
Beautiful landing page with event categories and featured events.

### Events Listing
Browse all events with search and filter options.

### Event Details
Detailed view with booking functionality, reviews, and ratings.

### My Events
Manage your created events with edit, close, and bookings options.

### Bookings Management
View and manage all bookings for your events.

### User Management
Admin panel to manage all system users.

### Analytics Dashboard
Statistics, charts, and export options.

### QR Code Tickets
Download and print entry tickets with QR codes.

## Development

### Running in Development
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### Building for Production
```bash
cd frontend
npm run build
```

Creates an optimized production build in the `build` folder.

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `backend/config/database.js`
- Ensure database `event_management` exists
- Run `database/schema.sql` in MySQL Workbench

### Port Already in Use
- Backend: Kill process on port 5000 or change PORT
- Frontend: React will prompt to use a different port

### Module Not Found
- Run `npm install` in both backend and frontend directories
- Delete `node_modules` and reinstall if issues persist

### Image URL Column Error
Run this in MySQL Workbench:
```sql
ALTER TABLE events ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
```

### Missing Organizer Name Column
Run this in MySQL Workbench:
```sql
ALTER TABLE events ADD COLUMN organizer_name VARCHAR(100) DEFAULT NULL;
```

### Missing Reviews Table
Run this file in MySQL Workbench:
- `database/add_reviews.sql`

## Contributing

This is a 7th semester minor project. Feel free to extend it with additional features like:

- Payment gateway integration
- Email notifications
- QR code generation
- Advanced analytics
- Mobile app
- Social features

## License

This project is for educational purposes.

## Author

BTech 7th Semester - Minor Project
