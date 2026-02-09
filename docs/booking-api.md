# Booking API Documentation

## Base URL
```
http://localhost:5000/api/bookings
```

## Authentication
All booking endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Booking
**POST** `/api/bookings`

Create a new booking with all required details.

#### Request Body
```json
{
  "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
  "bookingId": "BK-MLDF2N6J",
  "bookingDetails": {
    "startDate": "2026-02-08",
    "endDate": "2026-02-09",
    "startTime": "16:00",
    "endTime": "04:00",
    "pickupType": "delivery",
    "rentalPrice": 55,
    "deliveryFee": 272.9,
    "driverFee": 0,
    "totalPrice": 327.9,
    "pricingType": "12-hours",
    "durationHours": 12,
    "excessHours": 0,
    "excessHoursPrice": 0,
    "dataConsent": true,
    "licenseImage": "https://res.cloudinary.com/dlax3esau/image/upload/v1770535370/licence_dummy_h03s2z.jpg",
    "ltoPortalScreenshot": "https://res.cloudinary.com/dlax3esau/image/upload/v1770535376/ChatGPT_Image_Feb_7_2026_03_17_57_PM_jbnp1g.png",
    "firstName": "Jick",
    "middleName": "t",
    "lastName": "test",
    "contactNumber": "09206502183",
    "email": "12889@yopmail.com",
    "idType": "national_id",
    "licenseNumber": "1225511454555"
  },
  "selectedCar": {
    "id": "fortuner-2020",
    "name": "Toyota Fortuner",
    "type": "suv",
    "image": "/images/toyota-fortuner-2020.jpg",
    "imageUrls": [
      "https://res.cloudinary.com/dlax3esau/image/upload/v1768988167/suv_f87ihm.png"
    ],
    "fuel": "Diesel",
    "year": 2020,
    "pricePerDay": 85,
    "pricePer12Hours": 55,
    "pricePer24Hours": 85,
    "pricePerHour": 5.5,
    "seats": 7,
    "transmission": "automatic",
    "deliveryFee": 25,
    "garageAddress": "Rodriguez Street, Lapu-Lapu, Philippines",
    "garageLocation": {
      "address": "Rodriguez Street, Lapu-Lapu, Philippines",
      "city": "Lapu-Lapu City",
      "province": "Cebu",
      "coordinates": {
        "lat": 10.3128,
        "lng": 123.9456
      }
    },
    "owner": {
      "name": "Carlos Mendoza",
      "contactNumber": "+63-919-345-6789"
    },
    "rentedCount": 94,
    "rating": 4.5,
    "selfDrive": true,
    "availability": {
      "isAvailableToday": true,
      "unavailableDates": ["2026-01-18", "2026-01-19"]
    },
    "distanceText": "5.8 km away"
  },
  "paymentStatus": "pending"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
    "bookingId": "BK-MLDF2N6J",
    "bookingDetails": { ... },
    "selectedCar": { ... },
    "paymentStatus": "pending",
    "bookingStatus": "pending",
    "createdAt": "2026-02-08T15:30:00.000Z",
    "updatedAt": "2026-02-08T15:30:00.000Z",
    "__v": 0
  },
  "message": "Booking created successfully"
}
```

### 2. Get All Bookings
**GET** `/api/bookings`

Retrieve all bookings with pagination and filtering options.

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by payment status (`pending`, `paid`, `failed`, `refunded`, `cancelled`)
- `userId` (string, optional): Filter by user ID
- `carId` (string, optional): Filter by car ID
- `startDate` (string, optional): Filter bookings from this date (YYYY-MM-DD)
- `endDate` (string, optional): Filter bookings until this date (YYYY-MM-DD)
- `sortBy` (string, optional): Sort field (`createdAt`, `updatedAt`, `bookingDetails.startDate`, `totalPrice`)
- `sortOrder` (string, optional): Sort order (`asc`, `desc`)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
      "bookingId": "BK-MLDF2N6J",
      "bookingDetails": { ... },
      "selectedCar": { ... },
      "paymentStatus": "pending",
      "bookingStatus": "pending",
      "createdAt": "2026-02-08T15:30:00.000Z",
      "updatedAt": "2026-02-08T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### 3. Get Booking by ID
**GET** `/api/bookings/:id`

Retrieve a specific booking by MongoDB ObjectId.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
    "bookingId": "BK-MLDF2N6J",
    "bookingDetails": { ... },
    "selectedCar": { ... },
    "paymentStatus": "pending",
    "bookingStatus": "pending",
    "createdAt": "2026-02-08T15:30:00.000Z",
    "updatedAt": "2026-02-08T15:30:00.000Z"
  }
}
```

### 4. Get Booking by Booking ID
**GET** `/api/bookings/booking-id/:bookingId`

Retrieve a specific booking by booking ID (e.g., "BK-MLDF2N6J").

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
    "bookingId": "BK-MLDF2N6J",
    "bookingDetails": { ... },
    "selectedCar": { ... },
    "paymentStatus": "pending",
    "bookingStatus": "pending",
    "createdAt": "2026-02-08T15:30:00.000Z",
    "updatedAt": "2026-02-08T15:30:00.000Z"
  }
}
```

