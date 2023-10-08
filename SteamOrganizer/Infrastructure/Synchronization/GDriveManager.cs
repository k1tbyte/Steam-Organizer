using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using static Google.Apis.Drive.v3.DriveService;

namespace SteamOrganizer.Infrastructure.Synchronization
{
    internal sealed class GDriveManager
    {
        private const string FolderMimeType  = "application/vnd.google-apps.folder";
        private const string DefaultMimeType = "application/octet-stream";
        private const string SyncFolderName  = "Steam organizer";

        private readonly DriveService Service;
        private readonly File WorkingFolder;

        private GDriveManager(DriveService service)
        {
            Service = service;

            if ((WorkingFolder = GetSyncFolder()) == null)
            {
                WorkingFolder = CreateFile(SyncFolderName, FolderMimeType);
            }
        }

        internal async Task<User> GetLoggedUserInfo()
        {
            var request = Service.About.Get();
            request.Fields = "user";
            return (await request.ExecuteAsync()).User;
        }

        private File CreateFile(string name, string mimeType, string parentFolderId = null)
        {
            try
            {
                var file = Service.Files.Create(new File()
                {
                    Name = name,
                    MimeType = mimeType,
                    Parents = parentFolderId == null ? null : new[] { parentFolderId }
                }).Execute();

                return file;
            }
            catch (Exception e)
            {

            }

            return null;
        }

        public async Task UploadFile(System.IO.Stream stream, string name, CancellationToken token)
        {
            try
            {
                var metadata = new File()
                {
                    Name = name,
                    Parents = new[] { WorkingFolder.Id }
                };

                var file = await Service.Files.Create(metadata, stream, DefaultMimeType).UploadAsync(token);
            }
            catch { }
        }

        public async Task UploadFile(string path, CancellationToken token)
        {
            if (!System.IO.File.Exists(path))
                throw new InvalidOperationException();

            using (var stream = new System.IO.FileStream(path, System.IO.FileMode.Open))
            {
                await UploadFile(stream, System.IO.Path.GetFileName(path), token);
            }
        }

        private File GetSyncFolder()
        {
            var request = Service.Files.List();
            request.Q = $"mimeType = 'application/vnd.google-apps.folder' and name = '{SyncFolderName}' and 'root' in parents and trashed=false";
            var files = request.Execute();
            return files.Files.FirstOrDefault();
        }

        /// <param name="nameWithExt">Full file name</param>
        /// <param name="trashed">Include true/false files in the trash</param>
        /// <param name="orderBy">
        /// A comma-separated list of sort keys. Valid keys are 'createdTime', 'folder', 'modifiedByMeTime',
        /// 'modifiedTime', 'name', 'name_natural', 'quotaBytesUsed', 'recency', 'sharedWithMeTime', 'starred', and
        /// 'viewedByMeTime'. Each key sorts ascending by default, but can be reversed with the 'desc' modifier.
        /// Example usage: ?orderBy=folder,modifiedTime desc,name. | modifiedTime asc
        /// </param>
        public async Task<IList<File>> GetFilesListByName(string nameWithExt, bool trashed = false, string orderBy = null)
        {
            var request    = Service.Files.List();
            request.Q      = $"mimeType != '{FolderMimeType}' and '{WorkingFolder.Id}' in parents and name = '{nameWithExt}' {(trashed ? "" : "and trashed = false")}";
            request.Fields = "id, createdTime, modifiedTime, size";
            request.OrderBy = orderBy;
            var files      = await request.ExecuteAsync();
            return files.Files;
        }

        public async Task<File> GetFileById(string id)
        {
            var request    = Service.Files.Get(id);
            request.Fields = "name, createdTime, modifiedTime, size";
            return await request.ExecuteAsync();
        }


        public static async Task<GDriveManager> AuthorizeAsync(string clientId, string clientSecret, CancellationToken token)
        {
            var scopes = new string[] { Scope.DriveFile };

            var init = new GoogleAuthorizationCodeFlow.Initializer()
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = clientId,
                    ClientSecret = clientSecret
                },
                Scopes = scopes
            };

            if (App.Config.GDriveInfo?.RefreshToken != null && App.Config.GDriveInfo?.AccessToken != null)
            {
                try
                {
                    var service = new DriveService(new BaseClientService.Initializer()
                    {
                        HttpClientInitializer = new UserCredential(
                            new AuthorizationCodeFlow(init),
                            Environment.UserName,
                            new Google.Apis.Auth.OAuth2.Responses.TokenResponse
                            {
                                RefreshToken = App.Config.GDriveInfo.RefreshToken,
                                AccessToken  = App.Config.GDriveInfo.AccessToken,

                            }
                        )
                    });

                    return new GDriveManager(service);
                }
                catch
                {
                    //not valid
                    App.Config.GDriveInfo.RefreshToken = App.Config.GDriveInfo.AccessToken = null;
                    App.Config.Save();
                }
            }

            var credPath = System.IO.Path.Combine(App.CacheFolderPath, "_gdriveCredentialsTemp");

            var manager =  new GDriveManager(new DriveService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = await GoogleWebAuthorizationBroker.AuthorizeAsync(
                    init, scopes, Environment.UserName, token, new FileDataStore(credPath, true))
            }));

            System.IO.Directory.Delete(credPath, true);

            return manager;

        }
    }
}

