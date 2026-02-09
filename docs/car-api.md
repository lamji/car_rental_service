# Car Management API Documentation

## Base URL
```
http://localhost:5000/api/cars
```

## Authentication
Most car endpoints are public (no authentication required), but create/update/delete operations require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Car
**POST** `/api/cars` 🔒

Create a new car listing. Requires authentication.

#### Request Body
```json
{
  "id": "vios-2021",
  "name": "Toyota Vios",
  "type": "sedan",
  "image": "/images/toyota-vios-2021.jpg",
  "imageUrls": [
    "https://res.cloudinary.com/dlax3esau/image/upload/v1768988167/sedan_tt05j8.png",
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=800&auto=format&fit=crop"
  ],
  "fuel": "gasoline",
  "year": 2021,
  "pricePerDay": 45,
  "pricePer12Hours": 30,
  "pricePer24Hours": 45,
  "pricePerHour": 3,
  "seats": 5,
  "transmission": "automatic",
  "deliveryFee": 15,
  "garageAddress": "Cebu City, Philippines",
  "garageLocation": {
    "address": "Cebu City, Philippines",
    "city": "Cebu City",
    "province": "Cebu",
    "coordinates": {
      "lat": 14.5547,
      "lng": 121.0244
    }
  },
  "owner": {
    "name": "Juan Santos",
    "contactNumber": "+639123456789"
  },
  "selfDrive": true,
  "driverCharge": 0,
  "rating": 4.8,
  "rentedCount": 127
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "id": "vios-2021",
    "name": "Toyota Vios",
    "type": "sedan",
    "isActive": true,
    "createdAt": "2026-02-08T15:30:00.000Z",
    "updatedAt": "2026-02-08T15:30:00.000Z"
  },
  "message": "Car created successfully"
}
```

### 2. Get All Cars
**GET** `/api/cars`

Retrieve all cars with pagination and filtering options.

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `type` (string, optional): Filter by car type
- `city` (string, optional): Filter by city
- `province` (string, optional): Filter by province
- `minPrice` (number, optional): Minimum price per day
- `maxPrice` (number, optional): Maximum price per day
- `fuel` (string, optional): Filter by fuel type
- `transmission` (string, optional): Filter by transmission
- `seats` (number, optional): Filter by number of seats
- `sortBy` (string, optional): Sort field
- `sortOrder` (string, optional): Sort order (`asc`, `desc`)
- `search` (string, optional): Search term
- `availableFrom` (string, optional): Available from date (YYYY-MM-DD)
- `availableTo` (string, optional): Available to date (YYYY-MM-DD)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "id": "vios-2021",
      "name": "Toyota Vios",
      "type": "sedan",
      "pricePerDay": 45,
      "rating": 4.8,
      "rentedCount": 127,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  },
  "filters": {
    "type": "sedan",
    "minPrice": 30,
    "maxPrice": 50
  }
}
```

### 3. Get Car by ID
**GET** `/api/cars/:id`

Retrieve a specific car by its ID (e.g., "vios-2021").

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "id": "vios-2021",
    "name": "Toyota Vios",
    "type": "sedan",
    "image": "/images/toyota-vios-2021.jpg",
    "imageUrls": ["https://..."],
    "fuel": "gasoline",
    "year": 2021,
    "pricePerDay": 45,
    "pricePer12Hours": 30,
    "pricePer24Hours": 45,
    "pricePerHour": 3,
    "seats": 5,
    "transmission": "automatic",
    "deliveryFee": 15,
    "garageAddress": "Cebu City, Philippines",
    "garageLocation": { ... },
    "owner": { ... },
    "rentedCount": 127,
    "rating": 4.8,
    "selfDrive": true,
    "driverCharge": 0,
    "availability": { ... },
    "isActive": true,
    "createdAt": "2026-02-08T15:30:00.000Z",
    "updatedAt": "2026-02-08T15:30:00.000Z"
  }
}
```

### 4. Get Cars by Type
**GET** `/api/cars/type/:type`

Retrieve all cars of a specific type.

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `sortBy` (string, optional): Sort field
- `sortOrder` (string, optional): Sort order

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "id": "vios-2021",
      "name": "Toyota Vios",
      "type": "sedan",
      "pricePerDay": 45
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

### 5. Get Cars by Location
**GET** `/api/cars/location`

Retrieve cars by location (city and/or province).

#### Query Parameters
- `city` (string, optional): Filter by city
- `province` (string, optional): Filter by province
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `sortBy` (string, optional): Sort field
- `sortOrder` (string, optional): Sort order

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "id": "vios-2021",
      "name": "Toyota Vios",
      "garageLocation": {
        "city": "Cebu City",
        "province": "Cebu"
      }
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

### 6. Get Available Cars
**GET** `/api/cars/available`

Retrieve cars available for specific dates.

#### Query Parameters
- `startDate` (string, required): Start date (YYYY-MM-DD)
- `endDate` (string, required): End date (YYYY-MM-DD)
- `type` (string, optional): Filter by car type
- `city` (string, optional): Filter by city
- `province` (string, optional): Filter by province
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "id": "vios-2021",
      "name": "Toyota Vios",
      "availability": {
        "isAvailableToday": true,
        "unavailableDates": ["2026-01-24", "2026-01-25"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  },
  "dateRange": {
    "startDate": "2026-02-10",
    "endDate": "2026-02-12"
  }
}
```

### 7. Search Cars
**GET** `/api/cars/search`

Search cars by name, type, city, or province.

#### Query Parameters
- `q` (string, required): Search term
- `type` (string, optional): Filter by car type
- `minPrice` (number, optional): Minimum price per day
- `maxPrice` (number, optional): Maximum price per day
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "id": "vios-2021",
      "name": "Toyota Vios",
      "type": "sedan"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  },
  "search": {
    "term": "Toyota",
    "filters": {
      "type": "sedan",
      "minPrice": 30
    }
  }
}
```

