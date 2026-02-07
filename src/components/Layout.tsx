import { Outlet } from 'react-router-dom'
import Header from './Header'
import styles from './Layout.module.css'

interface LayoutProps {
  onLogout?: () => void
}

function Layout({ onLogout }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header onLogout={onLogout} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

