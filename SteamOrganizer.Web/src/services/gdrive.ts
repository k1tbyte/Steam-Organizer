import {gapi} from "gapi-script";
import {isAuthorized} from "@/services/gAuthService.ts";


interface IGdriveSaveParam{
    folderName:string,
    fileName:string,
    fileContent:string,
}
export const saveFile = async (param:IGdriveSaveParam):Promise<any> => {
    if (!isAuthorized) {
        console.log('User not signed in');
        return;
    }
    try {
        // Check if the folder exists
        const folderResponse = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${param.folderName}' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        let folderId:string="",
            folderFiles=folderResponse.result.files;
        if (folderFiles&&folderFiles.length > 0&&folderFiles[0].id) {
            folderId = folderFiles[0].id;
        } else {
            // Create folder if it doesn't exist
            const folderMetadata = {
                name: param.folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };
            const createFolderResponse = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id',
            });
            let createRes = createFolderResponse.result;
            if(createRes.id)
                folderId = createRes.id;
            if(folderId.length==0)
                throw new Error("folder creation error");
        }


        const fileResponse = await gapi.client.drive.files.list({
            q: `name='${param.fileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        let fileId,
            fileExist = fileResponse.result.files;
        if (fileExist&&fileExist.length > 0) {
            fileId=fileExist[0].id;
        }

        if (fileId) {
            await deleteFile(fileId);
            await createTextFile(param.fileName,param.fileContent,folderId)
            console.log('File updated successfully');
        } else {
            await createTextFile(param.fileName,param.fileContent,folderId)
            console.log('File created successfully');
        }
        console.log('File saved successfully');
    } catch (error) {
        console.error('Error saving file:', error);
    }
};

const createTextFile = async (fileName: string, content: string,folderId:string): Promise<any> => {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'text/plain',
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n\r\n' +
        content +
        closeDelimiter;

    const request = gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: {
            uploadType: 'multipart',
        },
        headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
    });

    return request.execute((response) => response);
};
const deleteFile = async (fileId: string): Promise<any> => {
    const request = gapi.client.request({
        path: `/drive/v3/files/${fileId}`,
        method: 'DELETE',
    });

    return request.execute((response) => response);
};