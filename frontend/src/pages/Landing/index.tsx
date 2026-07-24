import { Login } from '@carbon/icons-react';
import { Button, Column, Grid, InlineNotification } from '@carbon/react';
import { useEffect, useState } from 'react';

import logo_rev from '@/assets/img/bc-gov-logo-rev.png';
import logo from '@/assets/img/bc-gov-logo.png';
import LandingImg from '@/assets/img/landing.jpg';
import { SESSION_EXPIRED_FLAG } from '@/components/SessionTimeout';
import { useAuth } from '@/context/auth/useAuth';
import { useTheme } from '@/context/theme/useTheme';
import useBreakpoint from '@/hooks/useBreakpoint';

import type { BreakpointType } from '@/hooks/useBreakpoint/types';
import type { FC } from 'react';

import './index.scss';

const LandingPage: FC = () => {
  const { login } = useAuth();
  const breakpoint = useBreakpoint();
  const { theme } = useTheme();

  // After a session-timeout logout, the SessionTimeout guard stashes a
  // sessionStorage flag before redirecting through the Cognito sign-out chain.
  // When the browser lands back here, surface a one-time "session expired"
  // notice explaining why the user was logged out, then clear the flag so a
  // manual reload doesn't show it again.
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_EXPIRED_FLAG) === '1') {
        setSessionExpired(true);
        sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
      }
    } catch {
      /* storage disabled — no notice, non-fatal */
    }
  }, []);

  // Unit is rem
  const elementMarginMap: Record<BreakpointType, number> = {
    max: 6,
    xlg: 6,
    lg: 6,
    md: 3,
    sm: 2.5,
  };

  /**
   * Defines the vertical gap between the title, subtitle, and buttons.
   */
  const elementGap = elementMarginMap[breakpoint] || elementMarginMap.sm;

  return (
    <div className="landing-grid-container">
      <Grid fullWidth className="landing-grid">
        <Column className="landing-content-col" sm={4} md={8} lg={8}>
          <div className="landing-content-wrapper" style={{ gap: `${elementGap}rem` }}>
            {/* Logo */}
            <div>
              <img
                src={theme === 'g100' ? logo_rev : logo}
                alt="BCGov Logo"
                width={160}
                className="logo"
              />
            </div>

            {sessionExpired && (
              <InlineNotification
                kind="warning"
                lowContrast
                title="Session expired"
                subtitle="You were logged out due to inactivity. Please log in again to continue."
                onClose={() => setSessionExpired(false)}
                data-testid="landing-session-expired"
              />
            )}

            {/* Welcome - Title and Subtitle */}
            <h1 data-testid="landing-title" className="landing-title">
              REPT
            </h1>

            <h2 data-testid="landing-subtitle" className="landing-subtitle">
              Real Estate Project Tracking
            </h2>

            {/* Login button — REPT uses IDIR only */}
            <div className="buttons-container single-row">
              <Button
                type="button"
                onClick={() => login()}
                renderIcon={Login}
                size="md"
                data-testid="landing-button__idir"
                className="login-btn"
              >
                Log in with IDIR
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

export default LandingPage;
