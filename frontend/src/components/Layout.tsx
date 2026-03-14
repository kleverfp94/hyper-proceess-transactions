import { Link, NavLink, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoH}>H</span>
          <span className={styles.logoText}>yper</span>
        </Link>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive && location.pathname === '/' ? styles.navLinkActive : ''}`
            }
          >
            Transações
          </NavLink>
          <NavLink
            to="/nova"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            Nova Transação
          </NavLink>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Hyper Group · Transactions</span>
      </footer>
    </div>
  )
}
