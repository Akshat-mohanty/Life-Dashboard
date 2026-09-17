# DynamoDB Single-Table Design — Life Dashboard

**Table Name**: `LifeDashboard`  
**Billing Mode**: `PAY_PER_REQUEST` (On-Demand)  
**Partition Key (PK)**: `String` — `USER#{userId}`  
**Sort Key (SK)**: `String` — `{ENTITY}#{id}`  

---

## 1. Design Overview

Life Dashboard follows an optimized **Single-Table Design** pattern. All user domains (Bills, Tasks, Calendar Events, Health Reminders, Documents, Spending Records, and Morning AI Briefings) are co-located in the `LifeDashboard` table.

### Core Principles
1. **Strict Multi-Tenant Isolation**: The Partition Key (`PK`) is always prefixed with `USER#{userId}`, ensuring users can never query or mutate another user's records.
2. **Entity Namespacing**: The Sort Key (`SK`) is prefixed with `{ENTITY}#{id}` (e.g. `BILL#b101`, `TASK#t202`, `BRIEFING#2026-09-17`), allowing targeted `begins_with(SK, "ENTITY#")` queries.
3. **Auditability**: Every item stores `createdAt` and `updatedAt` ISO 8601 timestamps alongside `userId`.

---

## 2. Access Patterns

| Access Pattern ID | Domain | Operation | Key Condition & Filter |
|---|---|---|---|
| **AP-01** | Bills | List all bills for user | `PK = USER#{userId}` AND `begins_with(SK, "BILL#")` |
| **AP-02** | Bills | Get, Update, or Delete bill | `PK = USER#{userId}` AND `SK = BILL#{billId}` |
| **AP-03** | Tasks | List all tasks for user | `PK = USER#{userId}` AND `begins_with(SK, "TASK#")` |
| **AP-04** | Tasks | Get, Update, or Delete task | `PK = USER#{userId}` AND `SK = TASK#{taskId}` |
| **AP-05** | Calendar | List calendar events for user | `PK = USER#{userId}` AND `begins_with(SK, "EVENT#")` |
| **AP-06** | Calendar | Get or Delete calendar event | `PK = USER#{userId}` AND `SK = EVENT#{eventId}` |
| **AP-07** | Health | List health reminders for user | `PK = USER#{userId}` AND `begins_with(SK, "HEALTH#")` |
| **AP-08** | Health | Get, Update, or Delete reminder | `PK = USER#{userId}` AND `SK = HEALTH#{reminderId}` |
| **AP-09** | Documents | List uploaded documents | `PK = USER#{userId}` AND `begins_with(SK, "DOC#")` |
| **AP-10** | Documents | Get or Delete document metadata | `PK = USER#{userId}` AND `SK = DOC#{docId}` |
| **AP-11** | Spending | List spending records | `PK = USER#{userId}` AND `begins_with(SK, "SPEND#")` |
| **AP-12** | Spending | Compute monthly spending summary | `PK = USER#{userId}` AND `begins_with(SK, "SPEND#")` |
| **AP-13** | Briefing | Retrieve today's AI briefing | `PK = USER#{userId}` AND `SK = BRIEFING#{date}` |
| **AP-14** | Briefing (Batch) | Scan all active users (7 AM IST) | Paginated Scan with projection of `userId` |

---

## 3. Entity Schemas & Attribute Definitions

### 3.1 Common Base Attributes
```json
{
  "PK": "USER#u_12345",
  "SK": "<ENTITY>#<id>",
  "userId": "u_12345",
  "createdAt": "2026-09-17T08:00:00.000Z",
  "updatedAt": "2026-09-17T08:00:00.000Z"
}
```

---

### 3.2 Bills (`BILL#<id>`)
Tracks fixed and recurring obligations, due dates, amounts, and payment status.
```json
{
  "PK": "USER#u_12345",
  "SK": "BILL#b_78901",
  "userId": "u_12345",
  "id": "b_78901",
  "name": "Electricity & Utilities",
  "amount": 2850.00,
  "dueDate": "2026-09-20",
  "isPaid": false,
  "isRecurring": true,
  "frequency": "monthly",
  "createdAt": "2026-09-01T10:00:00.000Z",
  "updatedAt": "2026-09-17T08:00:00.000Z"
}
```
* **Status Computation**:
  - Overdue: `!isPaid && dueDate < today`
  - Due Soon: `!isPaid && dueDate >= today && dueDate <= today + 3 days`
  - Upcoming: `!isPaid && dueDate > today + 3 days`
  - Paid: `isPaid === true`

---

