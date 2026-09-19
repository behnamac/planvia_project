import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";
import {PROJECT_KEY_PREFIX} from "./constants";

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId ?
        await uploadImageToHosting({ hosting, url: item.sourceImage, projectId, label: 'source', }) : null;

    const hostedRender = projectId && item.renderedImage ?
        await uploadImageToHosting({ hosting, url: item.renderedImage, projectId, label: 'rendered', }) : null;

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage)
        ? item.sourceImage
        : ''
    );

    if(!resolvedSource) {
        console.warn('Failed to host source image, skipping save.')
        return null;
    }

    const resolvedRender = hostedRender?.url
        ? hostedRender?.url
        : item.renderedImage && isHostedUrl(item.renderedImage)
            ? item.renderedImage
            : undefined;

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    }

    try {
        const stored = {
            ...payload,
            visibility,
            updatedAt: new Date().toISOString(),
        };

        await puter.kv.set(`${PROJECT_KEY_PREFIX}${projectId}`, stored);

        return stored as DesignItem;
    } catch (e) {
        console.error('Failed to save project', e);
        return null;
    }
}

export const getProjects = async (): Promise<DesignItem[]> => {
    try {
        const entries = await puter.kv.list(PROJECT_KEY_PREFIX, true);

        return (Array.isArray(entries) ? entries : [])
            .map(({ value }) => ({ ...(value as DesignItem), isPublic: true }));
    } catch (e) {
        console.error('Failed to get projects', e);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }): Promise<DesignItem | null> => {
    try {
        const project = await puter.kv.get(`${PROJECT_KEY_PREFIX}${id}`);

        return (project as DesignItem) ?? null;
    } catch (e) {
        console.error('Failed to fetch project', e);
        return null;
    }
};
