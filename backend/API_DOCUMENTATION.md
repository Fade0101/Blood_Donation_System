# Blood Donation System API Documentation

## Base URL
```
http://localhost:5000
```

## Environment Variables (Postman)
```
base_url = http://localhost:5000
```

---

## 📋 API Endpoints Overview

### Donors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/donors` | Get all donors (sorted by createdAt desc) |
| GET | `/api/donors/:id` | Get single donor by UUID |
| POST | `/api/donors` | Create new donor |
| PUT | `/api/donors/:id` | Update donor (partial) |
| DELETE | `/api/donors/:id` | Delete donor |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | Get all campaigns (sorted by createdAt desc) |
| GET | `/api/campaigns/:id` | Get single campaign by UUID |
| POST | `/api/campaigns` | Create new campaign |
| PUT | `/api/campaigns/:id` | Update campaign (partial) |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Campaign Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns/:campaignId/register` | Register donor to campaign (smart logic) |
| GET | `/api/campaigns/:campaignId/export` | Export campaign donors as CSV |

---

## 🧑 Donor Endpoints

### 1. Get All Donors
**Request:**
```
GET /api/donors
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nationalId": "12345678901234",
    "name": "Ahmed Hassan",
    "phone": "+966501234567",
    "address": "Riyadh, Saudi Arabia",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "bloodType": "A_POS",
    "createdAt": "2024-04-26T10:30:00.000Z",
    "updatedAt": "2024-04-26T10:30:00.000Z",
    "age": 34
  }
]
```

---

### 2. Get Donor by ID
**Request:**
```
GET /api/donors/:id
```

**URL Parameters:**
```
id (string, UUID): Donor UUID
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nationalId": "12345678901234",
  "name": "Ahmed Hassan",
  "phone": "+966501234567",
  "address": "Riyadh",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "bloodType": "A_POS",
  "createdAt": "2024-04-26T10:30:00.000Z",
  "updatedAt": "2024-04-26T10:30:00.000Z",
  "age": 34
}
```

**Error (404 Not Found):**
```json
{
  "error": "Donor not found"
}
```

---

### 3. Create Donor
**Request:**
```
POST /api/donors
Content-Type: application/json
```

**Body:**
```json
{
  "nationalId": "12345678901234",
  "name": "Ahmed Hassan",
  "phone": "+966501234567",
  "address": "Riyadh, Saudi Arabia",
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "bloodType": "A_POS"
}
```

**Validation Rules:**
- `nationalId` (required): Exactly 14 characters, unique
- `name` (required): Non-empty string
- `phone` (required): Non-empty string
- `address` (optional): String
- `dateOfBirth` (optional): ISO 8601 datetime
- `bloodType` (optional): One of `A_POS`, `A_NEG`, `B_POS`, `B_NEG`, `AB_POS`, `AB_NEG`, `O_POS`, `O_NEG`

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nationalId": "12345678901234",
  "name": "Ahmed Hassan",
  "phone": "+966501234567",
  "address": "Riyadh, Saudi Arabia",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "bloodType": "A_POS",
  "createdAt": "2024-04-26T10:30:00.000Z",
  "updatedAt": "2024-04-26T10:30:00.000Z",
  "age": 34
}
```

**Error (400 Bad Request - Validation):**
```json
{
  "error": "Validation failed",
  "details": {
    "nationalId": "National ID must be exactly 14 characters",
    "name": "Name is required",
    "phone": "Phone is required"
  }
}
```

**Error (409 Conflict - Duplicate):**
```json
{
  "error": "A donor with this national ID already exists"
}
```

---

### 4. Update Donor
**Request:**
```
PUT /api/donors/:id
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "name": "Ahmed Hassan",
  "phone": "+966502222222",
  "address": "Jeddah, Saudi Arabia",
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "bloodType": "A_NEG"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nationalId": "12345678901234",
  "name": "Ahmed Hassan",
  "phone": "+966502222222",
  "address": "Jeddah, Saudi Arabia",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "bloodType": "A_NEG",
  "createdAt": "2024-04-26T10:30:00.000Z",
  "updatedAt": "2024-04-26T10:35:00.000Z",
  "age": 34
}
```

---

### 5. Delete Donor
**Request:**
```
DELETE /api/donors/:id
```

**Response (204 No Content):**
```
(empty body)
```

---

## 🏥 Campaign Endpoints

### 1. Get All Campaigns
**Request:**
```
GET /api/campaigns
```

**Response (200 OK):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "campaignNumber": 1,
    "startDate": "2024-04-26T00:00:00.000Z",
    "endDate": "2024-05-26T00:00:00.000Z",
    "bloodBankName": "Central Blood Bank",
    "supervisorName": "Dr. Mohammed",
    "createdAt": "2024-04-26T10:00:00.000Z",
    "updatedAt": "2024-04-26T10:00:00.000Z"
  }
]
```

---

### 2. Get Campaign by ID
**Request:**
```
GET /api/campaigns/:id
```

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "campaignNumber": 1,
  "startDate": "2024-04-26T00:00:00.000Z",
  "endDate": "2024-05-26T00:00:00.000Z",
  "bloodBankName": "Central Blood Bank",
  "supervisorName": "Dr. Mohammed",
  "createdAt": "2024-04-26T10:00:00.000Z",
  "updatedAt": "2024-04-26T10:00:00.000Z"
}
```

---

### 3. Create Campaign
**Request:**
```
POST /api/campaigns
Content-Type: application/json
```

**Body:**
```json
{
  "campaignNumber": 1,
  "startDate": "2024-04-26T00:00:00Z",
  "endDate": "2024-05-26T00:00:00Z",
  "bloodBankName": "Central Blood Bank",
  "supervisorName": "Dr. Mohammed"
}
```

