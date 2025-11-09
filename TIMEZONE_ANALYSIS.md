# Timezone Normalization Analysis - FlowForge Analytics Routes

## Executive Summary

The three analytics routes (`ship`, `streak`, `weekly`) have been recently refactored to use timezone-aware date normalization via `getUserDayStart()` function. The implementation is **now consistent** after the fix in commit b98d933, but there are **subtle differences in how dates flow through the system** that require careful understanding.

---

## Current Timezone Utility Implementation

### File: `/src/lib/timezone.ts`

```typescript
export function getUserDayStart(timezone: string, referenceDate: Date = new Date()): Date {
  return DateTime.fromJSDate(referenceDate, { zone: 'utc' })
    .setZone(timezone)
    .startOf('day')
    .toUTC()
    .toJSDate()
}

export function formatUserDate(referenceDate: Date, timezone: string, format: string): string {
  return DateTime.fromJSDate(referenceDate, { zone: 'utc' }).setZone(timezone).toFormat(format)
}
```

**Key Design:**
- Takes a UTC Date, interprets it in user's timezone, finds start-of-day, converts back to UTC
- This creates a UTC-normalized "midnight" that's safe for database queries with unique constraints
- `formatUserDate()` displays dates in user's timezone without converting storage format

---

## Analysis by Route

### 1. SHIP ROUTE (`/src/app/api/analytics/ship/route.ts`)

#### Date Normalization Points

| Line | Operation | Current Implementation | Notes |
|------|-----------|----------------------|-------|
| 51 | Get today's date | `const todayDate = getUserDayStart(timezone)` | Correct: converts current UTC time to user's timezone, finds start-of-day, returns as UTC |
| 58 | DB query | `userId_date: { userId, date: todayDate }` | Correct: uses timezone-normalized date for unique constraint |
| 112 | Streak calculation start | `const today = todayDate` | Correct: reuses already-normalized date |
| 116 | Per-record normalization | `const recordDate = getUserDayStart(timezone, record.date)` | **IMPORTANT**: Re-normalizes DB-stored dates to ensure consistency |
| 118 | Expected date calculation | `const expectedDate = subDays(today, currentStreak)` | Correct: subtracts days from normalized UTC date |
| 120 | Streak comparison | `const daysDiff = differenceInDays(expectedDate, recordDate)` | Correct: compares normalized dates |
| 139 | Yesterday calculation | `const yesterdayNormalized = subDays(today, 1)` | Correct: uses date-fns to subtract, maintains normalization |
| 145 | Yesterday DB query | `userId_date: { userId, date: yesterdayNormalized }` | Correct: queries with normalized date |

#### Key Insight: Redundant Normalization (Line 116)

```typescript
const recordDate = getUserDayStart(timezone, record.date)
```

The records retrieved from the database at line 102-109 already contain dates that were stored via `getUserDayStart()`. Re-normalizing them at line 116 is **technically redundant but safe** because:

1. `getUserDayStart()` is idempotent for already-normalized dates
2. Ensures consistency if date storage format ever changes
3. Acts as defensive programming against timezone drift

**Before recent fix** (commit bdf98a7):
- Used `startOfDay()` from date-fns, which operates in local system time (DANGEROUS)
- No timezone awareness in streak calculations
- Inconsistent with database dates which were UTC-normalized

**After recent fix** (commit b98d933):
- Now uses `getUserDayStart(timezone, ...)` throughout
- Consistent timezone handling
- Fixed `extendedStreak` calculation (see below)

#### Critical Fix: extendedStreak Logic

**Lines 139-153: Determining if streak was extended**

```typescript
// Determine if this extended the streak
const yesterdayNormalized = subDays(today, 1)

const yesterdayRecord = await prisma.analytics.findUnique({
  where: { userId_date: { userId, date: yesterdayNormalized } },
  select: { shipCount: true }
})

const extendedStreak = isFirstShipToday && yesterdayRecord !== null && yesterdayRecord.shipCount > 0
```

**Why this is correct:**
1. `isFirstShipToday`: Ensures this ship initiated today's count
2. `yesterdayRecord !== null`: Confirms yesterday had activity
3. `yesterdayRecord.shipCount > 0`: Confirms yesterday had actual ships

