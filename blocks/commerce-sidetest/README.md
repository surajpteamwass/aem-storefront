# Commerce Sidetest Block

## Overview

The Commerce Sidetest block is a simple authentication guard block that checks if a user is authenticated and redirects unauthenticated users to the login page. This block is used for testing authentication flows and protecting pages that require user authentication.

## Integration

### Block Configuration

This block does not require any configuration parameters.

### URL Parameters

No URL parameters affect this block's behavior.

### Local Storage

No localStorage keys are used by this block.

### Events

This block does not emit or listen to any custom events.

## Behavior Patterns

### Page Context Detection

- **Authenticated Users**: When user is authenticated, block allows page to continue loading normally
- **Unauthenticated Users**: When user is not authenticated, block immediately redirects to the customer login page

### User Interaction Flows

1. **Page Load**: Block checks authentication status on page load
2. **Authentication Check**: Uses `checkIsAuthenticated()` to verify user authentication state
3. **Redirect**: If not authenticated, redirects to login page using `CUSTOMER_LOGIN_PATH`
4. **Console Logging**: Logs block name to console for debugging purposes

### Error Handling

- **Authentication Check**: Relies on `checkIsAuthenticated()` function for authentication verification
- **Redirect Handling**: Uses `window.location.href` for immediate redirect to login page
- **Fallback Behavior**: No fallback - redirect is immediate and blocking

