
import styles from '@/styles/client.module.scss';

const Footer = () => {
    return (
        <footer className={styles["footer-section"]}>
            <div className={styles["container"]}>
                <span>IT Career</span>
                <span>Kết nối ứng viên IT với cơ hội phù hợp.</span>
            </div>
        </footer>
    )
}

export default Footer;
