import { env } from '@/env';

const redirectUri = window.location.origin + '/pub/rept';

// The full BC Gov logoff chain URL — must exactly match one of the Allowed sign-out URLs
// registered in the Cognito app client for the current environment.
// Set VITE_REDIRECT_SIGN_OUT in:
//   - frontend/.env for local development
//   - playbooks/vars/custom/<env>.yaml for deployed environments (injected via config.js.j2)
// Example (dev/test/localhost):
//   https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=
//     https://test.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout
//       ?redirect_uri=<your-app-url>
export const redirectSignOut = env.VITE_REDIRECT_SIGN_OUT?.trim() ?? '';

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
          domain: 'lza-prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com',
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
