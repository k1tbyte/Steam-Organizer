import { gapi } from 'gapi-script';

type File = {
    id: string;
    kind?: string;
    mimeType?: string;
    name: string;
    createdTime?: string;
}

type FileList = {
    files?: File[]
}

type GDriveResponse<T> = {
    result?: T;
    status: number;
    statusText?: string;
}

const appFolderName = "SteamOrganizer";
let folders = new Map<string,string>()

const resolveFolderId = async (name:string, parentId:string = "root")=>{
    let folderResponse = await getFileMetadata(
        `mimeType = 'application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`,
        'id, name'
    )
    const id = folderResponse.result?.files?.[0]?.id ?? await createFolder(name,parentId);
    folders.set(name, id);
    return id;
}

const createFolder = async (name: string, parentId: string = "root") => {
    const metadata = {
        'name': name,
        'parents': [parentId],
        'mimeType': 'application/vnd.google-apps.folder'
    };

    const request = await gapi.client.request({
        'path': '/drive/v3/files',
        'method': 'POST',
        'body': JSON.stringify(metadata)
    });

    return request.result.id as string;
}

const getFolder = async (path: string) => {
    let parentId = "root"
    const chunks = path.split('/').filter(o => o.length > 0)
    let reset = false;

    for (let i = 0; i < chunks.length; i++) {
        try {
            parentId = folders.get(chunks[i]) ?? await resolveFolderId(chunks[i], parentId)
        }
        catch {
            if(reset) {
                throw new Error("Cannot create folder at path: " + path)
            }

            parentId = "root"
            reset = true;
            folders.clear()
            i = -1;
        }
    }

    return parentId
}

const getFileMetadata = (query: string, fields: string, limit: number = 1, pageToken: string = "") =>
    gapi.client.request({
        path: "https://www.googleapis.com/drive/v3/files",
        method: "GET",
        params: {
            q: query,
            fields: `files(${fields})`,
            pageSize: limit,
            pageToken: pageToken,
            orderBy: "createdTime asc"
        }
    }) as unknown as Promise<GDriveResponse<FileList>>

export const deleteFile = async (fileId: string) =>
    gapi.client.request({
        path: `/drive/v3/files/${fileId}`,
        method: 'DELETE',
    }) as unknown as Promise<GDriveResponse<any>>;

export const getFileList = async (path: string, limit: number, pageToken: string = "") => {
    const folderId = await getFolder(`${appFolderName}/${path}`)
    return getFileMetadata(`mimeType = 'application/json' and '${folderId}' in parents and trashed=false`,
        'id, name, createdTime',limit,pageToken)
}

export const getFileJson = async <T>(id: string) => {
    const response = await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${id}`,
        method: "GET",
        params: {
            alt: 'media',
        }
    })
    return response.status === 200 ?  JSON.parse(response.body) as T : undefined;
}

export const uploadFileJson = async (path: string, content: any) => {
    const boundary = '--steamOrganizer';
    const delimiter = `\n--${boundary}\nContent-Type: application/json\n\n`;
    const name = path.split('/').slice(-1)[0]
    path = `${appFolderName}/${path}`.replace(name,"")

    const metadata = {
        name: name,
        parents: [await getFolder(path)],
        mimeType: 'application/json',
    };

    const body =
        delimiter +
        JSON.stringify(metadata) +
        delimiter +
        JSON.stringify(content) +
        `\n--${boundary}--`;

    const send = () =>  (gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: {
            uploadType: 'multipart',
        },
        headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: body,
    }) as unknown as Promise<GDriveResponse<File>>)

    for(let i = 0; i < 2; i++) {
        const response = await send();
        if(response.status === 200) {
            return response
        }

        if(response.status === 404 && i === 0) {
            folders.clear();
            metadata.parents = [await getFolder(path)]
        }
    }
    throw new Error("Cannot create file")
};