**Before fix (commit bdf98a7):**
```typescript
const extendedStreak = isFirstShipToday && currentStreak > 0
```

**The problem:** After upserting today's first ship (line 77-99), `currentStreak` is recalculated (lines 102-127). Since today now has 1 ship, the streak will always be >= 1, making this condition always true on first ship.

---

### 2. STREAK ROUTE (`/src/app/api/analytics/streak/route.ts`)

#### Date Normalization Points

| Line | Operation | Current Implementation | Notes |
|------|-----------|----------------------|-------|
| 60 | Get today's date | `const today = getUserDayStart(timezone)` | Correct: timezone-aware normalization |
| 64 | Per-record normalization | `const recordDate = getUserDayStart(timezone, record.date)` | **Same pattern as ship route**: re-normalizes for consistency |
| 67 | Expected date calculation | `const expectedDate = subDays(today, currentStreak)` | Correct: maintains normalized format |
| 69 | Comparison | `const daysDiff = differenceInDays(expectedDate, recordDate)` | Correct: compares normalized dates |
| 86 | Longest streak normalization | `const recordDate = getUserDayStart(timezone, record.date)` | **Re-normalizes again in longest streak loop** |
| 93 | Consecutive day check | `const daysDiff = differenceInDays(recordDate, lastDate)` | Correct: both are normalized dates |
| 107 | Gap detection | `const daysDiff = differenceInDays(recordDate, lastDate)` | Consistent with current streak calculation |
| 118 | Last ship date | `const lastShipDate = lastShipRecord ? lastShipRecord.date : undefined` | **POTENTIAL ISSUE**: Returns raw DB date, not formatted for user timezone |

#### Critical Issue: Line 118 - lastShipDate Return Format

```typescript
const lastShipRecord = analyticsRecords.find((record) => record.shipCount > 0)
const lastShipDate = lastShipRecord ? lastShipRecord.date : undefined
```

**Problem:** This returns the raw UTC-normalized date from the database. If the frontend expects a specific format or interpretation, it may be confusing because:

1. The date represents "start of day in user's timezone" expressed as UTC
2. For display purposes, it should probably be formatted with `formatUserDate()`
3. As an ISO string, it will show a UTC time, not user's local midnight

**Example:** 
- User in EST (UTC-5) ships on "Monday" locally
- Database stores: `2025-11-08T05:00:00Z` (EST midnight as UTC)
- API returns: `2025-11-08T05:00:00Z`
- Frontend may interpret this as "November 8 at 5am UTC" instead of "November 7 midnight EST"

---

### 3. WEEKLY ROUTE (`/src/app/api/analytics/weekly/route.ts`)

#### Date Normalization Points

| Line | Operation | Current Implementation | Notes |
|------|-----------|----------------------|-------|
| 45 | Get today's date | `const today = getUserDayStart(timezone)` | Correct: timezone-aware |
| 46 | Date range start | `const startDate = subDays(today, 6)` | Correct: maintains normalized format |
| 52-55 | DB range query | `where: { date: { gte: startDate, lte: today } }` | Correct: queries with normalized dates |
| 67 | Record mapping key | `const dateKey = formatUserDate(record.date, timezone, 'yyyy-MM-dd')` | **IMPORTANT**: Formats for display comparison, not storage |
| 75 | Loop date key | `const dateKey = formatUserDate(date, timezone, 'yyyy-MM-dd')` | Consistent with line 67 |
| 77 | Day of week format | `const dayOfWeek = formatUserDate(date, timezone, 'EEE')` | Correct: formats in user's timezone |
| 80 | Return format | `date: date.toISOString()` | **SAME ISSUE AS STREAK**: Returns ISO UTC, may confuse frontend |

#### Map Key Strategy (Lines 67, 75)

**Good design choice:**
- Uses `formatUserDate()` to create string keys in format `yyyy-MM-dd`
- Both database dates and loop dates formatted the same way
- Ensures matching even if dates are stored inconsistently

**Why this works:**
```typescript
// Database record from 2025-11-08T05:00:00Z
const dateKey = formatUserDate(record.date, timezone, 'yyyy-MM-dd')
// Result: "2025-11-08" (the day in user's timezone)

// Loop date from subDays(normalized_today, i)
const dateKey = formatUserDate(date, timezone, 'yyyy-MM-dd')
// Result: "2025-11-08" (same day in user's timezone)
```

