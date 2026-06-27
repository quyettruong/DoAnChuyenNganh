import { IJob } from "@/types/backend";

export type SavedJobItem = {
    id: string;
    name: string;
    companyName?: string;
    companyLogo?: string;
    location?: string;
    salary?: number;
    level?: string;
    skills?: {
        id?: string;
        name?: string;
    }[];
    createdAt?: string;
    updatedAt?: string;
};

const STORAGE_KEY = "itcareer_saved_jobs";
export const SAVED_JOBS_EVENT = "itcareer:saved-jobs-change";

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

export const getSavedJobs = (): SavedJobItem[] => {
    if (!canUseStorage()) return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
};

const saveJobs = (jobs: SavedJobItem[]) => {
    if (!canUseStorage()) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    window.dispatchEvent(new Event(SAVED_JOBS_EVENT));
};

export const isJobSaved = (jobId?: string | number) => {
    if (jobId == null) return false;
    return getSavedJobs().some(item => item.id === `${jobId}`);
};

export const normalizeSavedJob = (job: IJob): SavedJobItem => ({
    id: `${job.id}`,
    name: job.name,
    companyName: job.company?.name,
    companyLogo: job.company?.logo,
    location: job.location,
    salary: job.salary,
    level: job.level,
    skills: job.skills?.map(skill => ({
        id: skill.id,
        name: skill.name,
    })),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
});

export const toggleSavedJob = (job: IJob) => {
    if (!job.id) return false;

    const savedJobs = getSavedJobs();
    const jobId = `${job.id}`;
    const existed = savedJobs.some(item => item.id === jobId);
    const nextJobs = existed
        ? savedJobs.filter(item => item.id !== jobId)
        : [normalizeSavedJob(job), ...savedJobs];

    saveJobs(nextJobs);
    return !existed;
};

export const removeSavedJob = (jobId: string | number) => {
    const nextJobs = getSavedJobs().filter(item => item.id !== `${jobId}`);
    saveJobs(nextJobs);
};
