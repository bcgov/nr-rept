import { AsleepFilled, LightFilled } from '@carbon/icons-react';
import { type FC } from 'react';
import './index.scss';

import { useTheme } from '@/context/theme/useTheme';

const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  const isDark = theme === 'g90' || theme === 'g100';

  return (
    <div
      className={`theme-toggle ${isDark ? 'on' : 'off'}`}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleToggle();
        }
      }}
    >
      <div className="circle">
        {isDark ? <AsleepFilled className="icon" /> : <LightFilled className="icon" />}
      </div>
    </div>
  );
};

export default ThemeToggle;
