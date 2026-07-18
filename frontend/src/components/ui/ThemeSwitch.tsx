import React from 'react'
import { useStore } from '@/store'
import './theme-switch.css'

interface ThemeSwitchProps {
  /** Optional extra class on the wrapper */
  className?: string
}

export function ThemeSwitch({ className = '' }: ThemeSwitchProps) {
  const { darkMode, toggleDarkMode } = useStore()

  return (
    <div
      className={`theme-switch ${darkMode ? 'theme-switch--dark' : ''} ${className}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleDarkMode()
      }}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ cursor: 'pointer' }}
    >
      <div className="theme-switch__container">
        {/* Glowing circle that slides between positions */}
        <div className="theme-switch__circle-container">
          <div className="theme-switch__sun-moon-container">
            {/* Moon layer slides in from right when dark mode is on */}
            <div className="theme-switch__moon">
              <div className="theme-switch__spot" />
              <div className="theme-switch__spot" />
              <div className="theme-switch__spot" />
            </div>
          </div>
        </div>

        {/* Clouds visible in light mode */}
        <div className="theme-switch__clouds" />

        {/* Stars visible in dark mode */}
        <div className="theme-switch__stars-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 144 55"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71206C136.607 6.55544 136.996 7.56682 136.996 8.72209C136.996 7.56682 137.385 6.55544 138.161 5.71206C138.937 4.85867 139.881 4.40947 140.992 4.35447C139.881 4.29946 138.937 3.85027 138.161 3.00688C137.385 2.1635 136.996 1.15212 136.996 0C136.996 1.15212 136.607 2.1635 135.831 3.00688ZM-0.00408754 43.3542C-0.00408754 42.1989 -0.393160 41.1875 -1.16924 40.3441C-0.393160 39.5007 0.550964 39.0515 1.66167 38.9965C0.550964 38.9415 -0.393160 38.4923 -1.16924 37.6489C-0.393160 36.8056 0.550964 36.3564 1.66167 36.3013C0.550964 36.2463 -0.393160 35.7971 -1.16924 34.9537L-1.16924 43.3542C-0.393160 44.1976 0.550964 44.6468 1.66167 44.7018C0.550964 44.7568 -0.393160 45.206 -1.16924 46.0494C-0.393160 46.8927 0.550964 47.3419 1.66167 47.3969C0.550964 47.4519 -0.393160 47.9011 -1.16924 48.7445C-0.393160 49.5879 0.550964 50.0371 1.66167 50.0921C0.550964 50.1471 -0.393160 50.5963 -1.16924 51.4397C-0.393160 52.2831 0.550964 52.7323 1.66167 52.7873C0.550964 52.8423 -0.393160 53.2915 -1.16924 54.1349V43.3542Z"
              fill="currentColor"
            />
            <circle cx="102" cy="19" r="2" fill="currentColor" />
            <circle cx="24" cy="37" r="2" fill="currentColor" />
            <circle cx="60" cy="6" r="2" fill="currentColor" />
            <circle cx="120" cy="40" r="2" fill="currentColor" />
            <circle cx="5" cy="19" r="2" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  )
}
