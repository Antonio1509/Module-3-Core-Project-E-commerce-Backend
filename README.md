# LocalCart API

The backend REST API powering **LocalCart** — a multi-vendor e-commerce marketplace connecting local South African vendors (bakeries, crafters, skincare makers, and more) with customers. Built with Node.js, Express, and MySQL.

## Features

-  JWT-based authentication (customer & vendor accounts)
-  Multi-vendor storefronts with follower system
-  Shopping cart & order management
-  PayFast payment gateway integration (sandbox & live)
-  Delivery tracking with RankDrop pickup points and home delivery
-  Product reviews & ratings
-  Vendor subscription plans (Free / Growth / Pro)
-  Vendor analytics dashboard (sales, orders, ratings)
-  Product image uploads

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js (ES Modules) |
| Framework | Express |
| Database | MySQL (via mysql2/promise) |
| Auth | JWT |
| Payments | PayFast |
| Security | Helmet, CORS |
| Logging | Morgan |
| Hosting | Railway |

## Project Structure

├── config/ # Database connection config
├── controllers/ # Route handlers / business logic
├── database/ # SQL schema & seed scripts
├── middleware/ # Auth & other Express middleware
├── models/ # Database models / queries
├── routes/ # API route definitions
├── scripts/ # Utility / migration scripts
├── uploads/products/ # Uploaded product images
├── validations/ # Request validation logic
├── services/ # External integrations (PayFast, etc.)
└── server.js # App entry point


## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MySQL server (local or hosted)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Antonio1509/Module-3-Core-Project-E-commerce-Backend.git
cd Module-3-Core-Project-E-commerce-Backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up your database:
   - Create a MySQL database.
   - Run the schema file located in `database/` against it to create all tables and seed sample data.

4. Create a `.env` file in the root directory (see Environment Variables below).

5. Start the server:

```bash
npm start
```

The API will be available at `http://localhost:5000` by default.

## Environment Variables

Create a `.env` file with the following:

```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=localcart

# CORS
CORS_ORIGIN=http://localhost:5500

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# PayFast
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_SANDBOX=true
PAYFAST_RETURN_URL=http://localhost:5500/confirmation.html
PAYFAST_CANCEL_URL=http://localhost:5500/checkout.html
PAYFAST_NOTIFY_URL=http://localhost:5000/api/payment/notify
```

## API Overview

Base URL: `/api`

| Endpoint | Description |
| --- | --- |
| GET /api/health | Server & database health check |
| GET /api/test-db | Verify database connection & list tables |
| POST /api/auth/* | Authentication (login, register, etc.) |
| GET /api/products | Browse products |
| GET /api/vendors | Browse vendor storefronts |
| GET /api/users | User profile management |
| GET /api/cart | Cart management |
| POST /api/orders/create | Place an order |
| POST /api/payment/initiate | Start a PayFast payment |
| GET /api/shipments | Shipment & delivery tracking |
| GET /api/subscriptions | Vendor subscription plans |
| GET /api/delivery | Delivery method options |

Visit the root endpoint (`GET /`) for a full JSON list of available routes.

## Database Schema

The database includes the following core tables:

`users`, `vendors`, `products`, `reviews`, `cart_items`, `orders`, `order_items`, `shipments`, `categories`, `delivery_methods`, `pickup_points`, `subscription_plans`, `vendor_subscriptions`, `user_follows_vendor`

Full schema definitions and sample seed data are available in the `database/` folder.

## Deployment

This API is deployed on [Railway](https://railway.com), connected to a Railway-hosted MySQL database. On push to `main`, Railway automatically rebuilds and redeploys the service.

Live API: `https://module-3-core-project-e-commerce-backend-production.up.railway.app`

## License

This project was built as part of a training module and is intended for educational purposes.
