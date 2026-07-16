import { createBrowserRouter } from 'react-router-dom';

import { LandingPage } from '@/modules/landing/LandingPage';
import { CatalogPage } from '@/modules/shop/CatalogPage';
import { CheckoutPage } from '@/modules/checkout/CheckoutPage';
import { OrderSuccessPage } from '@/modules/success/OrderSuccessPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/s/:saleSlug', element: <CatalogPage /> },
  { path: '/s/:saleSlug/checkout', element: <CheckoutPage /> },
  { path: '/order/success/:id', element: <OrderSuccessPage /> },
  { path: '*', element: <LandingPage /> },
]);
