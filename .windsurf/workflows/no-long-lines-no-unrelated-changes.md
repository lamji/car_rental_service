---
description: Strict rules for code organization - avoid long functions and don't touch unrelated code
---

# Code Organization Rules

## 1. No Long Functions - Always Split into Helpers
- **Maximum function length**: 20-30 lines
- **Always split complex logic** into smaller helper functions
- **Each function should do ONE thing** clearly
- **Easier debugging**: Isolate issues to specific helpers
- **Better scaling**: Modify individual helpers without affecting others

## 2. Don't Touch Unrelated Code
- **Only modify what's necessary** for the specific task
- **No side effects** in unrelated functions
- **Preserve existing behavior** of untouched code
- **Create new helpers** instead of modifying existing complex functions

## 3. Function Splitting Guidelines
- **Extract validation logic** to separate helpers
- **Extract data transformation** to separate helpers
- **Extract complex calculations** to separate helpers
- **Extract error handling** to separate helpers
- **Use descriptive names** that explain what the helper does

## 4. Examples

### ❌ Bad - Long function doing multiple things
```typescript
// DON'T: Long function with mixed responsibilities
function processBooking(data) {
  // Validation logic (20 lines)
  if (!data.startDate) return false;
  if (!data.endDate) return false;
  // ... more validation ...
  
  // Data transformation (15 lines)
  const transformed = {
    start: new Date(data.startDate),
    end: new Date(data.endDate),
    // ... more transformation ...
  };
  
  // API call (10 lines)
  return fetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(transformed)
  });
}
```

### ✅ Good - Split into focused helpers
```typescript
// DO: Split into small, focused functions
function validateBookingData(data) {
  if (!data.startDate) return false;
  if (!data.endDate) return false;
  return true;
}

function transformBookingData(data) {
  return {
    start: new Date(data.startDate),
    end: new Date(data.endDate)
  };
}

function saveBooking(transformedData) {
  return fetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(transformedData)
  });
}

// Main function becomes simple and clear
function processBooking(data) {
  if (!validateBookingData(data)) return false;
  
  const transformed = transformBookingData(data);
  return saveBooking(transformed);
}
```

### ❌ Bad - Touching unrelated code
```typescript
// DON'T: Modify unrelated functions while fixing a specific issue
function fixEndDateValidation() {
  // ... fix logic ...
}

function unrelatedFunction() {
  // DON'T: Add unrelated changes here
  console.log('Unrelated change');
}
```

### ✅ Good - Create new helper, leave existing untouched
```typescript
// DO: Create new helper for the specific fix
function validateEndDateWithBookings(endDate, bookings) {
  // ... specific validation logic ...
}

// Existing function stays unchanged
function existingValidation() {
  // Original code untouched
}
```

## 5. Benefits of Small Functions
- **Easier debugging**: Pinpoint issues to specific helpers
- **Better testing**: Test each helper independently
- **Reusable logic**: Use helpers in multiple places
- **Clearer code**: Each function has one clear purpose
- **Easier scaling**: Modify individual helpers without side effects

## 6. Before Making Changes
1. **Identify the exact problem** to solve
2. **Find the smallest function** that needs modification
3. **If function is >20 lines**, split it into helpers first
4. **Create new helpers** for new logic instead of expanding existing functions
5. **Test each helper individually**

## 7. Code Review Checklist
- [ ] Functions are under 20-30 lines
- [ ] Each function has single responsibility
- [ ] Complex logic is extracted to helpers
- [ ] Helper names clearly describe their purpose
- [ ] No unrelated code was modified
- [ ] New logic is in separate helpers