### 5. Get User Bookings
**GET** `/api/bookings/user/:userId`

Retrieve all bookings for a specific user.

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by payment status

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
      "bookingId": "BK-MLDF2N6J",
      "bookingDetails": { ... },
      "selectedCar": { ... },
      "paymentStatus": "pending",
      "bookingStatus": "pending",
      "createdAt": "2026-02-08T15:30:00.000Z",
      "updatedAt": "2026-02-08T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### 6. Get Car Bookings
**GET** `/api/bookings/car/:carId`

Retrieve all bookings for a specific car with optional date filtering.

#### Query Parameters
- `startDate` (string, optional): Filter bookings from this date (YYYY-MM-DD)
- `endDate` (string, optional): Filter bookings until this date (YYYY-MM-DD)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
      "bookingId": "BK-MLDF2N6J",
      "bookingDetails": { ... },
      "selectedCar": { ... },
      "paymentStatus": "pending",
      "bookingStatus": "pending",
      "createdAt": "2026-02-08T15:30:00.000Z",
      "updatedAt": "2026-02-08T15:30:00.000Z"
    }
  ]
}
```

### 7. Update Booking
**PUT** `/api/bookings/:id`

Update a booking completely. All fields can be updated.

#### Request Body
Same structure as create booking, but all fields are optional.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "1c455981-6c37-47f0-828c-cf550a0e0d7a",
    "bookingId": "BK-MLDF2N6J",
    "bookingDetails": { ... },
    "selectedCar": { ... },
    "paymentStatus": "paid",
    "bookingStatus": "confirmed",
    "createdAt": "2026-02-08T15:30:00.000Z",
    "updatedAt": "2026-02-08T15:45:00.000Z"
  },
  "message": "Booking updated successfully"
}
```

### 8. Update Payment Status
**PATCH** `/api/bookings/:id/payment-status`

Update only the payment status of a booking.

#### Request Body
```json
{
  "paymentStatus": "paid",
  "paymentMethod": {
    "type": "paymongo",
    "paymentIntentId": "pi_1234567890",
    "amount": 327.90,
    "currency": "PHP"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "paymentStatus": "paid",
    "paymentMethod": {
      "type": "paymongo",
      "paymentIntentId": "pi_1234567890",
      "amount": 327.90,
      "currency": "PHP"
    },
    "updatedAt": "2026-02-08T15:45:00.000Z"
  },
  "message": "Payment status updated successfully"
}
```

### 9. Update Booking Status
**PATCH** `/api/bookings/:id/booking-status`

Update only the booking status.

#### Request Body
```json
{
  "bookingStatus": "confirmed"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "bookingStatus": "confirmed",
    "updatedAt": "2026-02-08T15:45:00.000Z"
  },
  "message": "Booking status updated successfully"
}
```

### 10. Delete Booking
**DELETE** `/api/bookings/:id`

Delete a booking permanently.

#### Response
```json
{
  "success": true,
  "message": "Booking deleted successfully"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Validation Rules

### Required Fields for Creating Booking
- `userId` - String, UUID format
- `bookingId` - String, unique
- `bookingDetails.startDate` - Date (YYYY-MM-DD)
- `bookingDetails.endDate` - Date (YYYY-MM-DD)
- `bookingDetails.startTime` - Time (HH:MM, 24-hour format)
- `bookingDetails.endTime` - Time (HH:MM, 24-hour format)
- `bookingDetails.pickupType` - Enum: `delivery`, `pickup`
- `bookingDetails.totalPrice` - Number, >= 0
- `bookingDetails.firstName` - String, 2-50 characters
- `bookingDetails.lastName` - String, 2-50 characters
- `bookingDetails.email` - Valid email
- `bookingDetails.contactNumber` - Valid mobile phone
- `selectedCar.id` - String
- `selectedCar.name` - String

### Enum Values
- `paymentStatus`: `pending`, `paid`, `failed`, `refunded`, `cancelled`
- `bookingStatus`: `pending`, `confirmed`, `active`, `completed`, `cancelled`
- `pickupType`: `delivery`, `pickup`
- `pricingType`: `hourly`, `12-hours`, `24-hours`, `daily`
- `idType`: `national_id`, `drivers_license`, `passport`, `others`
- `transmission`: `manual`, `automatic`

## Schema Methods

The Booking model includes several useful methods:

### Static Methods
- `Booking.findByUserId(userId, options)` - Find bookings by user with pagination
- `Booking.findByCarId(carId, options)` - Find bookings by car with date filtering

### Instance Methods
- `booking.isActive()` - Check if booking is currently active
- `booking.getDuration()` - Get booking duration in hours

## Example Usage

### Create a new booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @booking-data.json
```

### Get user bookings
```bash
curl -X GET "http://localhost:5000/api/bookings/user/1c455981-6c37-47f0-828c-cf550a0e0d7a?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update payment status
```bash
curl -X PATCH http://localhost:5000/api/bookings/64f8a1b2c3d4e5f6a7b8c9d0/payment-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus": "paid", "paymentMethod": {"type": "gcash"}}'
```
