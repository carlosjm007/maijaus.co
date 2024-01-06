import styles from './Header.module.scss';

const Header = ({name}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <h1 className={styles.headerTitle}>maijaus.co - {name}</h1>
      </div>
    </header>
  );
};

export default Header;