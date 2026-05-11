import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // أولاً: المسار اللي فيه ID نخليه Server عشان ميعملش مشكلة وقت الـ Build
  {
    path: 'campaign-details/:id',
    renderMode: RenderMode.Server
  },
  // ثانياً: أي مسار تاني (home, donors, etc) خليه Prerender عادي
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];