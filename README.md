# Secure File Sharing System

A secure web application for sharing files and documents with encryption and user management.

## Features

- User registration and authentication
- Secure file upload and download with encryption
- File sharing between users
- User profile management
- Admin panel for user and file management
- Two-factor authentication
- Password reset via email
- Activity tracking and statistics

## Tech Stack

### Backend
- Django
- Django REST Framework
- SQLite database
- Cryptography for file encryption

### Frontend
- React with TypeScript
- Material-UI for components
- Axios for API calls
- React Router for navigation

## Setup Instructions

### Backend Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. Create a superuser:
```bash
python manage.py createsuperuser
```

5. Start the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
SECRET_KEY=your_secret_key
DEBUG=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_email_password
```

## Usage

1. Access the application at `http://localhost:5173`
2. Register a new account or login with existing credentials
3. Upload files through the file manager
4. Share files with other users
5. Manage your profile and settings
6. Access admin panel at `/admin` with superuser credentials

## Security Features

- All files are encrypted before storage
- Secure password hashing
- CSRF protection
- Session-based authentication
- Two-factor authentication option
- Secure file sharing with expiration dates
- Admin monitoring and control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 