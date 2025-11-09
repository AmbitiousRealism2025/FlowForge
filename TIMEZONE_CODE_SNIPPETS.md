# Timezone Normalization - Detailed Code Snippets

## Quick Reference: Where Dates Are Used

### Ship Route (/src/app/api/analytics/ship/route.ts)

#### Line 51: Get Today's Date
```typescript
const todayDate = getUserDayStart(timezone)
```
- **Input**: `timezone` = "America/New_York"
- **Current UTC time**: Now
- **Operation**: Interpret current time in user's TZ, find start-of-day, convert to UTC
- **Output**: Date object like `2025-11-08T05:00:00Z` (EST midnight as UTC)
- **Used for**: Unique constraint query and streak calculations

#### Line 58: Database Query
```typescript
const existingRecord = await prisma.analytics.findUnique({
  where: {
    userId_date: {
      userId,
      date: todayDate,  // ✅ Normalized UTC date
    },
  },
})
```
- **Guarantees**: If user hasn't shipped today (in their timezone), record won't exist
- **Unique constraint**: (userId, date) prevents duplicate days
- **Important**: Date is already normalized, matches database format

#### Lines 102-127: Recalculate Streak

**Context**: Just upseerted today's first ship, now need to recalculate streak

```typescript
const analyticsRecords = await prisma.analytics.findMany({
  where: { userId },
  orderBy: { date: 'desc' },  // Newest first
  select: {
    date: true,
    shipCount: true,
  },
})

let currentStreak = 0
const today = todayDate  // Reuse the normalized date from line 51

for (let i = 0; i < analyticsRecords.length; i++) {
  const record = analyticsRecords[i]
  
  // LINE 116: Re-normalize DB dates
  const recordDate = getUserDayStart(timezone, record.date)
  
  // LINE 118: Calculate expected date for this iteration
  const expectedDate = subDays(today, currentStreak)
  
  // LINE 120: Compare dates
  const daysDiff = differenceInDays(expectedDate, recordDate)
  
  if (daysDiff === 0 && record.shipCount > 0) {
    currentStreak++
  } else if (daysDiff > 0) {
    break
  }
}
```

**Detailed Example**:
```typescript
// Scenario: User in EST with ships on Nov 6, 7, 8 (today)
// today = 2025-11-08T05:00:00Z (Nov 8 at midnight EST, expressed as UTC)

// Iteration 0:
// record.date = 2025-11-08T05:00:00Z (Nov 8)
// recordDate = getUserDayStart(tz, record.date) = 2025-11-08T05:00:00Z
// expectedDate = subDays(today, 0) = 2025-11-08T05:00:00Z
// daysDiff = differenceInDays(expectedDate, recordDate) = 0
// ✓ shipCount > 0, so currentStreak = 1

// Iteration 1:
// record.date = 2025-11-07T05:00:00Z (Nov 7)
// recordDate = getUserDayStart(tz, record.date) = 2025-11-07T05:00:00Z
// expectedDate = subDays(today, 1) = 2025-11-07T05:00:00Z
// daysDiff = differenceInDays(expectedDate, recordDate) = 0
// ✓ shipCount > 0, so currentStreak = 2

// Iteration 2:
// record.date = 2025-11-06T05:00:00Z (Nov 6)
// recordDate = getUserDayStart(tz, record.date) = 2025-11-06T05:00:00Z
// expectedDate = subDays(today, 2) = 2025-11-06T05:00:00Z
// daysDiff = differenceInDays(expectedDate, recordDate) = 0
// ✓ shipCount > 0, so currentStreak = 3

// Iteration 3:
// record.date = 2025-11-05T05:00:00Z (Nov 5)
// recordDate = getUserDayStart(tz, record.date) = 2025-11-05T05:00:00Z
// expectedDate = subDays(today, 3) = 2025-11-05T05:00:00Z
// daysDiff = differenceInDays(expectedDate, recordDate) = 0
// ✗ shipCount = 0, so we break
// Final: currentStreak = 3
```

#### Lines 139-153: Determine if Streak Extended (THE FIX)

