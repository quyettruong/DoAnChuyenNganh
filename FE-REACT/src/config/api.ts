import { IBackendRes, ICompany, IAccount, IUser, IModelPaginate, IGetAccount, IJob, IResume, IPermission, IRole, ISkill, IUserCv, IUserCvPayload, INotification } from '@/types/backend';
import axios from 'config/axios-customize';
import axiosOrigin from "axios";

/**
 *
Module Auth
 */


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;
const AI_URL = (import.meta.env.VITE_AI_URL as string) || 'http://localhost:8000';
export const callRegister = (name: string, email: string, password: string, age: number, gender: string, address: string) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/auth/register', { name, email, password, age, gender, address })
}

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login', { username, password })
}

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account')
}

export const callRefreshToken = () => {
    return axios.get<IBackendRes<IAccount>>('/api/v1/auth/refresh')
}

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout')
}
export const callForgotPassword = (email: string) => {
    return axios.post("/api/v1/auth/forgot-password", { email });
};

export const callResetPasswordPublic = (token: string, newPassword: string) => {
    return axiosOrigin.post(`${BACKEND_URL}/api/v1/auth/reset-password`, {
        token,
        newPassword,
    });
};

export const callSupportChat = async (payload: Record<string, any>): Promise<IBackendRes<any>> => {
    try {
        const res = await axios.post<IBackendRes<any>>('/api/v1/support-chat', payload) as unknown as IBackendRes<any>;
        if (res?.statusCode && Number(res.statusCode) >= 500) throw new Error(res.message || 'Support chat failed');
        return res;
    } catch (error) {
        const directRes = await axiosOrigin.post<IBackendRes<any>>(`${AI_URL}/support-chat`, payload);
        return directRes.data;
    }
};

/**
 * Upload single file
 */
export const callUploadSingleFile = (file: any, folderType: string) => {
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    bodyFormData.append('folder', folderType);

    return axios<IBackendRes<{ fileName: string }>>({
        method: 'post',
        url: '/api/v1/files',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const callUpdateProfile = (name: string, address: string, age: number, avatar?: string) => {
    return axios.put<IBackendRes<IAccount>>("/api/v1/auth/profile", {
        name,
        address,
        age,
        avatar,
    });
};

export const callChangePassword = (currentPassword: string, newPassword: string) => {
    return axios.put<IBackendRes<string>>("/api/v1/auth/change-password", {
        currentPassword,
        newPassword,
    });
};




/**
 *
Module Company
 */
export const callCreateCompany = (name: string, address: string, description: string, logo: string) => {
    return axios.post<IBackendRes<ICompany>>('/api/v1/companies', { name, address, description, logo })
}

export const callUpdateCompany = (id: string, name: string, address: string, description: string, logo: string) => {
    return axios.put<IBackendRes<ICompany>>(`/api/v1/companies`, { id, name, address, description, logo })
}

export const callDeleteCompany = (id: string) => {
    return axios.delete<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
}

export const callFetchCompany = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ICompany>>>(`/api/v1/companies?${query}`);
}

export const callFetchCompanyById = (id: string) => {
    return axios.get<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
}

/**
 * 
Module Skill
 */
export const callCreateSkill = (name: string) => {
    return axios.post<IBackendRes<ISkill>>('/api/v1/skills', { name })
}

export const callUpdateSkill = (id: string, name: string) => {
    return axios.put<IBackendRes<ISkill>>(`/api/v1/skills`, { id, name })
}

export const callDeleteSkill = (id: string) => {
    return axios.delete<IBackendRes<ISkill>>(`/api/v1/skills/${id}`);
}

export const callFetchAllSkill = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISkill>>>(`/api/v1/skills?${query}`);
}



/**
 * 
Module User
 */
export const callCreateUser = (user: IUser) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/users', { ...user })
}

export const callUpdateUser = (user: IUser) => {
    return axios.put<IBackendRes<IUser>>(`/api/v1/users`, { ...user })
}

export const callDeleteUser = (id: string) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
}

/**
 * 
Module Job
 */
export const callCreateJob = (job: IJob) => {
    return axios.post<IBackendRes<IJob>>('/api/v1/jobs', { ...job })
}

export const callUpdateJob = (job: IJob, id: string) => {
    return axios.put<IBackendRes<IJob>>(`/api/v1/jobs`, { id, ...job })
}

export const callDeleteJob = (id: string) => {
    return axios.delete<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
}

export const callFetchJob = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJob>>>(`/api/v1/jobs?${query}`);
}

export const callFetchJobById = (id: string, admin = false): Promise<IBackendRes<IJob>> => {
    return axios.get<IBackendRes<IJob>>(`/api/v1/jobs/${id}${admin ? '?admin=true' : ''}`) as unknown as Promise<IBackendRes<IJob>>;
}

export const callGenerateCvFromJob = (
    id: string | number,
    payload: {
        userPrompt?: string;
        currentCv?: Record<string, any>;
        profile?: Record<string, any>;
    }
): Promise<IBackendRes<any>> => {
    return axios.post<IBackendRes<any>>(`/api/v1/jobs/${id}/ai-cv`, payload) as unknown as Promise<IBackendRes<any>>;
}

/**
 * 
Module Resume
 */