---

## Inconsistencies Summary

### 1. **Re-normalization Pattern** (Levels: Medium Priority)

**Location:**
- Ship: Line 116
- Streak: Lines 64, 86
- Weekly: Lines 67, 75 (via formatUserDate)

**Pattern:**
```typescript
// Database returns dates already normalized by getUserDayStart()
// But code re-normalizes them
const recordDate = getUserDayStart(timezone, record.date)
```

**Analysis:**
- Not technically wrong (idempotent operation)
- Indicates uncertainty about date format in transit
- Could mask bugs if normalization changes

**Recommendation:** Document that database dates are pre-normalized, or standardize the approach

### 2. **lastShipDate Return Format** (Priority: Medium)

**Location:** Streak route, Line 118

**Issue:**
```typescript
const lastShipDate = lastShipRecord ? lastShipRecord.date : undefined
```

Returns raw UTC ISO date that represents "user's midnight" but is expressed in UTC. Frontend may misinterpret.

**Fix:** Either:
- Document the ISO format represents "midnight in user timezone, expressed as UTC"
- Convert to Unix timestamp
- Return formatted string

### 3. **Weekly Route Return Format** (Priority: Medium)

**Location:** Line 80

```typescript
date: date.toISOString()
```

**Issue:** Same as #2 - ISO UTC datetime may confuse about what it represents

### 4. **No Timezone Validation** (Priority: Low)

**Location:** All three routes, lines 37-48

```typescript
const timezone = user?.timezone || 'UTC'
```

- No validation that timezone string is valid IANA identifier
- Invalid timezone passed to Luxon may fail silently or throw
- No error handling

### 5. **Re-normalization of Expected Dates** (Priority: Low)

**Location:** 
- Ship: Line 118 
- Streak: Line 67

```typescript
const expectedDate = subDays(today, currentStreak)
const daysDiff = differenceInDays(expectedDate, recordDate)
```

**Question:** After creating `expectedDate` via `subDays()` on an already-normalized date, is it still properly normalized? Generally yes, but assumes `date-fns` preserves UTC representation.

---

## Database Storage Model

### Assumed Schema

```prisma
model Analytics {
  userId    String
  date      DateTime     // Stored as normalized UTC (start of day in user's timezone)
  shipCount Int
  
  @@id([userId, date])
  @@index([userId, date])
}

model User {
  id       String
  timezone String   // IANA timezone identifier (e.g., "America/New_York")
}
```

**Storage Guarantee:**
- `date` field always contains the result of `getUserDayStart(timezone)`
- This ensures same "logical day" in user's timezone always maps to same date value
- Enables unique constraint on (userId, date) to work correctly

**Example:** User in EST marking a ship on Nov 8, 2025 locally at 11pm:
```
Local time:     2025-11-08 23:00:00 EST (UTC-5)
UTC time:       2025-11-09 04:00:00 UTC
getUserDayStart() input:  2025-11-09 04:00:00 UTC
→ Interpret as:           2025-11-08 23:00:00 EST
→ Start of day:           2025-11-08 00:00:00 EST
→ Convert to UTC:         2025-11-08 05:00:00 UTC
Stored in DB:   2025-11-08 05:00:00 UTC
```

---

## Before vs. After Recent Fix

### Before (commit bdf98a7)

**Ship Route - Streak Calculation (pre-fix):**
```typescript
const recordDate = startOfDay(record.date)  // ❌ Local system time!
const expectedDate = new Date(today)
expectedDate.setDate(today.getDate() - currentStreak)
const daysDiff = differenceInDays(startOfDay(expectedDate), recordDate)
```

**Problems:**
1. `startOfDay()` without timezone uses local system time
2. If server is in different timezone than user, calculations wrong
3. Date math via `setDate()` is error-prone
4. No timezone awareness

### After (current)

**Ship Route - Streak Calculation:**
```typescript
const recordDate = getUserDayStart(timezone, record.date)  // ✅ Timezone-aware
const expectedDate = subDays(today, currentStreak)         // ✅ Proper date math
const daysDiff = differenceInDays(expectedDate, recordDate) // ✅ Consistent
```

