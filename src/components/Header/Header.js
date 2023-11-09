import styles from './Header.module.scss';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <h1 className={styles.headerTitle}>maijaus.co - Villavicencio</h1>
      </div>
    </header>
  );
};

export default Header;