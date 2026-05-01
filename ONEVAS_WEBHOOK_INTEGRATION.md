# Onevas Webhook Integration Guide

## Webhook URLs

### 1. Subscription Webhook
**URL:** `https://postworq.onrender.com/api/onevas/subscription/`  
**Method:** POST  
**Purpose:** Onevas calls this when a user successfully subscribes via SMS

**Expected Payload:**
```json
{
  "phone_number": "251911234567",
  "product_number": "10000302852",
  "password": "optional"
}
```

---

### 2. Unsubscription Webhook
**URL:** `https://postworq.onrender.com/api/onevas/unsubscription/`  
**Method:** POST  
**Purpose:** Onevas calls this when a user unsubscribes

**Expected Payload:**
```json
{
  "phone_number": "251911234567",
  "product_number": "10000302852"
}
```

---

### 3. Charging/Renewal Webhook
**URL:** `https://postworq.onrender.com/api/onevas/renewal/`  
**Method:** POST  
**Purpose:** Onevas calls this when a subscription is auto-renewed

**Expected Payload:**
```json
{
  "phone_number": "251911234567",
  "nextRenewalDate": "2024-06-29",
  "product_number": "10000302852"
}
```

---

### 4. STOP Command Webhook (Optional)
**URL:** `https://postworq.onrender.com/api/onevas/stop/`  
**Method:** POST  
**Purpose:** Onevas calls this when a user sends "STOP" or "stop" to cancel

**Expected Payload:**
```json
{
  "phone_number": "251911234567"
}
```

---

## Product Configuration

| Plan | SMS Code | Product Number | Application Key | SPID | Service ID |
|------|----------|----------------|-----------------|------|------------|
| Daily | A | 10000302850 | UPJG5ZM3X6C9LLDSKKCME4MA86UQRKWV | 300263 | 30026300007331 |
| Weekly | B | 10000302851 | I6QEX9W5D341NN50QPB0KQ9HW6DH99TQ | 300263 | 30026300007332 |
| Monthly | C | 10000302852 | 0Y72TFLJP4ZAQ127K0O43IJSD9QAPTWQ | 300263 | 30026300007333 |
| OnDemand | D | 10000302853 | 4CROFBT0EGCM1OK8R88EQBTEZOMI3138 | 300263 | 30026300007334 |

---

## SMS Short Code
```
9286
```

Users send SMS with plan code (A, B, C, or D) to this short code to subscribe.

---

## Subscription Flow

### For Registered Users:
1. User sends SMS with plan code (A/B/C/D) to 9286
2. Onevas charges user's airtime
3. Onevas sends webhook to `/api/onevas/subscription/`
4. Backend creates/updates subscription
5. Backend sends confirmation SMS

### For Unregistered Users:
1. User sends SMS with plan code (A/B/C/D) to 9286
2. Onevas charges user's airtime
3. Onevas sends webhook to `/api/onevas/subscription/`
4. Backend creates PENDING subscription (linked to phone number)
5. Backend sends registration link SMS
6. User registers with phone number
7. Backend automatically activates pending subscription

### Unsubscription Flow:
1. User sends "STOP" or "stop" to 9286
2. Onevas sends webhook to `/api/onevas/stop/`
3. Backend cancels active subscription
4. Backend sends confirmation SMS

### Renewal Flow:
1. Onevas auto-renews subscription at end date
2. Onevas charges user's airtime
3. Onevas sends webhook to `/api/onevas/renewal/`
4. Backend extends subscription end date
5. Backend sends renewal confirmation SMS

---

## Response Format

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Subscription created successfully"
}
```

**Error Response (400/404/500):**
```json
{
  "error": "Error message description"
}
```

---

## Notes
- All webhook URLs use POST method
- Phone numbers should be in format: 251XXXXXXXXX
- Product codes are case-insensitive (a, A both work)
- The system supports both uppercase and lowercase SMS codes
