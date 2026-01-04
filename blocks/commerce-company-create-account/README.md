# Commerce Company Create Account Block

## Overview

The Commerce Company Create Account block provides company account registration functionality with a two-step process: company information collection and super user (company admin) account creation. It requires company features to be enabled and handles the complete company registration workflow.

## Integration

### Block Configuration

No block configuration is read via `readBlockConfig()`.

### URL Parameters

No URL parameters directly affect this block's behavior.

### Local Storage

- `companyAccountData`: Stores company information form data during the registration process
- `pendingCompanyData`: Stores company data if company creation needs to be deferred until after authentication

### Events

#### Event Listeners

No direct event listeners are implemented in this block.

#### Event Emitters

No events are emitted by this block.

## Behavior Patterns

### Page Context Detection

- **Authenticated Users**: When user is already authenticated, redirects to customer account page
- **Company Features Disabled**: When company features are not enabled, redirects to login page
- **Unauthenticated Users with Company Enabled**: When user is not authenticated and company features are enabled, renders company registration forms

### User Interaction Flows

1. **Authentication Check**: Block first verifies user authentication status
2. **Company Feature Check**: Verifies if company features are enabled for the store
3. **Redirect Flow**: If authenticated or company features disabled, redirects appropriately
4. **Company Information Form**: User fills out company details including:
   - Company name, email, legal name
   - VAT/Tax ID, Reseller ID
   - Legal address (street, city, country, region, postal code, phone)
5. **Form Validation**: Validates required fields before allowing progression
6. **Super User Form**: After company information is collected, user creates admin account using SignUp container
7. **Company Creation**: After successful signup, attempts to create company with collected data
8. **Success Redirect**: After successful registration, redirects to account page

### Form Sections

#### Company Information Form
- **Company Details**: Name, email, legal name, VAT/Tax ID, Reseller ID
- **Legal Address**: Complete address information with country/region selection
- **Validation**: Required fields are validated before allowing progression
- **Data Persistence**: Form data is stored in sessionStorage for retrieval

#### Super User (Admin) Form
- **User Account Creation**: Uses SignUp container from storefront-auth
- **Company Data Integration**: Pre-fills company name if available
- **Privacy Policy Consent**: Includes privacy policy consent slot
- **Email Confirmation**: Handles email confirmation flow
- **Company Association**: Attempts to create company after successful signup

### Error Handling

- **Authentication Errors**: If user is already authenticated, automatically redirects to account page
- **Company Feature Errors**: If company features are not enabled, redirects to login page
- **Form Validation Errors**: HTML5 validation prevents submission of invalid forms
- **Company Creation Errors**: Errors are logged and company data is stored for later creation
- **Configuration Errors**: No configuration errors possible as block uses hardcoded values
- **Fallback Behavior**: Falls back to login redirect if company features are disabled

## Features

- Two-step registration process (Company Info → Super User)
- Tab-based navigation between forms
- Country and region selection with dynamic loading
- Form data persistence using sessionStorage
- Integration with storefront-auth SignUp container
- Company data submission after user authentication
- Responsive design for mobile and desktop

## Technical Details

### Dependencies

- `@dropins/storefront-auth`: For user account creation
- `@dropins/storefront-company-management`: For company features and data management
- `@dropins/tools`: For UI components (ToggleButton)

### Data Flow

1. User fills company information form
2. Data stored in `sessionStorage.companyAccountData`
3. User creates super user account via SignUp
4. On successful signup, `createCompanyAccount()` is called
5. Company data is submitted using `updateCompany` API
6. Session storage is cleared on success

### Notes

- Company creation may require the user to be authenticated first
- If company creation fails, data is stored in `pendingCompanyData` for retry
- The `updateCompany` API is used for company creation (backend handles new vs update)
- Country/region data is loaded dynamically from company-management API

