import Link from 'next/link';

import styles from './Header.module.scss';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <p className={styles.headerTitle}>
          <Link href="/">
            Maijaus - Villavicencio
          </Link>
        </p>
      </div>
    </header>
  );
};

export default Header;