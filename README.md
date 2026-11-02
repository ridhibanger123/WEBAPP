# 🎓 Student Management System (Full-Stack MVC)

A modern, full-stack Student Management System web application built with **Node.js**, **Express.js**, **MongoDB Atlas**, and **Vanilla JavaScript / HTML5 / CSS3**.

This project follows the **Model-View-Controller (MVC)** architectural pattern and features role-based Admin authentication, secure password hashing, session management, comprehensive student record CRUD operations, dynamic search and filtering, and real-time dashboard statistics.

---

## 📑 Table of Contents

- [1. Technology Stack](#1-technology-stack)
- [2. System Architecture](#2-system-architecture)
- [3. Folder Structure](#3-folder-structure)
- [4. Quick Start & Installation](#4-quick-start--installation)
- [5. MongoDB Atlas Setup Guide](#5-mongodb-atlas-setup-guide)
- [6. REST API Documentation](#6-rest-api-documentation)
- [7. Postman Testing Guide](#7-postman-testing-guide)
- [8. College Viva / Practical Evaluation Q&A](#8-college-viva--practical-evaluation-qa)

---

## 1. Technology Stack

- **Frontend:** HTML5, Modern CSS3 (Custom Properties, Flexbox, Grid), Vanilla JavaScript (ES6+ `fetch`, async/await, DOM manipulation).
- **Backend:** Node.js, Express.js.
- **Database & ODM:** MongoDB Atlas (Cloud), Mongoose.
- **Authentication & Security:** `bcryptjs` (password salting & hashing), `express-session`, `connect-mongo` (session storage), `cors`.
- **Environment Management:** `dotenv`.
- **Development Tools:** VS Code / Antigravity, Postman, `nodemon`.

---

## 2. System Architecture

The project is built around the **Model-View-Controller (MVC)** design pattern:

```mermaid
flowchart LR
    subgraph Client ["Client Browser"]
        V["View (HTML/CSS/JS)"]
    end

    subgraph Server ["Node.js / Express Server"]
        R["Routes"]
        M["Middleware (Session Auth)"]
        C["Controllers (Business Logic)"]
    end

    subgraph Database ["Cloud Database"]
        MOD["Mongoose Models"]
        DB[("MongoDB Atlas")]
    end

    V -->|HTTP Request (JSON)| M
    M -->|Verified Request| R
    R -->|Dispatches to| C
    C -->|Queries / Updates| MOD
    MOD <-->|Read / Write| DB
    C -->|HTTP Response (JSON)| V
```

1. **Model (`models/`):** Defines the schemas and validation rules for our database entities (`Admin.js`, `Student.js`).
2. **View (`public/`):** The user interface rendered by the browser (`index.html`, `dashboard.html`, `style.css`, client-side JavaScript).
3. **Controller (`controllers/`):** Contains the business logic, data validation, and query operations (`authController.js`, `studentController.js`).
4. **Routes (`routes/`):** Maps REST API endpoints to their corresponding controller functions (`authRoutes.js`, `studentRoutes.js`).
5. **Middleware (`middleware/`):** Protects routes by validating active admin sessions (`authMiddleware.js`).

---

## 3. Folder Structure

```text
student-management-system/
├── .env                       # Secret environment variables (ignored by Git)
├── .env.example               # Template environment file
├── .gitignore                 # Prevents node_modules and .env from being committed
├── package.json               # Project manifest, dependencies, and scripts
├── server.js                  # Express application entry point
│
├── config/
│   └── db.js                  # MongoDB Atlas connection using Mongoose
│
├── models/
│   ├── Admin.js               # Admin schema with bcrypt password hashing
│   └── Student.js             # Student schema with validation & uniqueness rules
│
├── controllers/
│   ├── authController.js      # Handles register, login, logout, and getMe
│   └── studentController.js   # Handles full CRUD, search, filters, and stats
│
├── routes/
│   ├── authRoutes.js          # Authentication endpoints (/api/auth)
│   └── studentRoutes.js       # Student management endpoints (/api/students)
│
├── middleware/
│   └── authMiddleware.js      # Session verification middleware (protect)
│
└── public/                    # Frontend client assets (served statically)
    ├── index.html             # Admin Login & Registration page
    ├── dashboard.html         # Main Student Management Dashboard
    ├── css/
    │   ├── style.css          # Design system: Navy/Indigo SaaS theme
    │   └── responsive.css     # Mobile and tablet responsiveness
    └── js/
        ├── api.js             # Reusable fetch helper, toast notifications, date helpers
        ├── auth.js            # Login/Register form handling & redirects
        └── dashboard.js       # Student rendering, modals, search, filters, stats
```

---

## 4. Quick Start & Installation

### Step 1: Open Terminal in Project Directory
```bash
cd /path/to/project
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Open the `.env` file and insert your MongoDB Atlas connection string:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/student_management?retryWrites=true&w=majority
SESSION_SECRET=student_management_secret_key_2026
```

### Step 4: Run the Application
For regular execution:
```bash
npm start
```
For automatic restart on file edits (Development Mode):
```bash
npm run dev
```

### Step 5: Open in Your Browser
Open: [http://localhost:3000](http://localhost:3000)

1. Click **Register First Admin** to create your initial administrator profile.
2. Sign in to access the **Dashboard**.
3. Add, edit, search, filter, and manage student records!

---

## 5. MongoDB Atlas Setup Guide (Free Forever)

1. **Sign Up:** Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. **Create Cluster:** Choose the **M0 Free Tier** (AWS, closest region) and click **Create Deployment**.
3. **Database User:**
   - Username: `admin`
   - Password: Choose a password (e.g., `AdminPass123`) and write it down.
   - Click **Create Database User**.
4. **Network Access:**
   - Add IP Address: `0.0.0.0/0` (Description: *Allow access from anywhere*).
   - Click **Add Entry**.
5. **Get Connection String:**
   - Click **Connect** -> **Drivers** (Node.js).
   - Copy the URI:
     ```text
     mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
     ```
   - Paste into `.env` under `MONGODB_URI`, replacing `<password>` with your actual password and adding `/student_management` before the `?`.

---

## 6. REST API Documentation

All protected routes require an active session cookie (`connect.sid`), which is automatically managed by the browser or Postman.

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new administrator | `{ "name": "Prof. Smith", "email": "smith@uni.edu", "password": "secretPassword" }` |
| `POST` | `/api/auth/login` | Public | Authenticates admin & begins session | `{ "email": "smith@uni.edu", "password": "secretPassword" }` |
| `POST` | `/api/auth/logout` | Private | Ends session & clears cookie | None |
| `GET` | `/api/auth/me` | Private | Returns current logged-in admin data | None |

### Student Management Endpoints (`/api/students`)

| Method | Endpoint | Access | Description | Query Parameters / Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/students/stats/dashboard` | Private | Returns counts & department totals | None |
| `GET` | `/api/students` | Private | Retrieves students with search & filter | Query: `?search=Alex&department=Computer+Science&academicYear=1st+Year&status=Active` |
| `GET` | `/api/students/:id` | Private | Retrieves full profile for single student | None |
| `POST` | `/api/students` | Private | Adds a new student record | Full student JSON object (see below) |
| `PUT` | `/api/students/:id` | Private | Updates existing student record | Fields to update (JSON) |
| `DELETE` | `/api/students/:id` | Private | Deletes student record permanently | None |

#### Sample Student JSON Body (`POST /api/students`):
```json
{
  "studentId": "STU-2024-001",
  "fullName": "Alex Johnson",
  "email": "alex.j@university.edu",
  "phone": "+1 555-019-2834",
  "department": "Computer Science",
  "course": "B.Tech Computer Science",
  "academicYear": "1st Year",
  "dateOfBirth": "2004-05-14",
  "gender": "Male",
  "address": "104 Campus Avenue, Room 3B",
  "status": "Active"
}
```

---

## 7. Postman Testing Guide

1. **Step 1 - Register/Login:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "email": "admin@university.edu",
       "password": "yourPassword"
     }
     ```
   - *Note:* Postman automatically captures the session cookie `connect.sid` for subsequent requests.

2. **Step 2 - Get Dashboard Statistics:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/students/stats/dashboard`
   - Verify status: `200 OK`.

3. **Step 3 - Create a Student:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/students`
   - Body: Paste the sample student JSON above.
   - Verify status: `201 Created`.

4. **Step 4 - Search & Filter Students:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/students?search=Alex&department=Computer Science`
   - Verify status: `200 OK`.

5. **Step 5 - Update Student:**
   - Method: `PUT`
   - URL: `http://localhost:3000/api/students/<STUDENT_ID>`
   - Body: `{ "status": "Inactive" }`
   - Verify status: `200 OK`.

6. **Step 6 - Delete Student:**
   - Method: `DELETE`
   - URL: `http://localhost:3000/api/students/<STUDENT_ID>`
   - Verify status: `200 OK`.

---

## 8. College Viva / Practical Evaluation Q&A

Use this cheat sheet to answer your professor's questions with confidence:

### Q1: What is the MVC pattern and how is it used in this project?
> **Answer:** MVC stands for Model-View-Controller.
> - **Model (`models/`):** Handles data structure and validation with Mongoose.
> - **View (`public/`):** Handles what the user sees (HTML, CSS, and DOM rendering in JavaScript).
> - **Controller (`controllers/`):** Contains the business logic that handles incoming requests, interacts with the Model, and returns JSON responses.
> This separation makes code organized, maintainable, and scalable.

### Q2: Why did you use `bcrypt` for passwords instead of storing them directly?
> **Answer:** Storing raw passwords is a critical security vulnerability. `bcrypt` adds a random salt and runs a one-way mathematical hashing algorithm. Even if the database were compromised, the original passwords cannot be reversed or decrypted.

### Q3: How does session-based authentication work?
> **Answer:** When an admin logs in successfully, Express creates a session record stored in MongoDB (`connect-mongo`) and sends a cryptographically signed cookie (`connect.sid`) to the browser. The browser automatically sends this cookie with subsequent requests. The server's `authMiddleware` verifies the session ID before allowing access to protected routes.

### Q4: Why did you choose MongoDB over a relational SQL database?
> **Answer:** MongoDB is a NoSQL document database. It stores records as flexible JSON-like BSON documents, which naturally match JavaScript objects. It allows fast querying, horizontal scaling, and rapid schema iteration with Mongoose.

### Q5: How does the frontend communicate with the backend?
> **Answer:** The frontend uses the browser's asynchronous `fetch()` API with `async/await`. It sends HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) with JSON payloads to our REST endpoints. The backend responds with status codes and JSON data, which our JavaScript uses to update the DOM without full page reloads (SPA-like feel).

### Q6: What HTTP status codes are used in your REST API?
> **Answer:**
> - `200 OK`: Successful retrieval or update.
> - `201 Created`: Successfully created a new record (Admin or Student).
> - `400 Bad Request`: Validation failure or duplicate ID/email.
> - `401 Unauthorized`: Missing or invalid session (login required).
> - `404 Not Found`: Record or endpoint does not exist.
> - `500 Internal Server Error`: Unexpected server exception.
