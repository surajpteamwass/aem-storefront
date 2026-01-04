import CompanyProfile from '@dropins/storefront-company-management/containers/CompanyProfile.js';
import { render as companyRenderer } from '@dropins/storefront-company-management/render.js';
import { checkIsCompanyEnabled } from '@dropins/storefront-company-management/api.js';
import {
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_ACCOUNT_PATH,
  checkIsAuthenticated,
  rootLink,
} from '../../scripts/commerce.js';

// Initialize
import '../../scripts/initializers/company-management.js';

export default async function decorate(block) {
  if (!checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
    return;
  }

  // Check if company features are enabled
  const { companyEnabled } = await checkIsCompanyEnabled();

  if (!companyEnabled) {
    // Redirect to account page if company features are not enabled
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
    return;
  }

  await companyRenderer.render(CompanyProfile, {})(block);
}
