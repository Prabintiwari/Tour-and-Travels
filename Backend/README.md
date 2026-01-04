
# Tour and Travel Backend API

## Overview
Backend service for the Tour and Travel application, built with Node.js/Express (or your framework).

## Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn
- Database (MongoDB/PostgreSQL)

### Installation
```bash
git clone <repository-url>
cd Backend
npm install
```

### Environment Variables
Create a `.env` file:
```
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

### Running the Server
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tours
- `GET /api/tours` - List all tours
- `GET /api/tours/:id` - Get tour details
- `POST /api/tours` - Create tour (admin)
- `PUT /api/tours/:id` - Update tour (admin)
- `DELETE /api/tours/:id` - Delete tour (admin)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Cancel booking

## Project Structure
```
Backend/
├── routes/
├── controllers/
├── models/
├── middleware/
└── config/
```

## Contributing
Please follow the existing code style and create feature branches.
