
import styles from './Footer.module.scss';

const Footer = ({ ...rest }) => {
  return (
    <footer className={styles.footer} {...rest}>
      <div className={`${styles.footerContainer} ${styles.footerLegal}`}>
        <p>
          &copy; <a href="https://spacejelly.dev">Next.js Leaflet Starter</a>, {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;