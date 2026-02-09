import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/slack/callback(.*)',
  '/api/slack/events(.*)',
  '/api/slack/status(.*)',
])

// Check if Clerk is properly configured
const clerkEnabled = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  process.env.CLERK_SECRET_KEY &&
  !process.env.CLERK_SECRET_KEY.includes('placeholder');

export default clerkMiddleware(async (auth, request) => {
  // If Clerk isn't configured, allow all routes
  if (!clerkEnabled) {
    return NextResponse.next();
  }
  
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
