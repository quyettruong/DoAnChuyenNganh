export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
}

export interface IModelPaginate<T> {
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: T[]
}

export interface IAccount {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        avatar?: string;
        role: {
            id: string;
            name: string;
            permissions: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[]
        },
        company?: {
            id: string;
            name: string;
            logo?: string;
        }
    }
}

export interface IGetAccount extends Omit<IAccount, "access_token"> { }

export interface ICompany {
    id?: string;
    name?: string;
    address?: string;
    logo: string;
    description?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ISkill {
    id?: string;
    name?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}



export interface IUser {
    id?: string;
    name: string;
    email: string;
    password?: string;
    age: number;
    gender: string;
    address: string;
    role?: {
        id: string;
        name: string;
    }

    company?: {
        id: string;
        name: string;
    }
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IJob {
    id?: string;
    name: string;
    skills: ISkill[];
    company?: {
        id: string;
        name: string;
        logo?: string;
    };

    location: string;
    latitude?: number;
    longitude?: number;

    salary: number;
    quantity: number;
    level: string;
    description: string;
    startDate: Date;
    endDate: Date;
    active: boolean;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}


export interface IResume {
    id?: string;
    email: string;
    userId: string;

    url: string;
    status: string;
    statusNote?: string;

    // BE trả sẵn theo job đã expand
    job?: {
        id: string;
        name: string;
        company?: {
            id: string;
            name: string;
            logo?: string;
        };
    };

    // tên công ty đã map sẵn từ BE
    companyName?: string;

    // tóm tắt CV bằng AI
    summaryAi?: string;
    aiMatchScore?: number;
    aiRecommendation?: string;
    aiMatchedSkills?: string[];
    aiMissingSkills?: string[];
    aiStrengths?: string[];
    aiWeaknesses?: string[];
    aiEvaluation?: string;
    aiEvaluatedAt?: string;

    // giữ nguyên
    companyId?: string | {
        id: string;
        name: string;
        logo?: string;
    };

    jobId?: string | {
        id: string;
        name: string;
    };

    history?: {
        status: string;
        updatedAt: Date;
        updatedBy: { id: string; email: string }
    }[];

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface INotification {
    id: string | number;
    title: string;
    message: string;
    type: string;
    targetType?: string;
    targetId?: string | number;
    read: boolean;
    createdAt?: string;
    readAt?: string;
}

export interface IUserCv {
    id?: string;
    title: string;
    templateCode?: string;
    theme?: string;
    cvData: string;
    defaultCv?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface IUserCvPayload {
    title: string;
    templateCode?: string;
    theme?: string;
    cvData: string;
    defaultCv?: boolean;
}


export interface IPermission {
    id?: string;
    name?: string;
    apiPath?: string;
    method?: string;
    module?: string;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;

}

export interface IRole {
    id?: string;
    name: string;
    description: string;
    active: boolean;
    permissions: IPermission[] | string[];

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}