export const callCreateResume = (url: string, jobId: any, email: string, userId: string | number) => {
    return axios.post<IBackendRes<IResume>>('/api/v1/resumes', {
        email, url,
        status: "PENDING",
        user: {
            "id": userId
        },
        job: {
            "id": jobId
        }
    })
}


// cập nhật trạng thái resume
export const callUpdateResumeStatus = (body: { id: number | string; status: string }) => {
    return axios.put("/api/v1/resumes", body);
};



export const callDeleteResume = (id: string) => {
    return axios.delete<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
}


export const callFetchResume = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IResume>>>(`/api/v1/resumes?${query}`);
};


export const callFetchResumeById = (id: string) => {
    return axios.get<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
}

export const callFetchResumeByUser = () => {
    return axios.get<IBackendRes<IModelPaginate<IResume>>>(`/api/v1/resumes/by-user`);
}

export const callSummarizeResume = (id: number | string): Promise<IBackendRes<any>> => {
    return axios.post<IBackendRes<any>>(`/api/v1/resumes/${id}/ai-summary`) as unknown as Promise<IBackendRes<any>>;
};

export const callEvaluateResume = (id: number | string): Promise<IBackendRes<any>> => {
    return axios.post<IBackendRes<any>>(`/api/v1/resumes/${id}/ai-evaluate`) as unknown as Promise<IBackendRes<any>>;
};

/**
 *
Module Notification
 */
export const callFetchNotifications = (query: string = "page=1&size=8"): Promise<IBackendRes<IModelPaginate<INotification>>> => {
    return axios.get<IBackendRes<IModelPaginate<INotification>>>(`/api/v1/notifications?${query}`) as unknown as Promise<IBackendRes<IModelPaginate<INotification>>>;
}

export const callCountUnreadNotifications = (): Promise<IBackendRes<{ count: number }>> => {
    return axios.get<IBackendRes<{ count: number }>>("/api/v1/notifications/unread-count") as unknown as Promise<IBackendRes<{ count: number }>>;
}

export const callMarkNotificationAsRead = (id: string | number): Promise<IBackendRes<INotification>> => {
    return axios.put<IBackendRes<INotification>>(`/api/v1/notifications/${id}/read`) as unknown as Promise<IBackendRes<INotification>>;
}

export const callMarkAllNotificationsAsRead = (): Promise<IBackendRes<void>> => {
    return axios.put<IBackendRes<void>>("/api/v1/notifications/read-all") as unknown as Promise<IBackendRes<void>>;
}

/**
 *
Module User CV
 */
export const callCreateUserCv = (payload: IUserCvPayload): Promise<IBackendRes<IUserCv>> => {
    return axios.post<IBackendRes<IUserCv>>('/api/v1/user-cvs', payload) as unknown as Promise<IBackendRes<IUserCv>>;
}

export const callUpdateUserCv = (id: string | number, payload: IUserCvPayload): Promise<IBackendRes<IUserCv>> => {
    return axios.put<IBackendRes<IUserCv>>(`/api/v1/user-cvs/${id}`, payload) as unknown as Promise<IBackendRes<IUserCv>>;
}

export const callFetchUserCvs = (query: string): Promise<IBackendRes<IModelPaginate<IUserCv>>> => {
    return axios.get<IBackendRes<IModelPaginate<IUserCv>>>(`/api/v1/user-cvs?${query}`) as unknown as Promise<IBackendRes<IModelPaginate<IUserCv>>>;
}

export const callFetchUserCvById = (id: string | number): Promise<IBackendRes<IUserCv>> => {
    return axios.get<IBackendRes<IUserCv>>(`/api/v1/user-cvs/${id}`) as unknown as Promise<IBackendRes<IUserCv>>;
}

export const callDeleteUserCv = (id: string | number): Promise<IBackendRes<IUserCv>> => {
    return axios.delete<IBackendRes<IUserCv>>(`/api/v1/user-cvs/${id}`) as unknown as Promise<IBackendRes<IUserCv>>;
}

export const callSetDefaultUserCv = (id: string | number): Promise<IBackendRes<IUserCv>> => {
    return axios.put<IBackendRes<IUserCv>>(`/api/v1/user-cvs/${id}/default`) as unknown as Promise<IBackendRes<IUserCv>>;
}


/**
 * 
Module Permission
 */
export const callCreatePermission = (permission: IPermission) => {
    return axios.post<IBackendRes<IPermission>>('/api/v1/permissions', { ...permission })
}

export const callUpdatePermission = (permission: IPermission, id: string) => {
    return axios.put<IBackendRes<IPermission>>(`/api/v1/permissions`, { id, ...permission })
}

export const callDeletePermission = (id: string) => {
    return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

export const callFetchPermission = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
}

export const callFetchPermissionById = (id: string) => {
    return axios.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

/**
 * 
Module Role
 */
export const callCreateRole = (role: IRole) => {
    return axios.post<IBackendRes<IRole>>('/api/v1/roles', { ...role })
}

export const callUpdateRole = (role: IRole, id: string) => {
    return axios.put<IBackendRes<IRole>>(`/api/v1/roles`, { id, ...role })
}

export const callDeleteRole = (id: string) => {
    return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}

export const callFetchRole = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`);
}

export const callFetchRoleById = (id: string) => {
    return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}
