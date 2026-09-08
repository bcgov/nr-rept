import { Logout } from '@carbon/icons-react';
import { Button, Column, Grid } from '@carbon/react';
import { type FC } from 'react';

import logo_rev from '@/assets/img/bc-gov-logo-rev.png';
import logo from '@/assets/img/bc-gov-logo.png';
import LandingImg from '@/assets/img/landing.jpg';
import { useAuth } from '@/context/auth/useAuth';
import { useTheme } from '@/context/theme/useTheme';

// The landing layout, deliberately shared rather than duplicated: this page and
// the sign-in screen are the two ends of the same journey and should look like
// one thing. (nr-fsp-new does the same for its UnauthorizedPage.)
import '../Landing/index.scss';

/**
 * Shown after a successful sign-in when the token carries no recognised REPT
 * role.
 *
 * `AuthProvider` deliberately keeps such a user in state (`isLoggedIn=true`)
 * rather than signing them out, so the routing layer can land them here via
 * `getNoRoleRoutes()` instead of bouncing them back through Keycloak.
 *
 * Two things this page has to get right, because the user cannot fix either
 * from inside the app:
 *
 *  1. **Say who they are signed in as.** Access is granted per IDIR account, and
 *     someone with two accounts needs to know which one just failed — otherwise
 *     the only diagnosis available to them is "it doesn't work".
 *  2. **Offer sign-out.** Getting a role is an out-of-band CSS admin step, so
 *     the single useful action is to leave. Previously this page rendered inside
 *     `<Layout>`, where the only way out was the header profile menu — next to a
 *     side nav with nothing in it, since the menu is filtered by role.
 */
const RoleErrorPage: FC = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.userName;

  return (
    <div className="landing-grid-container">
      <Grid fullWidth className="landing-grid">
        <Column className="landing-content-col" sm={4} md={8} lg={8}>
          <div className="landing-content-wrapper" style={{ gap: '2.5rem' }}>
            <div>
              <img
                src={theme === 'g100' ? logo_rev : logo}
                alt="BCGov Logo"
                width={160}
                className="logo"
              />
            </div>

            <h1 data-testid="unauthorized-title" className="landing-title">
              Access not granted
            </h1>

            <h2 data-testid="unauthorized-subtitle" className="landing-subtitle">
              {displayName
                ? `You're signed in as ${displayName}, but this account isn't authorized to use REPT.`
                : "You're signed in, but this account isn't authorized to use REPT."}
            </h2>

            <p data-testid="unauthorized-help" className="landing-help">
              Access to REPT is granted per IDIR account. Contact your team&rsquo;s administrator to
              request the REPT Admin or REPT Viewer role, then sign in again.
            </p>

            <div className="buttons-container single-row">
              <Button
                type="button"
                kind="secondary"
                onClick={() => void logout()}
                renderIcon={Logout}
                size="md"
                data-testid="unauthorized-button__logout"
                className="login-btn"
              >
                Sign out
              </Button>
            </div>
          </div>
        </Column>

        <Column className="landing-img-col" sm={4} md={8} lg={8}>
          <img src={LandingImg} alt="Landing cover" className="landing-img" />
        </Column>
      </Grid>
    </div>
  );
};

export default RoleErrorPage;
