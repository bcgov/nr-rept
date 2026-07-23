import { env } from '@/env';

const redirectUri = window.location.origin + (env.VITE_BASE_PATH || '/').replace(/\/$/, '');

// Where Cognito returns the browser after its /logout hop — the app origin.
// This must be registered as an Allowed sign-out URL on the Cognito app client
// (the same origin the federated logout chain passes as its `logout_uri`, see
// context/auth/logoutChain.ts). Computed from the runtime origin so the same
// image works across PR-preview / TEST / PROD without a per-env variable.
//
// This backs only the *fallback* Amplify hosted-UI sign-out. The primary logout
// path drives the federated chain (Siteminder → KC → Cognito → app) itself.
export const redirectSignOut = redirectUri;

// Cognito hosted-UI domain. Exported so the federated logout builder
// (context/auth/logoutChain.ts) can construct the Cognito /logout URL that
// Keycloak redirects back through as the final hop of the sign-out chain.
export const COGNITO_HOSTED_UI_DOMAIN =
  'lza-prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com';

const verificationMethods: 'code' | 'token' = 'code';

// AWS Amplify Auth configuration for Cognito (FAM integration).
// Tokens are stored in cookies (see main.tsx CookieStorage setup).
const amplifyconfig = {
  Auth: {
    Cognito: {
      userPoolId: env.VITE_USER_POOLS_ID,
      userPoolClientId: env.VITE_USER_POOLS_WEB_CLIENT_ID,
      signUpVerificationMethod: verificationMethods,
      loginWith: {
        oauth: {
          domain: COGNITO_HOSTED_UI_DOMAIN,
          scopes: ['openid', 'profile'],
          redirectSignIn: [`${redirectUri}/dashboard`],
          redirectSignOut: [redirectSignOut],
          responseType: verificationMethods,
        },
      },
    },
  },
};

export default amplifyconfig;
