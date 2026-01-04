import { checkIsCompanyEnabled } from '@dropins/storefront-company-management/api.js';
import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_LOGIN_PATH,
  checkIsAuthenticated,
  authPrivacyPolicyConsentSlot,
  rootLink,
} from '../../scripts/commerce.js';

// Initialize
import '../../scripts/initializers/auth.js';
import '../../scripts/initializers/company-management.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
    return;
  }

  // Check if company features are enabled
  const { companyEnabled } = await checkIsCompanyEnabled();
  if (!companyEnabled) {
    window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
    return;
  }

  // Create container structure
  block.classList.add('commerce-company-create-account-container');
  block.innerHTML = `
    <div class="company-create-account-header">
      <h2>Create Company Account</h2>
    </div>
    <div class="company-create-account-content">
      <div class="company-account-form-section"></div>
    </div>
  `;

  const $formSection = block.querySelector('.company-account-form-section');

  try {
    // Render complete form with both company and admin fields
    await renderCompleteForm($formSection);
  } catch (error) {
    console.error('Error rendering company create account form:', error);
    // Show error message to user
    block.innerHTML = `
      <div class="error-message">
        <h2>Create Company Account</h2>
        <p>An error occurred while loading the form. Please refresh the page or contact support.</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}

async function renderCompleteForm(container) {
  if (!container) {
    console.error('Container element not found for form');
    return;
  }

  // Ensure container is visible
  container.style.display = 'block';
  container.removeAttribute('hidden');

  // Create complete form structure with both company and admin fields
  container.innerHTML = `
    <form id="company-account-form" class="company-account-form">
      <div class="form-section">
        <h3>Company Details</h3>
        <div class="form-field">
          <label for="company-name">Company Name <span class="required">*</span></label>
          <input type="text" id="company-name" name="companyName" required />
        </div>
        <div class="form-field">
          <label for="company-email">Company Email <span class="required">*</span></label>
          <input type="email" id="company-email" name="companyEmail" required />
        </div>
        <div class="form-field">
          <label for="legal-name">Legal Name</label>
          <input type="text" id="legal-name" name="legalName" />
        </div>
        <div class="form-field">
          <label for="vat-tax-id">VAT/Tax ID</label>
          <input type="text" id="vat-tax-id" name="vatTaxId" />
        </div>
        <div class="form-field">
          <label for="reseller-id">Reseller ID</label>
          <input type="text" id="reseller-id" name="resellerId" />
        </div>
      </div>
      <div class="form-section">
        <h3>Legal Address</h3>
        <div class="form-field">
          <label for="street-address">Street Address <span class="required">*</span></label>
          <input type="text" id="street-address" name="street" required />
        </div>
        <div class="form-field">
          <label for="street-address-2">Street Address 2</label>
          <input type="text" id="street-address-2" name="street2" />
        </div>
        <div class="form-field">
          <label for="city">City <span class="required">*</span></label>
          <input type="text" id="city" name="city" required />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="country">Country <span class="required">*</span></label>
            <select id="country" name="countryCode" required>
              <option value="">Select Country</option>
            </select>
          </div>
          <div class="form-field">
            <label for="region">State/Province</label>
            <select id="region" name="regionCode">
              <option value="">Select State/Province</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="postcode">ZIP/Postal Code <span class="required">*</span></label>
            <input type="text" id="postcode" name="postcode" required />
          </div>
          <div class="form-field">
            <label for="telephone">Phone Number</label>
            <input type="tel" id="telephone" name="telephone" />
          </div>
        </div>
      </div>
      <div class="form-section">
        <h3>Company Administrator</h3>
        <div class="form-field">
          <label for="job-title">Job Title</label>
          <input type="text" id="job-title" name="jobTitle" />
        </div>
        <div class="form-field">
          <label for="work-phone">Work Phone Number</label>
          <input type="tel" id="work-phone" name="workPhone" />
        </div>
        <div class="form-field">
          <label for="admin-email">Email <span class="required">*</span></label>
          <input type="email" id="admin-email" name="adminEmail" required />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="admin-firstname">First Name <span class="required">*</span></label>
            <input type="text" id="admin-firstname" name="adminFirstname" required />
          </div>
          <div class="form-field">
            <label for="admin-lastname">Last Name <span class="required">*</span></label>
            <input type="text" id="admin-lastname" name="adminLastname" required />
          </div>
        </div>
        <div class="form-field">
          <label for="admin-gender">Gender</label>
          <select id="admin-gender" name="adminGender">
            <option value="">Please select</option>
            <option value="1">Male</option>
            <option value="2">Female</option>
            <option value="3">Not Specified</option>
          </select>
        </div>
        <div class="form-field">
          <label for="admin-password">Password <span class="required">*</span></label>
          <input type="password" id="admin-password" name="adminPassword" required />
        </div>
        <div class="form-field">
          <label for="admin-password-confirm">Confirm Password <span class="required">*</span></label>
          <input type="password" id="admin-password-confirm" name="adminPasswordConfirm" required />
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary">Create Account</button>
      </div>
    </form>
  `;

  // Load countries
  try {
    const { getCountries } = await import('@dropins/storefront-company-management/api.js');
    const countriesData = await getCountries();
    const countrySelect = container.querySelector('#country');

    if (countriesData?.availableCountries && countrySelect) {
      countriesData.availableCountries.forEach((country) => {
        const option = document.createElement('option');
        option.value = country.value;
        option.textContent = country.text;
        countrySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to load countries:', error);
    const errorMsg = container.querySelector('.error-message') || document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = 'Failed to load countries. Please refresh the page.';
    const form = container.querySelector('#company-account-form');
    if (form && !container.querySelector('.error-message')) {
      form.insertBefore(errorMsg, form.firstChild);
    }
  }

  // Handle country change to load regions
  const countrySelect = container.querySelector('#country');
  if (countrySelect) {
    countrySelect.addEventListener('change', async (e) => {
      const countryCode = e.target.value;
      const regionSelect = container.querySelector('#region');
      
      if (regionSelect) {
        regionSelect.innerHTML = '<option value="">Select State/Province</option>';
      }

      if (countryCode) {
        try {
          const { getCountries } = await import('@dropins/storefront-company-management/api.js');
          const countriesData = await getCountries();
          const selectedCountry = countriesData?.availableCountries?.find(
            (c) => c.value === countryCode,
          );

          if (selectedCountry?.availableRegions && regionSelect) {
            selectedCountry.availableRegions.forEach((region) => {
              const option = document.createElement('option');
              option.value = region.code;
              option.textContent = region.name;
              regionSelect.appendChild(option);
            });
          }
        } catch (error) {
          console.error('Failed to load regions:', error);
        }
      }
    });
  }


  // Handle form submission
  const form = container.querySelector('#company-account-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Remove any existing error messages
      const existingError = container.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const allData = Object.fromEntries(formData);

      // Validate password match
      if (allData.adminPassword !== allData.adminPasswordConfirm) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'Passwords do not match.';
        form.insertBefore(errorMsg, form.firstChild);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // Validate password strength (minimum 8 characters)
      if (allData.adminPassword.length < 8) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'Password must be at least 8 characters long.';
        form.insertBefore(errorMsg, form.firstChild);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // Disable submit button and show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton?.textContent;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
      }

      // Store in sessionStorage
      sessionStorage.setItem('companyAccountData', JSON.stringify(allData));

      // Create user account and company
      try {
        await createCompanyWithAdmin(allData);
        // Redirect to account page on success
        window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
      } catch (error) {
        console.error('Failed to create company account:', error);
        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
        // Show error message to user
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = error.message || 'Failed to create account. Please check your information and try again.';
        form.insertBefore(errorMsg, form.firstChild);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}


async function createCompanyWithAdmin(allData) {
  // First, create the customer account using createCustomer API
  // Then create the company with admin information
  
  const { createCustomer } = await import('@dropins/storefront-auth/api.js');

  // Create customer account
  const customerData = {
    firstname: allData.adminFirstname,
    lastname: allData.adminLastname,
    email: allData.adminEmail,
    password: allData.adminPassword,
    custom_attributes: [
      ...(allData.companyName ? [{ attribute_code: 'company', value: allData.companyName }] : []),
      ...(allData.jobTitle ? [{ attribute_code: 'job_title', value: allData.jobTitle }] : []),
      ...(allData.adminGender ? [{ attribute_code: 'gender', value: allData.adminGender }] : []),
    ],
  };

  try {
    // Create customer account (this will also authenticate the user)
    // Company should be created automatically if company extension attributes are configured
    await createCustomer(customerData, true); // Use API v2

    // Wait a bit for authentication to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Try to create/update company with admin details
    try {
      await createCompanyAccount(allData, allData.adminEmail);
      console.log('Company created successfully');
    } catch (companyError) {
      console.error('Company creation/update failed:', companyError);
      console.error('Error details:', {
        message: companyError.message,
        errors: companyError.errors,
        stack: companyError.stack,
      });

      // Store company data for later retry
      const companyPayload = {
        name: allData.companyName,
        email: allData.companyEmail || allData.adminEmail,
        legalName: allData.legalName || '',
        vatTaxId: allData.vatTaxId || '',
        resellerId: allData.resellerId || '',
        legalAddress: {
          street: [allData.street, allData.street2].filter(Boolean),
          city: allData.city,
          countryCode: allData.countryCode,
          postcode: allData.postcode,
          telephone: allData.telephone || '',
          ...(allData.regionCode && {
            region: {
              regionCode: allData.regionCode,
            },
          }),
        },
        companyAdmin: {
          firstname: allData.adminFirstname || '',
          lastname: allData.adminLastname || '',
          email: allData.adminEmail || allData.adminEmail,
          jobTitle: allData.jobTitle || '',
        },
      };
      sessionStorage.setItem('pendingCompanyData', JSON.stringify(companyPayload));

      // Check if error is due to GraphQL fragment issues
      const isFragmentError = companyError.message && (
        companyError.message.includes('available_payment_methods') ||
        companyError.message.includes('available_shipping_methods')
      );

      if (isFragmentError) {
        // The mutation might have succeeded on the backend but failed to parse response
        // Let's verify if company was actually created
        try {
          const { getCompany } = await import('@dropins/storefront-company-management/api.js');
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a bit more
          const company = await getCompany();
          if (company && company.name === allData.companyName) {
            console.log('Company was created successfully despite GraphQL fragment error');
            sessionStorage.removeItem('companyAccountData');
            return; // Success, exit early
          } else {
            console.warn('Company not found after creation attempt');
            // Company wasn't created, but we'll continue and let user know
            throw new Error('Company creation encountered an issue. Your account was created successfully. Please complete company setup from your account page.');
          }
        } catch (verifyError) {
          console.error('Could not verify company creation:', verifyError);
          // If verification fails, assume company wasn't created
          throw new Error('Company creation encountered an issue. Your account was created successfully. Please complete company setup from your account page.');
        }
      } else {
        // For other errors, show to user
        throw new Error(`Company creation failed: ${companyError.message || 'Unknown error'}. Your account was created but company setup is incomplete. Please contact support.`);
      }
    }

    sessionStorage.removeItem('companyAccountData');
    return true;
  } catch (error) {
    console.error('Error creating customer account:', error);
    // Provide more user-friendly error messages
    if (error.message) {
      throw new Error(error.message);
    } else if (error.errors && Array.isArray(error.errors)) {
      const errorMessages = error.errors.map((e) => e.message || e).join(', ');
      throw new Error(errorMessages);
    } else {
      throw new Error('Failed to create account. Please try again.');
    }
  }
}

async function createCompanyAccount(allData, adminEmail) {
  // Note: Company creation typically happens through customer signup
  // with company extension attributes. This function prepares the company data
  // for submission. The actual company creation may be handled by the backend
  // during customer registration

  const { updateCompany, getCompany } = await import('@dropins/storefront-company-management/api.js');

  const companyPayload = {
    name: allData.companyName,
    email: allData.companyEmail || adminEmail,
    legalName: allData.legalName || '',
    vatTaxId: allData.vatTaxId || '',
    resellerId: allData.resellerId || '',
    legalAddress: {
      street: [allData.street, allData.street2].filter(Boolean),
      city: allData.city,
      countryCode: allData.countryCode,
      postcode: allData.postcode,
      telephone: allData.telephone || '',
      ...(allData.regionCode && {
        region: {
          regionCode: allData.regionCode,
        },
      }),
    },
    companyAdmin: {
      firstname: allData.adminFirstname || '',
      lastname: allData.adminLastname || '',
      email: allData.adminEmail || adminEmail,
      jobTitle: allData.jobTitle || '',
    },
  };

  try {
    // Attempt to update/create company after user is authenticated
    // This may require the user to be logged in first
    await updateCompany(companyPayload);
    console.log('Company created/updated successfully');
    sessionStorage.removeItem('companyAccountData');
    return true;
  } catch (error) {
    console.error('Error creating company:', error);
    
    // Check if error is due to GraphQL fragment issues (available_payment_methods, available_shipping_methods)
    const isFragmentError = error.message && (
      error.message.includes('available_payment_methods') ||
      error.message.includes('available_shipping_methods')
    );

    if (isFragmentError) {
      // The mutation might have succeeded on the backend but failed to parse response
      // Let's verify if company was actually created
      try {
        const company = await getCompany();
        if (company && company.name === allData.companyName) {
          console.log('Company was created successfully despite GraphQL fragment error');
          sessionStorage.removeItem('companyAccountData');
          return true;
        }
      } catch (getError) {
        console.warn('Could not verify company creation:', getError);
      }
    }

    // Store company data for later creation if user needs to be authenticated first
    sessionStorage.setItem('pendingCompanyData', JSON.stringify(companyPayload));
    throw error;
  }
}
