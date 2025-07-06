# CresceBR B2B Marketplace

**CresceBR** is a comprehensive B2B (Business-to-Business) marketplace platform developed for UTFPR's E-commerce course (6th semester). This platform connects buyers and suppliers in an industrial marketplace environment with advanced features for quotations, order management, and company verification.

## 🎯 Project Overview

This MVP implements a complete B2B marketplace following SOLID principles and modern web development practices. The platform facilitates business relationships between companies through a secure, scalable, and user-friendly interface.

**Course:** E-commerce  
**Institution:** UTFPR (Federal University of Technology - Paraná)  
**Semester:** 6th  
**Professor:** Maria Adelina Silva Brito

## ✨ Key Features

### 🏢 Company Management & Authentication

- **CNPJ Validation:** Real-time validation using Brasil API (https://brasilapi.com.br)
- **Company Registration:** Separate registration flows for buyers and suppliers
- **JWT Authentication:** Secure token-based authentication with role-based access
- **Company Verification:** Admin workflow for company approval

### 📋 Quotation System (Core Feature)

- **Request Quotations:** Buyers can request quotes for multiple products
- **Tier-based Pricing:** Volume discounts based on quantity ranges
- **Quote Processing:** Suppliers can review and process quotation requests
- **Automatic Calculations:** Tax, shipping, and total cost calculations

### 📦 Industrial Product Catalog

- **Product Management:** CRUD operations with technical specifications
- **Bulk Import:** CSV import functionality for large product catalogs
- **Advanced Search:** Filter by category, specifications, and price range
- **Image Management:** Support for product images and technical documents

### 📊 Order Management System

- **Order Creation:** Convert approved quotations into orders
- **Status Tracking:** Complete order lifecycle management
- **Delivery Estimates:** Automatic calculation based on shipping method
- **Bulk Operations:** Process multiple orders simultaneously

### 👨‍💼 Admin Dashboard

- **Company Verification:** Approve/reject company registrations
- **Analytics Dashboard:** Comprehensive business metrics and insights
- **User Management:** Role-based access control and user administration
- **System Monitoring:** Track platform performance and usage

### 📈 Business Intelligence

- **Revenue Analytics:** Track sales performance and growth trends
- **Order Statistics:** Monitor order status distribution and processing times
- **Company Insights:** Analyze buyer/supplier activity and engagement
- **Export Capabilities:** Generate reports in multiple formats

## 🏗️ Architecture

### Technology Stack

- **Frontend:** React + TypeScript + Chakra UI
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** JWT with role-based access control
- **File Processing:** Multer for CSV imports and file uploads
- **API Integration:** Brasil API for CNPJ validation
- **Containerization:** Docker & Docker Compose

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express Backend│    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Brasil API    │
                       │ (CNPJ Validation)│
                       └─────────────────┘
```

### Database Schema

- **Users:** Company information, authentication, and role management
- **Products:** Industrial catalog with specifications and pricing
- **Quotations:** Quote requests, items, and processing status
- **Orders:** Order management with status tracking and delivery
- **Admin:** System configuration and analytics data

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd MarketPlace_B2B/B2B
   ```

2. **Environment setup:**

   ```bash
   # Backend environment
   cp backend/.env.example backend/.env

   # Frontend environment
   cp frontend/.env.example frontend/.env
   ```

3. **Start the application:**

   ```bash
   docker-compose up --build
   ```

4. **Access the platform:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:3001
   - **Database:** localhost:5432

### Test Accounts

After initial setup, you can use these test accounts:

**Admin Account:**

- Email: admin@crescebr.com
- Password: admin123
- CNPJ: 11.222.333/0001-81

**Supplier Account:**

- Email: supplier@example.com
- Password: supplier123
- CNPJ: 12.345.678/0001-90

**Buyer Account:**

- Email: buyer@example.com
- Password: buyer123
- CNPJ: 98.765.432/0001-10

## 📡 API Documentation

### Authentication Endpoints

```
POST /api/auth/register           # Register new buyer company
POST /api/auth/register-supplier  # Register new supplier company
POST /api/auth/login             # Company login
GET  /api/auth/profile           # Get current user profile
```

### Company Management

```
GET    /api/companies           # List all companies (admin)
PUT    /api/companies/:id/verify # Verify company (admin)
GET    /api/companies/stats     # Company statistics (admin)
```

### Product Catalog

```
GET    /api/products             # List products with filters
POST   /api/products             # Create product (supplier)
PUT    /api/products/:id         # Update product (supplier)
DELETE /api/products/:id         # Delete product (supplier)
POST   /api/products/import-csv  # Bulk import products (supplier)
GET    /api/products/sample-csv  # Download sample CSV template
```

### Quotation System

```
POST   /api/quotations           # Create quotation request (buyer)
GET    /api/quotations           # List user quotations
GET    /api/quotations/:id       # Get quotation details
PUT    /api/quotations/:id       # Update quotation status (supplier)
POST   /api/quotations/:id/process # Process quotation (supplier)
```

### Order Management

```
POST   /api/orders               # Create order from quotation
GET    /api/orders               # List user orders
GET    /api/orders/:id/history   # Get order status history
PUT    /api/orders/:id/status    # Update order status (supplier/admin)
GET    /api/orders/stats         # Order statistics (admin)
```

### Admin Dashboard

```
GET    /api/admin/analytics      # Dashboard analytics
GET    /api/admin/companies      # Company management
PUT    /api/admin/companies/:id  # Update company status
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run tests in Docker
docker-compose exec backend npm test
docker-compose exec frontend npm test
```

### Test Coverage

- **Unit Tests:** Controllers, services, and utilities
- **Integration Tests:** API endpoints and database operations
- **Authentication Tests:** JWT and role-based access control
- **Business Logic Tests:** Quotation calculations and order workflows

## 🔧 Development

### Backend Development

```bash
cd backend
npm install
npm run dev    # Start with hot reload
npm run build  # Build for production
npm run lint   # Code linting
```

### Frontend Development

```bash
cd frontend
npm install
npm start      # Start development server
npm run build  # Build for production
npm run lint   # Code linting
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:migrate:undo:all && npm run db:migrate && npm run db:seed
```

## 📝 Business Rules

### Company Types

- **Buyer:** Can request quotations and place orders
- **Supplier:** Can manage products and process quotations
- **Admin:** Full system access and company verification

### Quotation Workflow

1. Buyer creates quotation request with product items
2. System calculates pricing based on quantity tiers
3. Supplier reviews and can accept/modify the quotation
4. Approved quotations can be converted to orders
5. Orders follow a defined status workflow (pending → processing → shipped → delivered)

### Pricing Logic

- **Base Price:** Product unit price
- **Quantity Discounts:** Tier-based volume pricing
- **Tax Calculation:** Configurable tax rates
- **Shipping Costs:** Calculated based on weight and distance

## 🔒 Security Features

- **CNPJ Validation:** Real-time validation with Brasil API
- **Input Sanitization:** Protection against XSS and injection attacks
- **Rate Limiting:** API request throttling
- **JWT Security:** Secure token management with expiration
- **Role-based Access:** Granular permission control
- **Password Hashing:** bcrypt for secure password storage

## 🚀 Deployment

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Required environment variables for production:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
NODE_ENV=production
CNPJ_API_URL=https://brasilapi.com.br/api/cnpj/v1/
```

## 📊 Monitoring & Analytics

The platform includes comprehensive analytics:

- **User Engagement:** Track company registration and activity
- **Sales Performance:** Monitor quotation conversion rates
- **System Health:** API response times and error rates
- **Business Metrics:** Revenue tracking and growth analysis

## 🤝 Contributing

This is an academic project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 Academic Context

This project was developed as part of the E-commerce course curriculum at UTFPR, focusing on:

- Modern web development practices
- B2B marketplace architecture
- Database design and optimization
- API development and documentation
- User experience design for business applications
- Security best practices
- Testing methodologies

## 📞 Support

For questions about this project:

- **Academic:** Contact Professor Maria Adelina Silva Brito
- **Technical:** Open an issue on the repository
- **Documentation:** Refer to the inline code comments and API documentation

---

**CresceBR** - Empowering Brazilian businesses through technology 🇧🇷
