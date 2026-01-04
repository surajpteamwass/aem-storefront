# Commerce Company Profile Block

## Overview

The Commerce Company Profile block provides company information management functionality using the @dropins/storefront-company-management CompanyProfile container. It requires user authentication and company features to be enabled. Unauthenticated users are redirected to the login page, and authenticated users without company access are redirected to the account page.

## Integration

### Block Configuration

No block configuration is read via `readBlockConfig()`.

### URL Parameters

No URL parameters directly affect this block's behavior.

### Local Storage

No localStorage keys are used by this block.

### Events

#### Event Listeners

No direct event listeners are implemented in this block.

#### Event Emitters

No events are emitted by this block.

## Behavior Patterns

### Page Context Detection

- **Unauthenticated Users**: When user is not authenticated, redirects to login page
- **Company Features Disabled**: When company features are not enabled, redirects to account page
- **Authenticated Users with Company Access**: When user is authenticated and company features are enabled, renders company profile management interface

### User Interaction Flows

1. **Authentication Check**: Block first verifies user authentication status
2. **Redirect Flow (Unauthenticated)**: If not authenticated, redirects to login page
3. **Company Feature Check**: Verifies if company features are enabled for the store
4. **Redirect Flow (Company Disabled)**: If company features are disabled, redirects to account page
5. **Company Profile Management**: If authenticated and company features are enabled, renders company profile management interface
6. **Data Updates**: Users can view and update their company information including:
   - Company name, email, legal name
   - VAT tax ID, reseller ID
   - Legal address
   - Company admin and sales representative information
   - Available payment and shipping methods

### Error Handling

- **Authentication Errors**: If user is not authenticated, automatically redirects to login page
- **Company Feature Errors**: If company features are not enabled, redirects to account page
- **Container Errors**: If the CompanyProfile container fails to render, the block content remains empty
- **Data Errors**: If company data is missing or invalid, the container handles appropriate fallback display
- **Configuration Errors**: No configuration errors possible as block uses default configuration
- **Fallback Behavior**: Falls back to login page redirect if not authenticated, or account page if company features are disabled

## Features

- Company profile display and editing
- Permission-based access control
- Legal address management
- Company contact information display
- Payment and shipping methods display
- Email validation
- Country/region selection

