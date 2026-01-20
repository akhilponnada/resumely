export interface Education {
    institution: string;
    degree: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
}

export interface Experience {
    company: string;
    position: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    link?: string;
    highlights: string[];
}

export interface Project {
    name: string;
    technologies?: string;
    startDate?: string;
    endDate?: string;
    link?: string;
    highlights: string[];
}

export interface Skills {
    languages?: string[];
    frameworks?: string[];
    tools?: string[];
    platforms?: string[];
    libraries?: string[];
    soft?: string[];
}

export interface Certification {
    name: string;
    issuer?: string;
    date?: string;
    link?: string;
    highlights?: string[];
}

export interface ResumeData {
    fullName: string;
    email: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary?: string;
    education: Education[];
    experience: Experience[];
    projects: Project[];
    skills: Skills;
    certifications?: Certification[];
}

export interface Resume {
    _id: string;
    userId: string;
    title: string;
    rawInput: string;
    jobDescription?: string;
    atsScore?: number;
    resumeData: ResumeData;
    createdAt: number;
    updatedAt: number;
}

export interface User {
    _id: string;
    email: string;
    name?: string;
    createdAt: number;
}
