import { NavLink } from 'react-router-dom'
import styles from './Header.module.css'

interface HeaderProps {
  onLogout?: () => void
}

function Header({ onLogout }: HeaderProps) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // Logout anyway on the frontend
    }
    onLogout?.()
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img
            src="/img/Savi_logo_Savi_White out copy.png"
            alt="Savi"
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Knowledge Pipeline</span>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
            end
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/submit"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            Submit Topic
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            Settings
          </NavLink>
          {onLogout && (
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header

