# CORS Fix Deployment Guide

This guide explains the changes made to fix the CORS issues between the frontend at `https://vikiai.vikiflow.com` and the backend at `https://vikiaibackend.vikiflow.com`.

## Issue

The frontend was experiencing CORS errors when making requests to the backend with credentials:

```
Access to fetch at 'https://vikiaibackend.vikiflow.com/api/chatbots' from origin 'https://vikiai.vikiflow.com' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## Changes Made

1. **Updated backend CORS middleware** (`backend/middleware/cors.js`):
   - Modified to always set a specific origin instead of wildcard when credentials are used
   - Improved handling of different environments

2. **Updated standard CORS configuration** (`backend/server.js` and `backend/api/index.js`):
   - Ensured consistent CORS configuration across all entry points
   - Fixed the origin callback to return the specific origin instead of `true`

## Deployment Steps

### Backend Deployment

1. **Update your backend environment variables**:
   - Make sure `FRONTEND_URL` is set to `https://vikiai.vikiflow.com` in your Vercel environment variables

2. **Deploy the backend changes**:
   ```
   cd backend
   vercel
   ```
   
   Or deploy through your CI/CD pipeline or Vercel dashboard.

3. **Verify the deployment**:
   - Check the backend logs to ensure the CORS middleware is logging the correct origins
   - Test a simple API endpoint to verify CORS headers are being set correctly

### Frontend Deployment

1. **Verify environment variables**:
   - Ensure `VITE_API_URL` is set to `https://vikiaibackend.vikiflow.com/api` in your frontend environment

2. **Deploy the frontend**:
   ```
   npm run build
   ```
   
   Then deploy the built files to your hosting provider.

## Testing

After deployment, test the following:

1. Navigate to `https://vikiai.vikiflow.com`
2. Open browser developer tools (F12) and go to the Network tab
3. Perform actions that trigger API requests to the backend
4. Verify that requests to `https://vikiaibackend.vikiflow.com/api/*` succeed without CORS errors
5. Check that the response headers include:
   - `Access-Control-Allow-Origin: https://vikiai.vikiflow.com`
   - `Access-Control-Allow-Credentials: true`

## Troubleshooting

If CORS issues persist:

1. **Check backend logs** for any errors in the CORS middleware
2. **Verify environment variables** are correctly set in both frontend and backend
3. **Clear browser cache** and try in an incognito/private window
4. **Check request headers** in the Network tab to ensure `credentials: include` is being sent
5. **Verify response headers** include the correct CORS headers

## Additional Resources

- [MDN Web Docs: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS middleware documentation](https://expressjs.com/en/resources/middleware/cors.html)