```typescript
const yesterdayNormalized = subDays(today, 1)

const yesterdayRecord = await prisma.analytics.findUnique({
  where: {
    userId_date: {
      userId,
      date: yesterdayNormalized,  // ✅ Normalized date for yesterday
    },
  },
  select: {
    shipCount: true,
  },
})

const extendedStreak = isFirstShipToday && 
                       yesterdayRecord !== null && 
                       yesterdayRecord.shipCount > 0
```

**What This Checks**:
1. `isFirstShipToday`: This is the FIRST ship today (determined at line 63)
2. `yesterdayRecord !== null`: Yesterday had a record (any activity)
3. `yesterdayRecord.shipCount > 0`: Yesterday specifically had ships

**Why This Fix Works**:

Before the fix:
```typescript
const extendedStreak = isFirstShipToday && currentStreak > 0
// BUG: currentStreak was just recalculated
// After upserting today's first ship, currentStreak will always be >= 1
// So this is ALWAYS true on first ship!
```

After the fix:
```typescript
const extendedStreak = // Only true if:
  isFirstShipToday &&                    // This is the first ship today
  yesterdayRecord !== null &&            // Yesterday had activity
  yesterdayRecord.shipCount > 0          // Yesterday had actual ships

// Example cases:
// Case 1: First ship today, yesterday had ships → true (streak extended)
// Case 2: First ship today, yesterday no record → false (streak restarted)
// Case 3: First ship today, yesterday had no ships → false (gap detected)
```

---

### Streak Route (/src/app/api/analytics/streak/route.ts)

#### Line 60: Get Today's Date
```typescript
const today = getUserDayStart(timezone)
```
- Same pattern as ship route
- Used for both current streak and longest streak calculations

#### Lines 62-78: Calculate Current Streak
```typescript
let currentStreak = 0
const today = getUserDayStart(timezone)

for (let i = 0; i < analyticsRecords.length; i++) {
  const record = analyticsRecords[i]
  
  // Re-normalize DB date
  const recordDate = getUserDayStart(timezone, record.date)
  
  // Calculate expected date for this position in streak
  const expectedDate = subDays(today, currentStreak)
  
  // Count days difference
  const daysDiff = differenceInDays(expectedDate, recordDate)
  
  if (daysDiff === 0 && record.shipCount > 0) {
    currentStreak++
  } else if (daysDiff > 0) {
    break  // Gap found
  }
}
```

**Key Insight**: 
- Records are in descending order (newest first)
- We walk backward from today
- Any gap (daysDiff > 0) breaks the streak
- Empty days (daysDiff === 0 but shipCount === 0) also break it

#### Lines 85-114: Calculate Longest Streak
```typescript
let longestStreak = 0
let runningStreak = 0
let lastDate: Date | null = null

// Iterate in chronological order (oldest to newest)
for (const record of analyticsRecords.slice().reverse()) {
  const recordDate = getUserDayStart(timezone, record.date)
  
  if (record.shipCount > 0) {
    if (lastDate === null) {
      // First record with ships
      runningStreak = 1
    } else {
      const daysDiff = differenceInDays(recordDate, lastDate)
      if (daysDiff === 1) {
        // Consecutive day with ships
        runningStreak++
      } else {
        // Gap found, restart
        runningStreak = 1
      }
    }
    
    lastDate = recordDate
    longestStreak = Math.max(longestStreak, runningStreak)
  } else if (lastDate !== null) {
    // Day with no ships
    const daysDiff = differenceInDays(recordDate, lastDate)
    if (daysDiff === 1) {
      // Consecutive day but no ships, breaks streak
      runningStreak = 0
      lastDate = recordDate
    }
  }
}
```

**Example**:
```typescript
// Records (oldest to newest): Nov 5 (0 ships), Nov 6 (1 ship), Nov 7 (1 ship), Nov 8 (1 ship), Nov 10 (1 ship)
// Expected longest: 2 (Nov 6-7), then gap, then 1 (Nov 10)

// Iteration 1 (Nov 5, 0 ships):
// Skip, lastDate = null

// Iteration 2 (Nov 6, 1 ship):
// First with ships, runningStreak = 1, lastDate = Nov 6

// Iteration 3 (Nov 7, 1 ship):
// daysDiff = differenceInDays(Nov 7, Nov 6) = 1
// Consecutive, runningStreak = 2, longestStreak = 2

// Iteration 4 (Nov 8, 1 ship):
// daysDiff = differenceInDays(Nov 8, Nov 7) = 1
// Consecutive, runningStreak = 3, longestStreak = 3

// Iteration 5 (Nov 10, 1 ship):
// daysDiff = differenceInDays(Nov 10, Nov 8) = 2
// Gap found! runningStreak = 1, longestStreak stays 3

// Result: longestStreak = 3
```

