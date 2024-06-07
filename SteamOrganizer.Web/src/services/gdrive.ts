
import {gapi} from "gapi-script";
import {isAuthorized} from "@/services/gAuthService.ts";


export const saveFile = async () => {
    if (!isAuthorized) {
        console.log('User not signed in');
        return;
    }

    const folderName = 'accManager';
    const fileName = 'info.txt';
    const fileContent = 'Hello World'; // Content to be saved in the file

    try {
        // Check if the folder exists
        const folderResponse = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        let folderId;
        if (folderResponse.result.files.length > 0) {
            folderId = folderResponse.result.files[0].id;
        } else {
            // Create folder if it doesn't exist
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };
            const createFolderResponse = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id',
            });
            folderId = createFolderResponse.result.id;
        }

        gapi.client.drive.files.create( { uploadType: "media" }, /*body:*/ { ?? } )
        // Check if the file exists
        const fileResponse = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        let fileId;
        if (fileResponse.result.files.length > 0) {
            fileId = fileResponse.result.files[0].id;
        }

        const fileMetadata = {
            name: fileName,
            parents: [folderId],
            mimeType:'text/plain',
        };

        const media = {
            mimeType: 'text/plain',
            body: new Blob([fileContent], { type: 'text/plain' }),
        };

        if (fileId) {
            // Update the existing file
            await gapi.client.drive.files.update({
                fileId: fileId,
                resource: fileMetadata,
                media: media,
            });
            console.log('File updated successfully');
        } else {
            // Create a new file
            await gapi.client.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            //console.log(JSON.stringify(res));
        }

        console.log('File saved successfully');
    } catch (error) {
        console.error('Error saving file:', error);
    }
};