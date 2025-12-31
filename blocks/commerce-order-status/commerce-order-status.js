import { render as orderRenderer } from '@dropins/storefront-order/render.js';
import { OrderStatus } from '@dropins/storefront-order/containers/OrderStatus.js';
import { OrderActions } from '@dropins/storefront-order/components/OrderActions.js';
import {
  CREATE_RETURN_PATH,
  CUSTOMER_CREATE_RETURN_PATH,
  checkIsAuthenticated,
  rootLink,
} from '../../scripts/commerce.js';

// Initialize
import '../../scripts/initializers/order.js';

export default async function decorate(block) {
  await orderRenderer.render(OrderStatus, {
    slots: {
      OrderActions: (ctx) => {
        const { orderData } = ctx;
        const actionsContainer = document.createElement('div');
        
        // OrderActions component automatically handles cancel button rendering
        // It checks store config and available_actions internally
        if (orderData) {
          orderRenderer.render(OrderActions, {
            orderData,
            routeCreateReturn: ({ token, number: orderNumber }) => {
              const isAuthenticated = checkIsAuthenticated();
              const { searchParams } = new URL(window.location.href);
              const orderRefFromUrl = searchParams.get('orderRef');
              const newOrderRef = isAuthenticated ? orderNumber : token;
              const encodedOrderRef = encodeURIComponent(orderRefFromUrl || newOrderRef);

              return checkIsAuthenticated() 
                ? rootLink(`${CUSTOMER_CREATE_RETURN_PATH}?orderRef=${encodedOrderRef}`) 
                : rootLink(`${CREATE_RETURN_PATH}?orderRef=${encodedOrderRef}`);
            },
            routeOnSuccess: () => rootLink('/cart'),
          })(actionsContainer);
        }
        
        return actionsContainer;
      },
    },
    routeCreateReturn: ({ token, number: orderNumber }) => {
      const isAuthenticated = checkIsAuthenticated();

      const { searchParams } = new URL(window.location.href);
      const orderRefFromUrl = searchParams.get('orderRef');
      const newOrderRef = isAuthenticated ? orderNumber : token;

      const encodedOrderRef = encodeURIComponent(orderRefFromUrl || newOrderRef);

      return checkIsAuthenticated() 
        ? rootLink(`${CUSTOMER_CREATE_RETURN_PATH}?orderRef=${encodedOrderRef}`) 
        : rootLink(`${CREATE_RETURN_PATH}?orderRef=${encodedOrderRef}`);
    },
    routeOnSuccess: () => rootLink('/cart'),
  })(block);
}
