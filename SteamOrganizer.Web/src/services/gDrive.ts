import {gapi} from "gapi-script";

type File = {
    id: string;
    kind?: string;
    mimeType?: string;
    name: string;
}

type FileList = {
    files?: File[]
}

type GDriveResponse<T> = {
    result?: T;
    status: number;
    statusText?: string;
}

const rootFolderName = "SteamOrganizer";

export const getFile = (query: string) =>
    gapi.client.request({
        path: "https://www.googleapis.com/drive/v3/files",
        method: "GET",
        params: {
            q: query,
            fields: 'files(id, name)',
            pageSize: 1
        }
    }) as unknown as Promise<GDriveResponse<FileList>>

export const deleteFile = async (fileId: string) =>
    gapi.client.request({
        path: `/drive/v3/files/${fileId}`,
        method: 'DELETE',
    }) as unknown as Promise<GDriveResponse<any>>;

const uploadMultipart = async (name: string, content: any, rootId: string) => {
    const boundary = '--steamOrganizer';
    const delimiter = `\n--${boundary}\nContent-Type: application/json\n\n`;

    const metadata = {
        name: name,
        parents: [rootId],
        mimeType: 'application/json',
    };

    const body =
        delimiter +
        JSON.stringify(metadata) +
        delimiter +
        JSON.stringify(content) +
        `\n--${boundary}--`;

    return (gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: {
            uploadType: 'multipart',
        },
        headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: body,
    }) as unknown as Promise<GDriveResponse<File>>);
};

const createRootFolder = async () => {
    const metadata = {
        'name': rootFolderName,
        'mimeType': 'application/vnd.google-apps.folder'
    };

    const request = await gapi.client.request({
        'path': '/drive/v3/files',
        'method': 'POST',
        'body': JSON.stringify(metadata)
    });

    return request.result.id as string;
}

export const saveFile = async (name: string, data: any):Promise<any> => {
    let folderResponse = await getFile(
        `mimeType = 'application/vnd.google-apps.folder' and name='${rootFolderName}' and 'root' in parents and trashed=false`
    )


    const rootId = folderResponse.result?.files?.[0]?.id ?? await createRootFolder()
    return (await uploadMultipart(name,data, rootId)).result
};

