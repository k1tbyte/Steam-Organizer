using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using SteamOrganizer.Helpers.Encryption;
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

        private const string ClientId     = "r|GMP_]opyd\\\u0018!4&>|F\0E\bES-=1\u001d\u0002'C\u0019w$\u0010\fV[W./|>\u0012Cf&2#9X\u0014_\0\u0017]'=!\u0010\u0004%\u0018\u00021*\u001a\u000eO\r\u00015";
        private const string ClientSecret = "\u0002\07)16C5\u0011!\u0002#`|\u0011!\nr$\u0005e)\u0018c\u001d{\b:;\u0003\0!h\u001b%";

        private readonly DriveService Service;
        private File WorkingFolder;

        public static GDriveManager Instance { get; private set; }

        private GDriveManager(DriveService service)
        {
            Service = service;
        }

        private async Task Init()
        {
            var request = Service.Files.List();
            request.Q = $"mimeType = 'application/vnd.google-apps.folder' and name = '{SyncFolderName}' and 'root' in parents and trashed=false";
            request.OrderBy = "createdTime asc";
            WorkingFolder = (await request.ExecuteAsync())?.Files?.FirstOrDefault();

            if (WorkingFolder == null)
            {
                WorkingFolder = await CreateFile(SyncFolderName, FolderMimeType);
            }
        }

        internal async Task<User> GetLoggedUserInfo()
        {
            var request = Service.About.Get();
            request.Fields = "user";
            return (await request.ExecuteAsync()).User;
        }

        private async Task<File> CreateFile(string name, string mimeType, string parentFolderId = null)
        {
            try
            {
                var file = Service.Files.Create(new File()
                {
                    Name = name,
                    MimeType = mimeType,
                    Parents = parentFolderId == null ? null : new[] { parentFolderId }
                }).ExecuteAsync();

                return await file;
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

        public async Task<bool> UploadFile(string path, CancellationToken token)
        {
            try
            {
                if (!System.IO.File.Exists(path))
                    throw new InvalidOperationException();

                using (var stream = new System.IO.FileStream(path, System.IO.FileMode.Open))
                {
                    await UploadFile(stream, System.IO.Path.GetFileName(path), token);
                }

                return true;
            }
            catch(Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }

            return false;
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


        public static async Task<bool> AuthorizeAsync(CancellationToken token ,bool openExternal = true)
        {
            var scopes = new string[] { Scope.DriveFile };

            var init = new GoogleAuthorizationCodeFlow.Initializer()
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = EncryptionTools.XorString(App.EncryptionKey,ClientId),
                    ClientSecret = EncryptionTools.XorString(App.EncryptionKey,ClientSecret)
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

                    Instance = new GDriveManager(service);
                    await Instance.Init();
                    return true;
                }
                catch (Exception e)
                {
                    //not valid
                    App.Logger.Value.LogHandledException(e);
                    App.Config.GDriveInfo.RefreshToken = App.Config.GDriveInfo.AccessToken = null;
                    App.Config.Save();
                }
            }

            if (!openExternal)
                return false;

            var credPath = System.IO.Path.Combine(App.CacheFolderPath, "_gdriveCredentialsTemp");
            UserCredential credentials;

            try
            {
                credentials = await GoogleWebAuthorizationBroker.AuthorizeAsync(
                    init, scopes, Environment.UserName, token, new FileDataStore(credPath, true));
            }
            catch(OperationCanceledException)
            {
                return false;
            }


            Instance =  new GDriveManager(new DriveService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credentials
            }));

            await Instance.Init();

            var aboutInfo = await Instance.GetLoggedUserInfo();

            App.Config.GDriveInfo = new Storages.GDriveInfo
            {
                RefreshToken = credentials.Token.RefreshToken,
                AccessToken  = credentials.Token.AccessToken,
                AvatarUrl    = aboutInfo.PhotoLink.IndexOf("default",StringComparison.OrdinalIgnoreCase) >= 0 ? "\\Resources\\Images\\google.bmp" : aboutInfo.PhotoLink,
                DisplayName  = aboutInfo.DisplayName,
                EmailAddress = aboutInfo.EmailAddress
            };

            App.Config.Save();

            System.IO.Directory.Delete(credPath, true);

            return true;

        }

        public static void LogOut()
        {
            Instance?.Service.Dispose();
            Instance = null;
            if (App.Config.GDriveInfo != null)
            {
                App.Config.GDriveInfo = null;
                App.Config.Save();
            }
        }
    }
}