### 3.3 Tasks (`TASK#<id>`)
Action items with priority tags, deadlines, completion flags, and Bedrock AI urgency rankings.
```json
{
  "PK": "USER#u_12345",
  "SK": "TASK#t_45678",
  "userId": "u_12345",
  "id": "t_45678",
  "title": "Review Q3 Tax filings",
  "description": "Cross-reference invoices and bank deductions with CA report",
  "dueDate": "2026-09-18",
  "priority": "high",
  "isCompleted": false,
  "aiRank": 1,
  "createdAt": "2026-09-15T09:00:00.000Z",
  "updatedAt": "2026-09-17T07:00:00.000Z"
}
```
* **Field Constraints**:
  - `priority`: `"high"` | `"medium"` | `"low"`
  - `aiRank`: Number `1` to `10` (1 being most critical, assigned daily by Bedrock)

---

### 3.4 Calendar Events (`EVENT#<id>`)
Events and appointments for today and the upcoming 7 days.
```json
{
  "PK": "USER#u_12345",
  "SK": "EVENT#e_98765",
  "userId": "u_12345",
  "id": "e_98765",
  "title": "Dentist Follow-up Consultation",
  "date": "2026-09-18",
  "time": "14:30",
  "location": "Apollo Clinic, Sector 4",
  "notes": "Bring previous X-ray scans",
  "createdAt": "2026-09-10T11:20:00.000Z",
  "updatedAt": "2026-09-10T11:20:00.000Z"
}
```

---

### 3.5 Health Reminders (`HEALTH#<id>`)
Recurring wellness habits, medicine timings, hydration goals, and SNS alert configurations.
```json
{
  "PK": "USER#u_12345",
  "SK": "HEALTH#h_13579",
  "userId": "u_12345",
  "id": "h_13579",
  "name": "Take Vitamin D3 & Omega 3",
  "frequency": "daily",
  "time": "08:30",
  "phoneNumber": "+919876543210",
  "lastTriggered": "2026-09-17T08:30:00.000Z",
  "createdAt": "2026-09-01T07:00:00.000Z",
  "updatedAt": "2026-09-17T08:30:00.000Z"
}
```
* **Field Constraints**:
  - `frequency`: `"daily"` | `"weekly"` | `"custom"`
  - `time`: HH:mm format (24-hour clock)

---

### 3.6 Documents (`DOC#<id>`)
Secure metadata for uploaded files stored in S3, tracking critical expiration dates.
```json
{
  "PK": "USER#u_12345",
  "SK": "DOC#d_24680",
  "userId": "u_12345",
  "id": "d_24680",
  "name": "Health Insurance Policy Card",
  "s3Key": "documents/u_12345/health-insurance-policy.pdf",
  "fileType": "application/pdf",
  "expiryDate": "2026-10-05",
  "category": "insurance",
  "createdAt": "2026-08-15T14:15:00.000Z",
  "updatedAt": "2026-08-15T14:15:00.000Z"
}
```
* **Field Constraints**:
  - `category`: `"ID"` | `"insurance"` | `"certificate"` | `"medical"` | `"other"`
  - `s3Key`: Strictly isolated per user: `documents/{userId}/{filename}`

---

### 3.7 Spending Records (`SPEND#<id>`)
Categorized expense tracking with running totals and month-over-month comparisons.
```json
{
  "PK": "USER#u_12345",
  "SK": "SPEND#s_11223",
  "userId": "u_12345",
  "id": "s_11223",
  "amount": 1450.00,
  "category": "food",
  "description": "Weekly organic groceries & produce",
  "date": "2026-09-17",
  "createdAt": "2026-09-17T12:45:00.000Z",
  "updatedAt": "2026-09-17T12:45:00.000Z"
}
```
* **Field Constraints**:
  - `category`: `"food"` | `"transport"` | `"bills"` | `"health"` | `"entertainment"` | `"other"`

---

### 3.8 AI Morning Briefing (`BRIEFING#<date>`)
Aggregated, synthesised plain-English morning executive briefing produced by Bedrock Claude.
```json
{
  "PK": "USER#u_12345",
  "SK": "BRIEFING#2026-09-17",
  "userId": "u_12345",
  "date": "2026-09-17",
  "content": "Good morning Akshat! Today is Thursday, September 17.\n\n🔴 Needs attention today:\n- Review Q3 Tax filings due today.\n- Dentist consultation at Apollo Clinic at 2:30 PM.\n\n🟡 Coming up soon:\n- Electricity & Utilities bill of ₹2,850 due on Sep 20.\n- Health insurance policy expires in 18 days.\n\n✅ You're on top of:\n- All pending rent and credit card payments are settled.\n\nTake a quick breath between meetings today — you've got this under control!",
  "generatedAt": "2026-09-17T07:00:15.123Z",
  "createdAt": "2026-09-17T07:00:15.123Z",
  "updatedAt": "2026-09-17T07:00:15.123Z"
}
```
