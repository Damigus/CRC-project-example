# Party Members Register - React + Flask Application

A comprehensive web application for managing a national register of party members. The application consists of a React frontend and a Flask backend, with full CRUD operations, authentication, and document management.

## Features

- User registration and authentication
- Member management (add, edit, view, delete)
- Document upload and download functionality
- Responsive design for all devices
- Role-based access control
- Error handling and user feedback
- MS SQL database integration

## Project Structure

The project is divided into two main parts:

1. **Frontend**: React application with TypeScript and Tailwind CSS
2. **Backend**: Flask REST API with SQL Server database

## Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MS SQL Server 2019 (or Docker)

## Installation Instructions

### Setting up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up MS SQL Server:
   - Using Docker:
     ```bash
     docker-compose up -d mssql
     ```
   - Or use your existing MS SQL Server installation
  
5.5 Create DATABASE:
   - In CMD:
     ```bash
     CREATE DATABASE PartyMembersDB;
     GO
     ```

6. Wait about 30 seconds for SQL Server to initialize, then start the backend:
   ```bash
   python app.py
   ```

   The backend API will be available at http://localhost:5000

### Setting up the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ..  # if you're in the backend directory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:5173

## Using the Application

1. Register an account at the registration page
2. Log in with your credentials
3. Use the dashboard to navigate to different sections
4. Add members, upload documents, and manage the party membership register

## API Documentation

The backend provides the following API endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Members
- `GET /api/members` - Get all members (with pagination)
- `GET /api/members/:id` - Get a specific member
- `POST /api/members` - Create a new member
- `PUT /api/members/:id` - Update a member
- `DELETE /api/members/:id` - Delete a member

### Documents
- `GET /api/members/:member_id/documents` - Get all documents for a member
- `POST /api/members/:member_id/documents` - Upload a document
- `GET /api/documents/:document_id/download` - Download a document
- `DELETE /api/documents/:document_id` - Delete a document

## Customizing the Application

- Frontend styling is done with Tailwind CSS
- Backend database configuration can be modified in `app.py`
- Constants and configuration settings are in `src/config/constants.ts`

## Troubleshooting

- If you have issues connecting to SQL Server, ensure the database server is running and credentials are correct
- For document upload issues, check that the `uploads` directory has write permissions
- For authentication problems, ensure your token is being sent correctly in the Authorization header

## Security Notes

- For production, change the secret key in `app.py`
- Use HTTPS in production
- Consider implementing additional security measures like rate limiting
