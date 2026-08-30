"use client";

import type { ReactNode } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    emptyCertification,
    emptyEducation,
    emptyExperience,
    emptyProject,
    joinLines,
    joinList,
    SKILL_FIELDS,
    splitLines,
    splitList,
} from "@/lib/resume-model";
import type { ResumeData } from "@/lib/types";

export function ResumeEditor({
    data,
    onChange,
}: {
    data: ResumeData;
    onChange: (next: ResumeData) => void;
}) {
    const set = (patch: Partial<ResumeData>) => onChange({ ...data, ...patch });

    return (
        <div className="flex flex-col gap-4">
            <Card size="sm">
                <CardHeader>
                    <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                            <Input
                                id="fullName"
                                value={data.fullName}
                                onChange={(event) => set({ fullName: event.target.value })}
                                autoComplete="name"
                            />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => set({ email: event.target.value })}
                                    autoComplete="email"
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                                <Input
                                    id="phone"
                                    value={data.phone ?? ""}
                                    onChange={(event) => set({ phone: event.target.value })}
                                    autoComplete="tel"
                                />
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel htmlFor="linkedin">LinkedIn</FieldLabel>
                            <Input
                                id="linkedin"
                                value={data.linkedin ?? ""}
                                onChange={(event) => set({ linkedin: event.target.value })}
                                placeholder="linkedin.com/in/you"
                            />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="github">GitHub</FieldLabel>
                                <Input
                                    id="github"
                                    value={data.github ?? ""}
                                    onChange={(event) => set({ github: event.target.value })}
                                    placeholder="github.com/you"
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="website">Website</FieldLabel>
                                <Input
                                    id="website"
                                    value={data.website ?? ""}
                                    onChange={(event) => set({ website: event.target.value })}
                                />
                            </Field>
                        </div>
                    </FieldGroup>
                </CardContent>
            </Card>

            <Card size="sm">
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Field>
                        <FieldLabel htmlFor="summary">Professional summary</FieldLabel>
                        <Textarea
                            id="summary"
                            value={data.summary ?? ""}
                            onChange={(event) => set({ summary: event.target.value })}
                            className="min-h-24"
                        />
                        <FieldDescription>
                            2–4 sentences. Lead with the role you want, then proof.
                        </FieldDescription>
                    </Field>
                </CardContent>
            </Card>

            <SectionList
                title="Experience"
                onAdd={() => set({ experience: [...data.experience, emptyExperience()] })}
                addLabel="Add role"
            >
                {data.experience.map((exp, index) => (
                    <div key={index} className="flex flex-col gap-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">Role {index + 1}</p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove role ${index + 1}`}
                                onClick={() =>
                                    set({
                                        experience: data.experience.filter((_, i) => i !== index),
                                    })
                                }
                            >
                                <Trash2Icon />
                            </Button>
                        </div>
                        <FieldGroup>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel>Title</FieldLabel>
                                    <Input
                                        value={exp.position}
                                        onChange={(event) =>
                                            set({
                                                experience: patch(data.experience, index, {
                                                    position: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Company</FieldLabel>
                                    <Input
                                        value={exp.company}
                                        onChange={(event) =>
                                            set({
                                                experience: patch(data.experience, index, {
                                                    company: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <Field>
                                    <FieldLabel>Location</FieldLabel>
                                    <Input
                                        value={exp.location ?? ""}
                                        onChange={(event) =>
                                            set({
                                                experience: patch(data.experience, index, {
                                                    location: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Start</FieldLabel>
                                    <Input
                                        value={exp.startDate ?? ""}
                                        onChange={(event) =>
                                            set({
                                                experience: patch(data.experience, index, {
                                                    startDate: event.target.value,
                                                }),
                                            })
                                        }
                                        placeholder="June 2022"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>End</FieldLabel>
                                    <Input
                                        value={exp.endDate ?? ""}
                                        onChange={(event) =>
                                            set({
                                                experience: patch(data.experience, index, {
                                                    endDate: event.target.value,
                                                }),
                                            })
                                        }
                                        placeholder="Present"
                                    />
                                </Field>
                            </div>
                            <Field>
                                <FieldLabel>Link</FieldLabel>
                                <Input
                                    value={exp.link ?? ""}
                                    onChange={(event) =>
                                        set({
                                            experience: patch(data.experience, index, {
                                                link: event.target.value,
                                            }),
                                        })
                                    }
                                    placeholder="Optional"
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Highlights</FieldLabel>
                                <Textarea
                                    value={joinLines(exp.highlights)}
                                    onChange={(event) =>
                                        set({
                                            experience: patch(data.experience, index, {
                                                highlights: splitLines(event.target.value),
                                            }),
                                        })
                                    }
                                    className="min-h-28"
                                />
                                <FieldDescription>One bullet per line.</FieldDescription>
                            </Field>
                        </FieldGroup>
                    </div>
                ))}
            </SectionList>

            <SectionList
                title="Projects"
                onAdd={() => set({ projects: [...data.projects, emptyProject()] })}
                addLabel="Add project"
            >
                {data.projects.map((project, index) => (
                    <div key={index} className="flex flex-col gap-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">Project {index + 1}</p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove project ${index + 1}`}
                                onClick={() =>
                                    set({
                                        projects: data.projects.filter((_, i) => i !== index),
                                    })
                                }
                            >
                                <Trash2Icon />
                            </Button>
                        </div>
                        <FieldGroup>
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    value={project.name}
                                    onChange={(event) =>
                                        set({
                                            projects: patch(data.projects, index, {
                                                name: event.target.value,
                                            }),
                                        })
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Technologies</FieldLabel>
                                <Input
                                    value={project.technologies ?? ""}
                                    onChange={(event) =>
                                        set({
                                            projects: patch(data.projects, index, {
                                                technologies: event.target.value,
                                            }),
                                        })
                                    }
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <Field>
                                    <FieldLabel>Start</FieldLabel>
                                    <Input
                                        value={project.startDate ?? ""}
                                        onChange={(event) =>
                                            set({
                                                projects: patch(data.projects, index, {
                                                    startDate: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>End</FieldLabel>
                                    <Input
                                        value={project.endDate ?? ""}
                                        onChange={(event) =>
                                            set({
                                                projects: patch(data.projects, index, {
                                                    endDate: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                                <Field className="col-span-2 sm:col-span-1">
                                    <FieldLabel>Link</FieldLabel>
                                    <Input
                                        value={project.link ?? ""}
                                        onChange={(event) =>
                                            set({
                                                projects: patch(data.projects, index, {
                                                    link: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                            <Field>
                                <FieldLabel>Highlights</FieldLabel>
                                <Textarea
                                    value={joinLines(project.highlights)}
                                    onChange={(event) =>
                                        set({
                                            projects: patch(data.projects, index, {
                                                highlights: splitLines(event.target.value),
                                            }),
                                        })
                                    }
                                    className="min-h-24"
                                />
                            </Field>
                        </FieldGroup>
                    </div>
                ))}
            </SectionList>

            <Card size="sm">
                <CardHeader>
                    <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        {SKILL_FIELDS.map((field) => (
                            <Field key={field.key}>
                                <FieldLabel htmlFor={`skill-${field.key}`}>{field.label}</FieldLabel>
                                <Input
                                    id={`skill-${field.key}`}
                                    value={joinList(data.skills[field.key])}
                                    onChange={(event) =>
                                        set({
                                            skills: {
                                                ...data.skills,
                                                [field.key]: splitList(event.target.value),
                                            },
                                        })
                                    }
                                    placeholder="Comma-separated"
                                />
                            </Field>
                        ))}
                    </FieldGroup>
                </CardContent>
            </Card>

            <SectionList
                title="Education"
                onAdd={() => set({ education: [...data.education, emptyEducation()] })}
                addLabel="Add school"
            >
                {data.education.map((edu, index) => (
                    <div key={index} className="flex flex-col gap-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">School {index + 1}</p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove school ${index + 1}`}
                                onClick={() =>
                                    set({
                                        education: data.education.filter((_, i) => i !== index),
                                    })
                                }
                            >
                                <Trash2Icon />
                            </Button>
                        </div>
                        <FieldGroup>
                            <Field>
                                <FieldLabel>Institution</FieldLabel>
                                <Input
                                    value={edu.institution}
                                    onChange={(event) =>
                                        set({
                                            education: patch(data.education, index, {
                                                institution: event.target.value,
                                            }),
                                        })
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Degree</FieldLabel>
                                <Input
                                    value={edu.degree}
                                    onChange={(event) =>
                                        set({
                                            education: patch(data.education, index, {
                                                degree: event.target.value,
                                            }),
                                        })
                                    }
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <Field>
                                    <FieldLabel>Location</FieldLabel>
                                    <Input
                                        value={edu.location ?? ""}
                                        onChange={(event) =>
                                            set({
                                                education: patch(data.education, index, {
                                                    location: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Start</FieldLabel>
                                    <Input
                                        value={edu.startDate ?? ""}
                                        onChange={(event) =>
                                            set({
                                                education: patch(data.education, index, {
                                                    startDate: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>End</FieldLabel>
                                    <Input
                                        value={edu.endDate ?? ""}
                                        onChange={(event) =>
                                            set({
                                                education: patch(data.education, index, {
                                                    endDate: event.target.value,
                                                }),
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                            <Field>
                                <FieldLabel>GPA</FieldLabel>
                                <Input
                                    value={edu.gpa ?? ""}
                                    onChange={(event) =>
                                        set({
                                            education: patch(data.education, index, {
                                                gpa: event.target.value,
                                            }),
                                        })
                                    }
                                />
                            </Field>
                        </FieldGroup>
                    </div>
                ))}
            </SectionList>

            <SectionList
                title="Certifications"
                onAdd={() =>
                    set({
                        certifications: [...(data.certifications ?? []), emptyCertification()],
                    })
                }
                addLabel="Add certification"
            >
                {(data.certifications ?? []).map((cert, index) => (
                    <div key={index} className="flex flex-col gap-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">Certification {index + 1}</p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove certification ${index + 1}`}
                                onClick={() =>
                                    set({
                                        certifications: (data.certifications ?? []).filter(
                                            (_, i) => i !== index,
                                        ),
                                    })
                                }
                            >
                                <Trash2Icon />
                            </Button>
                        </div>
                        <FieldGroup>
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    value={cert.name}
                                    onChange={(event) =>
                                        set({
                                            certifications: patch(data.certifications ?? [], index, {
                                                name: event.target.value,
                                            }),
                                        })
                                    }
                                />
                            </Field>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel>Issuer</FieldLabel>
                                    <Input
                                        value={cert.issuer ?? ""}
                                        onChange={(event) =>
                                            set({
                                                certifications: patch(
                                                    data.certifications ?? [],
                                                    index,
                                                    { issuer: event.target.value },
                                                ),
                                            })
                                        }
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Date</FieldLabel>
                                    <Input
                                        value={cert.date ?? ""}
                                        onChange={(event) =>
                                            set({
                                                certifications: patch(
                                                    data.certifications ?? [],
                                                    index,
                                                    { date: event.target.value },
                                                ),
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                        </FieldGroup>
                    </div>
                ))}
            </SectionList>
        </div>
    );
}

function patch<T>(list: T[], index: number, next: Partial<T>): T[] {
    return list.map((item, i) => (i === index ? { ...item, ...next } : item));
}

function SectionList({
    title,
    addLabel,
    onAdd,
    children,
}: {
    title: string;
    addLabel: string;
    onAdd: () => void;
    children: ReactNode;
}) {
    return (
        <Card size="sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>{title}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={onAdd}>
                    <PlusIcon data-icon="inline-start" />
                    {addLabel}
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">{children}</CardContent>
        </Card>
    );
}
