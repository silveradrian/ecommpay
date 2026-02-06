import { NavLink } from 'react-router-dom'
import styles from './Header.module.css'

function Header() {
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
        </nav>
      </div>
    </header>
  )
}

export default Header

