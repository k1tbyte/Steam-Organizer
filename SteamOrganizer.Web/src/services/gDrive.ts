import {gapi} from "gapi-script";

type File = {
    id: string;
    kind?: string;
    mimeType?: string;
    name: string;
    createdTime?:string;
}

type FileList = {
    files?: File[]
}

type GDriveResponse<T> = {
    result?: T;
    status?: number;
    statusText?: string;
    nextPageToken?:string;
}

const rootFolderName = "SteamOrganizer";
const backupFolderName = "Backups";
export const enum fileTypes{
    backup,
    cfg,
}

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

export const gDriveGetBackupsInfo =async (pageSize:number=100,pageToken:string="") =>{
    const rootId = await getFolderId(rootFolderName,'root');
    const backupsId = await getFolderId(backupFolderName,rootId);
    return gapi.client.request({
        path: "https://www.googleapis.com/drive/v3/files",
        method: "GET",
        params: {
            q: `mimeType = 'application/json' and '${backupsId}' in parents and trashed=false`,
            fields: 'files(id, name,createdTime)',
            pageSize: pageSize
        }
    })as unknown as Promise<GDriveResponse<FileList>>;
}


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
const createFolder = async (name:string,parentId:string) => {
    const metadata = {
        'name': name,
        'parents':[parentId],
        'mimeType': 'application/vnd.google-apps.folder'
    };

    const request = await gapi.client.request({
        'path': '/drive/v3/files',
        'method': 'POST',
        'body': JSON.stringify(metadata)
    });

    return request.result.id as string;
}
const getFolderId = async (name:string,parentId:string)=>{
    let folderResponse = await getFile(
        `mimeType = 'application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`
    )
    return folderResponse.result?.files?.[0]?.id ?? await createFolder(name,parentId);
}

const getBackupIdByName = async (fileName:string) =>{
    const rootId = await getFolderId(rootFolderName,'root');
    const backupsId = await getFolderId(backupFolderName,rootId);
    const fileResponse = await getFile(
        `mimeType='application/json' and name contains '${fileName}' and '${backupsId}' in parents`);
    return fileResponse.result?.files?.[0]?.id;
}

export const gDriveSaveFile = async (name: string, data: any,type:fileTypes):Promise<any> => {
    const rootId = await getFolderId(rootFolderName,'root')
    switch (type){
        case fileTypes.backup:
            const backupsId = await getFolderId(backupFolderName,rootId);
            return (await uploadMultipart(name,data, backupsId)).result;
        default:
            return (await uploadMultipart(name,data, rootId)).result;
    }
}
export const gDriveGetFileContent = async (fileId:string):Promise<string>=> {
    let body="";
    gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${fileId}`,
        method: "GET",
        params: {
            alt: 'media',
        }
    }).then((response: any) => {
        body=response.body;
    }, (error: any) => {
         console.log(JSON.stringify(error, null, 2));
    });
    return body;
};