**Validation Rules:**
- `campaignNumber` (required): Positive integer, unique
- `startDate` (required): ISO 8601 datetime
- `endDate` (optional): ISO 8601 datetime
- `bloodBankName` (optional): String
- `supervisorName` (optional): String

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "campaignNumber": 1,
  "startDate": "2024-04-26T00:00:00.000Z",
  "endDate": "2024-05-26T00:00:00.000Z",
  "bloodBankName": "Central Blood Bank",
  "supervisorName": "Dr. Mohammed",
  "createdAt": "2024-04-26T10:00:00.000Z",
  "updatedAt": "2024-04-26T10:00:00.000Z"
}
```

**Error (409 Conflict - Duplicate):**
```json
{
  "error": "Campaign number already exists"
}
```

---

### 4. Update Campaign
**Request:**
```
PUT /api/campaigns/:id
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "startDate": "2024-05-01T00:00:00Z",
  "endDate": "2024-06-01T00:00:00Z",
  "bloodBankName": "New Blood Bank",
  "supervisorName": "Dr. Ali"
}
```

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "campaignNumber": 1,
  "startDate": "2024-05-01T00:00:00.000Z",
  "endDate": "2024-06-01T00:00:00.000Z",
  "bloodBankName": "New Blood Bank",
  "supervisorName": "Dr. Ali",
  "createdAt": "2024-04-26T10:00:00.000Z",
  "updatedAt": "2024-04-26T10:05:00.000Z"
}
```

---

### 5. Delete Campaign
**Request:**
```
DELETE /api/campaigns/:id
```

**Response (204 No Content):**
```
(empty body)
```

---

## ⚡ Campaign Operations

### 1. Register Donor to Campaign (Smart Registration)

**Request:**
```
POST /api/campaigns/:campaignId/register
Content-Type: application/json
```

**URL Parameters:**
```
campaignId (string, UUID): Campaign UUID
```

**Body:**
```json
{
  "nationalId": "12345678901234",
  "name": "Ahmed Hassan",
  "phone": "+966501234567",
  "address": "Riyadh",
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "offlineSyncId": "sync-123-abc"
}
```

**Smart Registration Logic:**
1. **Find by nationalId** (absolute source of truth)
2. **If donor NOT found:**
   - Require full details (name, phone)
   - Create new donor
3. **If donor found:**
   - Optionally update phone/address if provided
4. **Check for duplicate registration** (prevent double registration in same campaign)
5. **Create registration** with offlineSyncId (auto-generate UUID if not provided)

**Response (201 Created):**
```json
{
  "donor": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nationalId": "12345678901234",
    "name": "Ahmed Hassan",
    "phone": "+966501234567",
    "address": "Riyadh",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "bloodType": null,
    "createdAt": "2024-04-26T10:30:00.000Z",
    "updatedAt": "2024-04-26T10:30:00.000Z"
  },
  "registration": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "donorId": "550e8400-e29b-41d4-a716-446655440000",
    "campaignId": "660e8400-e29b-41d4-a716-446655440001",
    "registeredAt": "2024-04-26T10:30:00.000Z",
    "donatedAt": null,
    "offlineSyncId": "auto-generated-uuid"
  }
}
```

**Error (400 Bad Request - Missing details):**
```json
{
  "error": "هذا المتبرع غير مسجل من قبل. يرجى إدخال البيانات كاملة."
}
```

**Error (400 Bad Request - Duplicate registration):**
```json
{
  "error": "المتبرع مسجل بالفعل في هذه الحملة."
}
```

---

### 2. Export Campaign Donors as CSV

**Request:**
```
GET /api/campaigns/:campaignId/export?bloodType=A_POS
```

**URL Parameters:**
```
campaignId (string, UUID): Campaign UUID
```

**Query Parameters:**
```
bloodType (string, optional): Filter by blood type
  Allowed values: A_POS, A_NEG, B_POS, B_NEG, AB_POS, AB_NEG, O_POS, O_NEG
```

**Response (200 OK):**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename=campaign_1_donors.csv

"National ID","Name","Phone","Address","Blood Type","Registration Date"
"12345678901234","Ahmed Hassan","+966501234567","Riyadh","A_POS","2024-04-26"
"98765432109876","Fatima Mohammed","+966502222222","Jeddah","O_POS","2024-04-26"
```

**Error (404 Not Found):**
```json
{
  "error": "No donors found for this campaign with specified criteria"
}
```

---

## 🔑 Blood Type Enums
```
A_POS
A_NEG
B_POS
B_NEG
AB_POS
AB_NEG
O_POS
O_NEG
```

---

## ⚠️ Error Responses

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": {
    "field1": "Validation message",
    "field2": "Validation message"
  }
}
```

### Not Found (404)
```json
{
  "error": "Resource not found"
}
```

### Conflict (409)
```json
{
  "error": "Resource already exists"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error"
}
```

---

## 🚀 How to Use the Postman Collection

1. **Import Collection:**
   - Open Postman
   - Click `Import` → Select `postman_collection.json`

2. **Set Environment Variable:**
   - Create/select an environment
   - Add variable: `base_url = http://localhost:5000`

3. **Start Testing:**
   - All endpoints are pre-configured with examples
   - Modify variables and request bodies as needed
   - Send requests and review responses

---

## 📝 Notes

- **Timestamps**: All dates are in ISO 8601 format (UTC)
- **Age Calculation**: Computed on-the-fly from `dateOfBirth`
- **Sorting**: All GET lists return data ordered by `createdAt` (newest first)
- **Transactions**: Donor registration uses database transactions for atomicity
- **Validation**: All inputs validated using Zod schemas before processing
