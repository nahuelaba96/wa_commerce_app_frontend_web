import { Routes } from '@angular/router';

import { Layout } from './layout/layout/layout';
import { Dashboard } from './features/dashboard/dashboard';
import { Products } from './features/products/products';
import { Conversations } from './features/conversations/conversations';
import { Settings } from './features/settings/settings';
import { NewProduct } from './features/products/new-product/new-product';
import { AuthPage } from './features/auth/auth-page';
import { authChildGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthPage,
    data: { mode: 'login' }
  },
  {
    path: 'register',
    component: AuthPage,
    data: { mode: 'register' }
  },
  {
    path: '',
    component: Layout,
    canActivateChild: [authChildGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'products/new',
        component: NewProduct
      },
      {
        path: 'products/edit/:id',
        component: NewProduct
      },
      {
        path: 'products',
        component: Products
      },
      {
        path: 'conversations',
        component: Conversations
      },
      {
        path: 'settings',
        component: Settings
      }
    ]
  },
  { path: '**', redirectTo: '' }
];