#### Line 118: Return Last Ship Date (POTENTIAL ISSUE)
```typescript
const lastShipRecord = analyticsRecords.find((record) => record.shipCount > 0)
const lastShipDate = lastShipRecord ? lastShipRecord.date : undefined

return apiResponse({
  currentStreak,
  longestStreak,
  lastShipDate,  // ⚠️ Raw UTC date
})
```

**The Problem**:
```typescript
// Database stores: 2025-11-08T05:00:00Z
// This represents: "November 8 at midnight EST"
// But when sent as JSON and displayed:
// "2025-11-08T05:00:00Z" → interpreted as "5am UTC on November 8"
// Frontend may show wrong date if it does naive conversion
```

---

### Weekly Route (/src/app/api/analytics/weekly/route.ts)

#### Lines 45-46: Date Range Calculation
```typescript
const today = getUserDayStart(timezone)  // Nov 8, 2025 at midnight EST
const startDate = subDays(today, 6)       // Nov 2, 2025 at midnight EST
```

**Result**: 7 days of range from Nov 2-8 inclusive

#### Lines 49-62: Database Query
```typescript
const analyticsRecords = await prisma.analytics.findMany({
  where: {
    userId,
    date: {
      gte: startDate,  // >= Nov 2 at midnight EST
      lte: today,      // <= Nov 8 at midnight EST
    },
  },
  orderBy: { date: 'asc' },  // Oldest to newest
  select: {
    date: true,
    shipCount: true,
  },
})
```

**Guarantee**: Returns all records in user's timezone range, in order

#### Lines 64-69: Build Map with Timezone-Aware Keys
```typescript
const recordMap = new Map<string, number>()

analyticsRecords.forEach((record) => {
  // FORMAT using user's timezone
  const dateKey = formatUserDate(record.date, timezone, 'yyyy-MM-dd')
  // Example: record.date = 2025-11-08T05:00:00Z
  //         dateKey = "2025-11-08" (the day in user's timezone)
  recordMap.set(dateKey, record.shipCount)
})
```

**Why This Works**:
- `formatUserDate()` interprets the UTC date in user's timezone
- Result is a string like `"2025-11-08"`
- This matches the key format used later in the loop

#### Lines 72-84: Build 7-Day Array
```typescript
const weeklyData: DailyShipData[] = []

for (let i = 6; i >= 0; i--) {  // Start with 6 days ago
  const date = subDays(today, i)  // 2025-11-02, 2025-11-03, ..., 2025-11-08
  
  // FORMAT for lookup
  const dateKey = formatUserDate(date, timezone, 'yyyy-MM-dd')
  // Example: date = 2025-11-02T05:00:00Z (Nov 2 at midnight EST as UTC)
  //         dateKey = "2025-11-02"
  
  const shipCount = recordMap.get(dateKey) || 0  // Lookup or default to 0
  
  // FORMAT for display
  const dayOfWeek = formatUserDate(date, timezone, 'EEE')
  // Example: dayOfWeek = "Fri" (Friday in EST)
  
  weeklyData.push({
    date: date.toISOString(),        // ⚠️ "2025-11-02T05:00:00Z"
    shipCount,
    dayOfWeek,
  })
}
```

**The Map Lookup Strategy** (Example):
```typescript
// DB has record: date = 2025-11-06T05:00:00Z, shipCount = 2
// recordMap.set("2025-11-06", 2)

// Loop iteration for Nov 6:
// date = subDays(today, 2) = 2025-11-06T05:00:00Z
// dateKey = formatUserDate(date, "America/New_York", "yyyy-MM-dd")
//        = "2025-11-06"
// recordMap.get("2025-11-06") = 2
// ✓ Match! Returns correct ship count
```

