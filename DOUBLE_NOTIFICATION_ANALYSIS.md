# Double Notification Analysis

## Issue: Potential Double Notifications on Booking

### Scenario That Causes Problem

**When user logs in during booking + then completes booking:**

```
1. User fills booking form (not logged in)
2. Clicks "Submit" → chooses "Login" mode
3. handleSubmit() → calls login()
   ↓
4. useLogin mutation succeeds
5. onSuccess triggers handleSuccess("Login successful!") 
   ↓ 🔴 TOAST #1: "Login successful!" appears
6. Code continues to await createBooking()
   ↓
7. createBooking() succeeds
8. setShowSuccess(true)
   ↓ 🔴 NOTIFICATION #2: Success modal appears
```

**Result**: User sees TWO notifications:
- Toast: "Login successful!"  
- Modal: Success confirmation (separate UI)

This is confusing because they see login feedback when they expect to see booking feedback.

---

## Root Cause

When login happens **within** the booking flow (not as a standalone action), the `handleSuccess("Login successful!")` in [useLogin.ts](features/authentication/hooks/useLogin.ts#L51) is inappropriate—it advertises a login that's just an intermediate step, not the user's intended action.

---

## Solution: Suppress Login Toast During Booking

**Fix**: Add a flag to suppress the login success toast when login is triggered from within BookingForm.

### Option 1: Add `skipNotification` to login hook (recommended)

**File**: [features/authentication/hooks/useLogin.ts](features/authentication/hooks/useLogin.ts)

```ts
export const useLogin = (skipNotification: boolean = false) => {
  // ...
  onSuccess: (response, variables) => {
    // ... existing code ...
    
    // Only show notification if NOT triggered from BookingForm
    if (!skipNotification) {
      handleSuccess("Login successful!");
    }
    
    // ... redirect logic ...
  },
  // ...
}
```

**File**: [features/booking/BookingForm.tsx](features/booking/BookingForm.tsx)

```ts
const { login } = useLogin(true); // ← Pass true to skip notification

// Then in handleSubmit:
if (!isCustomerLoggedIn && mode === "login") {
  // ... existing login code ...
  const loginResponse = await login({...});
  
  // Don't redirect—just continue to booking
  const { accessToken, user, businessId } = loginResponse.data || {};
  if (!accessToken || !user) {
    setSubmitError("Login failed. Please try again.");
    return;
  }
  
  const additionalData: Record<string, string> = {};
  if (businessSlug) additionalData.businessSiteSlug = businessSlug;
  if (businessId) additionalData.businessId = businessId;
  setSession("Customer", accessToken, user, additionalData);
  activeUserId = user.id;
}
```

### Why This Fix Works

- ✅ Login during booking doesn't distract with a success toast
- ✅ User only sees the booking confirmation (modal)
- ✅ If user logs in from login page, they still see "Login successful!"
- ✅ No breaking changes to standalone login flow

---

## Alternative: Use onSuccess Callback Instead  

**Less invasive**: Pass an `onSuccess` callback instead of hardcoding the notification:

```ts
export const useLogin = () => {
  const { handleSuccess, handleError } = useApiResponse();
  // ...
  onSuccess: (response, variables) => {
    // ... existing code ...
    if (handleSuccessCallback) {
      handleSuccessCallback(response);  // Let caller decide
    } else {
      handleSuccess("Login successful!");  // Default notification
    }
  },
};

// In BookingForm:
const { login } = useLogin();
await login({...}, { onSuccess: () => {/* no notification */} });
```

---

## Current Behavior (Before Fix)

| Scenario | Notifications |
|----------|---|
| User logs in from login page | ✅ 1 toast: "Login successful!" |
| **User logs in during booking** | ❌ 2 toasts: "Login successful!" + success modal |

## After Fix

| Scenario | Notifications |
|----------|---|
| User logs in from login page | ✅ 1 toast: "Login successful!" |
| User logs in during booking | ✅ 1 modal: Booking success only |

---

## Files to Review

- [features/authentication/hooks/useLogin.ts](features/authentication/hooks/useLogin.ts) — Add `skipNotification` parameter
- [features/booking/BookingForm.tsx](features/booking/BookingForm.tsx) — Pass `true` when calling login

## Acceptance Test

```ts
// Test 1: Login from login page → shows "Login successful!"
Navigate to /auth/login/customer
Enter credentials
✅ See toast: "Login successful!"

// Test 2: Login during booking → shows ONLY booking success
Open business site
Start booking (not logged in)
Choose "Login and Book"
Enter credentials + submit
✅ See: only the success modal (NO "Login successful!" toast)

// Test 3: Direct booking (already logged in) → shows booking success
Login first
Start booking
Submit
✅ See: only the success modal
```

---

## Summary

The double notification happens when:
1. User logs in **as part of booking** → shows "Login successful!" toast
2. Then booking succeeds → shows success modal

**Fix**: Don't show "Login successful!" toast when login is triggered from BookingForm.

**Recommendation**: Use Option 1 (skipNotification flag) for cleaner code and explicit intent.
