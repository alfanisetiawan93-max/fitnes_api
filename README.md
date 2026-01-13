# Example Project

This is a Node.js project with login and register endpoints.

## Endpoints

### Register
- **POST /register**
- Body: `{ "username": "string", "email": "string", "password": "string" }`
- Response: `201 Created` on success

### Login
- **POST /login**
- Body: `{ "username": "string", "password": "string" }`
- Response: `200 OK` on success

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. The server runs on port 3000.

## User Storage
- Users are stored in `users.json` in the project root.

## Dependencies
- express
- bcrypt
- body-parser