**Improvements:**
1. All dates normalized to user's timezone
2. Luxon handles timezone conversions
3. date-fns for safe date arithmetic
4. Consistent throughout

---

## Risk Assessment

### Low Risk
- Date arithmetic via `date-fns` functions
- Timezone conversion via Luxon
- Unique constraint behavior with normalized dates

### Medium Risk
- Return format of ISO dates to frontend (may cause interpretation errors)
- Re-normalization pattern (indicates uncertainty about data flow)
- No validation of timezone strings

### High Risk
- Currently NONE - recent fixes have resolved critical issues

---

## Code Quality Observations

### Positive
1. **Consistent pattern**: All three routes follow same normalization approach
2. **Defensive programming**: Re-normalizing dates is safe
3. **Clear variable naming**: `today`, `todayDate`, `recordDate` clearly indicate normalized dates
4. **Proper imports**: Using `getUserDayStart` consistently instead of date-fns `startOfDay`

### Could Improve
1. Add type definition to clarify dates are "normalized UTC" (not raw local times)
2. Document the ISO string format returned to frontend
3. Add timezone validation
4. Consider creating utility like `getNormalizedDateString()` for consistent return formats
5. Add tests with multiple timezones to catch regression

---

## Line-by-Line Consistency Matrix

### Ship Route

```
Line  Timezone-Aware?  Normalized?  Safe?  Notes
---   ---------------  -----------  -----  ------
51    ✅ YES            ✅ YES        ✅     getUserDayStart(timezone)
58    ✅ YES            ✅ YES        ✅     Uses todayDate in query
112   ✅ YES            ✅ YES        ✅     Reuses todayDate
116   ✅ YES            ✅ YES        ⚠️     Re-normalizes (redundant but safe)
118   ✅ YES            ✅ YES        ✅     subDays maintains format
120   ✅ YES            ✅ YES        ✅     Both operands normalized
139   ✅ YES            ✅ YES        ✅     subDays from normalized date
145   ✅ YES            ✅ YES        ✅     Uses normalized date in query
```

### Streak Route

```
Line  Timezone-Aware?  Normalized?  Safe?  Notes
---   ---------------  -----------  -----  ------
60    ✅ YES            ✅ YES        ✅     getUserDayStart(timezone)
64    ✅ YES            ✅ YES        ⚠️     Re-normalizes (redundant)
67    ✅ YES            ✅ YES        ✅     subDays from normalized
69    ✅ YES            ✅ YES        ✅     Both operands normalized
86    ✅ YES            ✅ YES        ⚠️     Re-normalizes (redundant)
93    ✅ YES            ✅ YES        ✅     Both operands normalized
107   ✅ YES            ✅ YES        ✅     Both operands normalized
118   ❌ NO             ❌ NO         ⚠️     Raw date, no timezone formatting
```

### Weekly Route

```
Line  Timezone-Aware?  Normalized?  Safe?  Notes
---   ---------------  -----------  -----  ------
45    ✅ YES            ✅ YES        ✅     getUserDayStart(timezone)
46    ✅ YES            ✅ YES        ✅     subDays from normalized
52-55 ✅ YES            ✅ YES        ✅     Range query with normalized dates
67    ✅ YES            ✅ YES (→str) ✅     formatUserDate for map keys
75    ✅ YES            ✅ YES (→str) ✅     Consistent with line 67
77    ✅ YES            ✅ YES (→str) ✅     formatUserDate for display
80    ⚠️  MIXED         ⚠️  MIXED     ⚠️     toISOString() loses timezone context
```

---

## Conclusion

The recent fix (commit b98d933) has **significantly improved** timezone handling consistency across all three analytics routes. The main patterns are now uniform:

1. ✅ Get user's timezone from database
2. ✅ Normalize dates via `getUserDayStart(timezone)`  
3. ✅ Use normalized dates consistently in queries and calculations
4. ✅ Format for display only with `formatUserDate()`

**Remaining minor issues:**
- Return formats to frontend could be clearer
- Re-normalization pattern could be documented
- Timezone string validation would be defensive

**No critical bugs detected** in current implementation.