**The Return Format Issue**:
```typescript
date: date.toISOString()
// Returns: "2025-11-08T05:00:00Z"
// Represents: "November 8 at midnight EST" but expressed as UTC
// Frontend receives ISO string and may misinterpret the time
```

---

## The `getUserDayStart()` Function

```typescript
export function getUserDayStart(timezone: string, referenceDate: Date = new Date()): Date {
  return DateTime.fromJSDate(referenceDate, { zone: 'utc' })
    .setZone(timezone)
    .startOf('day')
    .toUTC()
    .toJSDate()
}
```

**Step-by-step breakdown**:

```typescript
// Input: timezone = "America/New_York", referenceDate = 2025-11-09T04:00:00Z (4am UTC)

// Step 1: Interpret the date as UTC
DateTime.fromJSDate(referenceDate, { zone: 'utc' })
// Result: 2025-11-09T04:00:00Z (4am UTC)

// Step 2: Convert to user's timezone
.setZone(timezone)
// Result: 2025-11-08T23:00:00-05:00 (11pm EST on Nov 8)

// Step 3: Get the start of that day
.startOf('day')
// Result: 2025-11-08T00:00:00-05:00 (midnight EST on Nov 8)

// Step 4: Convert back to UTC
.toUTC()
// Result: 2025-11-08T05:00:00Z (midnight EST expressed as UTC)

// Step 5: Return as JavaScript Date
.toJSDate()
// Result: Date object representing 2025-11-08T05:00:00Z
```

**Key Property**: IDEMPOTENT
```typescript
// If you call it twice on an already-normalized date:
const normalized1 = getUserDayStart("America/New_York", 2025-11-08T05:00:00Z)
// Result: 2025-11-08T05:00:00Z (Nov 8 at midnight EST as UTC)

const normalized2 = getUserDayStart("America/New_York", normalized1)
// Step 1: Interpret 2025-11-08T05:00:00Z as UTC
// Step 2: Set to EST → 2025-11-08T00:00:00-05:00 (midnight EST)
// Step 3: Start of day → 2025-11-08T00:00:00-05:00 (already midnight)
// Step 4: Back to UTC → 2025-11-08T05:00:00Z
// Result: 2025-11-08T05:00:00Z (same as input!)
```

This is why re-normalization at line 116 (Ship) and line 64 (Streak) is safe but redundant.

---

## Summary Comparison

### Database Format vs. Return Format

| Aspect | Database | Return to Frontend |
|--------|----------|-------------------|
| **Ship date storage** | `2025-11-08T05:00:00Z` (Nov 8 midnight EST as UTC) | Not returned |
| **Streak lastShipDate** | `2025-11-08T05:00:00Z` | `"2025-11-08T05:00:00Z"` ⚠️ Raw ISO |
| **Weekly date** | `2025-11-08T05:00:00Z` | `"2025-11-08T05:00:00Z"` ⚠️ Raw ISO |
| **Weekly dayOfWeek** | N/A | `"Fri"` ✅ Clear |
| **Interpretation** | "User's midnight, expressed as UTC" | May be misinterpreted as "5am UTC" |

---

## Testing These Scenarios

### Test Case 1: Basic Normalization
```typescript
// User in EST (UTC-5), it's Nov 8, 2025 at 11pm EST locally = Nov 9 4am UTC
const result = getUserDayStart('America/New_York', new Date('2025-11-09T04:00:00Z'))
// Expected: 2025-11-08T05:00:00Z (Nov 8 midnight EST as UTC)
```

### Test Case 2: Streak Continuation
```typescript
// User has ships on Nov 6, 7, 8 in EST
// Should have currentStreak = 3
```

### Test Case 3: Timezone Boundary
```typescript
// User in UTC+8, ships at 11:59pm Dec 31 (next second is UTC Jan 1)
// Should log as Dec 31, not Jan 1
```

### Test Case 4: Multiple Timezones
```typescript
// Same UTC moment, different users:
// User A in EST: sees Nov 8
// User B in PST: sees Nov 7
// Should get different analytics records
```
