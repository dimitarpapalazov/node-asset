import { db } from '../db/index.js';
import { projects } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export interface CreateProjectInput {
    name: string;
    userId: string;
}

export type Project = typeof projects.$inferSelect;

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const [project] = await db.insert(projects)
        .values({
            name: input.name,
            userId: input.userId,
        })
        .returning();

    return project;
};

export const getProjectById = async (id: string): Promise<Project | undefined> => {
    const [project] = await db.select()
        .from(projects)
        .where(eq(projects.id, id));

    return project;
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    return await db.select()
        .from(projects)
        .where(eq(projects.userId, userId));
};

export const updateProject = async (id: string, userId: string, name: string): Promise<Project | undefined> => {
    const [project] = await db.update(projects)
        .set({ name, updatedAt: new Date() })
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

    return project;
};

export const deleteProject = async (id: string, userId: string): Promise<void> => {
    await db.delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)));
};