### 8. Update Car
**PUT** `/api/cars/:id` 🔒

Update a car completely. All fields can be updated.

#### Request Body
Same structure as create car, but all fields are optional.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "id": "vios-2021",
    "name": "Toyota Vios Updated",
    "pricePerDay": 50,
    "updatedAt": "2026-02-08T16:00:00.000Z"
  },
  "message": "Car updated successfully"
}
```

### 9. Delete Car (Soft Delete)
**DELETE** `/api/cars/:id` 🔒

Soft delete a car (sets isActive to false).

#### Response
```json
{
  "success": true,
  "message": "Car deleted successfully"
}
```

### 10. Hard Delete Car
**DELETE** `/api/cars/:id/hard` 🔒

Permanently delete a car from the database.

#### Response
```json
{
  "success": true,
  "message": "Car permanently deleted"
}
```

### 11. Update Car Availability
**PATCH** `/api/cars/:id/availability` 🔒

Update car availability settings.

#### Request Body
```json
{
  "unavailableDates": ["2026-02-15", "2026-02-16"],
  "isAvailableToday": false
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "availability": {
      "isAvailableToday": false,
      "unavailableDates": ["2026-02-15", "2026-02-16"]
    },
    "updatedAt": "2026-02-08T16:00:00.000Z"
  },
  "message": "Car availability updated successfully"
}
```

### 12. Add Unavailable Dates
**POST** `/api/cars/:id/unavailable-dates` 🔒

Add dates to the car's unavailable dates list.

#### Request Body
```json
{
  "dates": ["2026-02-20", "2026-02-21", "2026-02-22"]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "availability": {
      "unavailableDates": ["2026-02-15", "2026-02-16", "2026-02-20", "2026-02-21", "2026-02-22"]
    }
  },
  "message": "Unavailable dates added successfully"
}
```

### 13. Remove Unavailable Dates
**DELETE** `/api/cars/:id/unavailable-dates` 🔒

Remove dates from the car's unavailable dates list.

#### Request Body
```json
{
  "dates": ["2026-02-15", "2026-02-16"]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "availability": {
      "unavailableDates": ["2026-02-20", "2026-02-21", "2026-02-22"]
    }
  },
  "message": "Unavailable dates removed successfully"
}
```

### 14. Increment Rented Count
**PATCH** `/api/cars/:id/increment-rented` 🔒

Increment the car's rented count by 1.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "rentedCount": 128,
    "updatedAt": "2026-02-08T16:00:00.000Z"
  },
  "message": "Rented count incremented successfully"
}
```

### 15. Update Car Rating
**PATCH** `/api/cars/:id/rating` 🔒

Update the car's rating.

#### Request Body
```json
{
  "rating": 4.9
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "rating": 4.9,
    "updatedAt": "2026-02-08T16:00:00.000Z"
  },
  "message": "Car rating updated successfully"
}
```

### 16. Get Car by MongoDB ID
**GET** `/api/cars/mongo/:id` 🔒

Retrieve a car by its MongoDB ObjectId. Requires authentication.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "id": "vios-2021",
    "name": "Toyota Vios"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed validation errors"]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `409` - Conflict (duplicate ID)
- `500` - Internal Server Error

## Validation Rules

### Car Types
- `sedan`, `suv`, `van`, `pickup truck`, `sports car`, `coupe`, `hatchback`

### Fuel Types
- `gasoline`, `diesel`, `electric`, `hybrid`

### Transmission Types
- `manual`, `automatic`

### Car ID Format
- Must contain only lowercase letters, numbers, and hyphens
- Example: `vios-2021`, `fortuner-2020`

### Price Validation
- All prices must be non-negative numbers
- `pricePer12Hours` should typically be ≤ `pricePerDay`
- `pricePer24Hours` should equal `pricePerDay`

### Coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180

### Rating
- Must be between 0 and 5 (inclusive)

## Schema Methods

The Car model includes several useful methods:

### Static Methods
- `Car.findByType(type, options)` - Find cars by type
- `Car.findByLocation(city, province, options)` - Find cars by location
- `Car.findAvailableForDates(startDate, endDate, options)` - Find available cars for dates
- `Car.searchCars(searchTerm, options)` - Search cars

### Instance Methods
- `car.isAvailableOnDates(startDate, endDate)` - Check availability
- `car.addUnavailableDates(dates)` - Add unavailable dates
- `car.removeUnavailableDates(dates)` - Remove unavailable dates
- `car.incrementRentedCount()` - Increment rented count
- `car.updateRating(rating)` - Update rating

## Example Usage

### Create a new car
```bash
curl -X POST http://localhost:5000/api/cars \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @car-data.json
```

### Get available cars for dates
```bash
curl -X GET "http://localhost:5000/api/cars/available?startDate=2026-02-10&endDate=2026-02-12&type=sedan"
```

### Search cars
```bash
curl -X GET "http://localhost:5000/api/cars/search?q=Toyota&minPrice=30&maxPrice=60"
```

### Update car availability
```bash
curl -X PATCH http://localhost:5000/api/cars/vios-2021/availability \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"unavailableDates": ["2026-02-15", "2026-02-16"]}'
```
