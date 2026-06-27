import styles from 'styles/client.module.scss';
import SearchClient from '@/components/client/search.client';
import JobCard from '@/components/client/card/job.card';
import CompanyCard from '@/components/client/card/company.card';

const HomePage = () => {
    return (
        <div className={`${styles["container"]} ${styles["home-section"]}`}>
            <div className={styles["search-content"]}>
                <SearchClient />
            </div>
            <div className={styles["home-block"]}>
                <CompanyCard />
            </div>
            <div className={styles["home-block"]}>
                <JobCard />
            </div>
        </div>
    )
}

export default HomePage;
