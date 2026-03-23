# 🎓 Academic Sphere ERP  
### A Smart Academic Management System with Automated Exam Seating Optimization

Academic Sphere is a full-stack, web-based Academic ERP system designed to digitize and centralize the core administrative and academic workflows of a higher education institution.  

It replaces fragmented manual processes with a unified, scalable, and role-aware platform for administrators, faculty, and students.

---

## 🚀 Features

### 🔐 Role-Based Access Control (RBAC)
- Secure authentication system for **Admin, Faculty, and Students**
- Strict permission enforcement at both frontend and backend
- Role-specific dashboards and UI rendering

### 👨‍🎓 Student & Faculty Management
- Full CRUD operations
- Bulk CSV upload (1000+ records at once)
- Automatic account creation for uploaded users
- Real-time search and filtering

### 🪑 Automated Seating Allocation
- Greedy algorithm with **progressive departmental fallback**
- Ensures **no two students from the same department share a bench**
- Supports multiple classrooms and large datasets
- Generates:
  - Visual seating grid
  - Bench-wise allocation
  - Exportable PDF reports

### 📊 Results Management
- Real-time result fetching via **web scraping (JNTUH portal)**
- Automatic calculation of:
  - SGPA
  - CGPA
- Multi-semester result aggregation
- Backlog detection

### 📈 Analytics Dashboard
- Institution-level, department-level, and student-level insights
- Performance tracking and trend analysis
- Leaderboards and pass percentage metrics

### 📢 Circulars Module
- Centralized communication system
- Admin & Faculty can post circulars
- Students can view updates in real-time

---

## 🏗️ System Architecture

The system follows a clean **3-tier architecture**:

- **Frontend:** React (TypeScript)
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- Communication via REST APIs

---

## 🛠️ Technologies Used

### Frontend
- React (TypeScript)
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL

### Other Tools & Libraries
- Axios (API requests)
- Cheerio (Web scraping)
- CSV parsing utilities

---

## ⚙️ Installation

### Prerequisites
- Node.js (v18 or higher)
- MySQL

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/academic-sphere.git
cd academic-sphere
```

---

### 2️⃣ Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

---

### 3️⃣ Setup Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=academic_sphere
```

---

### 4️⃣ Run the Project

#### Start Backend
```bash
cd backend
npm start
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

---

## 🌐 Usage

- Open: `http://localhost:5173`
- Login using role-based credentials:
  - Admin
  - Faculty
  - Student

---

## 📦 Modules Overview

1. Authentication & RBAC  
2. Student Management  
3. Faculty Management  
4. Seating Allocation System  
5. Results Module  
6. Analytics Dashboard  
7. Circulars System  

---

## 💡 Key Highlights

- Eliminates **manual seating arrangement errors**
- Reduces administrative workload from **days to seconds**
- Provides **real-time academic insights**
- Centralizes all institutional workflows into one system

---

## 🔮 Future Enhancements

- JWT-based authentication & session management
- Password encryption (bcrypt)
- Multi-university support
- Mobile app integration
- AI-based academic predictions