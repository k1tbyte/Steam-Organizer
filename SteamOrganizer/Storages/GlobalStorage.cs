using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Synchronization;
using SteamOrganizer.MVVM.Models;
using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace SteamOrganizer.Storages
{

    internal enum ESideBarState : byte
    {
        Hidden = 0,
        Open = 70,
        Expanded = 200
    }

    internal enum ESyncState : byte
    {
        None,
        Processing,
        Synchronized,
        Partial
    }

    [Serializable]
    internal sealed class GDriveInfo
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string DisplayName { get; set; }
        public string AvatarUrl { get; set; }
        public string EmailAddress { get; set; }
    }

    [Serializable]
    internal sealed class GlobalStorage
    {
        public const byte MaxPincodeAttempts = 5;

        [field: NonSerialized]
        public ObservableCollection<Account> Database { get; set; }

        /// <summary>
        /// Called only upon successful loading from a file
        /// </summary>
        [field: NonSerialized]
        public event Action DatabaseLoaded;


        #region UI Meta information
        /// <summary>
        /// To indicate whether you need to update the config
        /// </summary>
        [field: NonSerialized]
        public bool IsPropertiesChanged { get; set; }

        public ESideBarState SideBarState { get; set; } = ESideBarState.Expanded;

        public double MainWindowCornerRadius { get; set; } = 9d;
        #endregion

        public ObservableCollection<Tuple<string, ulong>> RecentlyLoggedIn { get; set; } = new ObservableCollection<Tuple<string, ulong>>();
        public bool MinimizeOnStart { get; set; }
        public bool Notifications { get; set; } = true;

        public long LastDatabaseUpdateTime { get; set; }
        public bool MinimizeToTray { get; set; }
        public bool MinimizeOnClose { get; set; }
        public string SteamApiKey { get; set; }

        /// <summary>
        /// Never = 0,
        /// Everyday = 1,
        /// EveryWeak = 2,
        /// EveryMonth = 3
        /// </summary>
        public byte AutoUpdateDbDelay { get; set; }

        /// <summary>
        /// Nothing = 0,
        /// Hide to tray = 1,
        /// Shutdown = 2,
        /// </summary>
        public byte ActionAfterLogin { get; set; }

        private byte[] _databaseKey;
        public byte[] DatabaseKey
        {
            get => _databaseKey;
            set
            {
                if (value.Length != 32)
                    throw new InvalidDataException(nameof(DatabaseKey));

                _databaseKey = value;
            }
        }

        public byte[] PinCodeKey { get; set; }
        public byte PinCodeRemainingAttempts { get; set; } = MaxPincodeAttempts;

        public GDriveInfo GDriveInfo { get; set; }
        public bool IsSyncEnabled { get; set; }
        public bool IsSyncAvailable => GDriveInfo != null && IsSyncEnabled;

        #region Storing/restoring
        public bool Save()
            => FileCryptor.Serialize(this, App.ConfigPath,App.MachineID);


        public static GlobalStorage Load()
        {
            if (File.Exists(App.ConfigPath))
            {
                if(FileCryptor.Deserialize(App.ConfigPath, out GlobalStorage result, App.MachineID))
                    return result;

                File.Delete(App.ConfigPath);
            }

            return new GlobalStorage();
        }


        public bool LoadDatabase()
        {
            if (!File.Exists(App.DatabasePath))
            {
                Database = new ObservableCollection<Account>();
                return DatabaseKey != null;
            }

            if (FileCryptor.Deserialize(App.DatabasePath, out ObservableCollection<Account> result, _databaseKey))
            {
                Database = result;
                DatabaseLoaded?.Invoke();
                return true;
            }

            Database = new ObservableCollection<Account>();
            return false;
        }

        [NonSerialized]
        private int WaitingCounter = 0;

        [NonSerialized]
        private CancellationTokenSource SyncCancellationToken;

        /// <param name="timeout">Useful for frequent save prompts like textboxes</param>
        public async void SaveDatabase()
        {

            // We need to check the counter to know about the calls that happen while waiting.
            if (WaitingCounter != 0)
            {
                // Maximum 2 wait cycles so it's not too long
                if (WaitingCounter < 2)
                {
                    WaitingCounter++;
                }

                return;
            }

            App.MainWindowVM.DatabaseSyncState = ESyncState.Processing;
            for (WaitingCounter = 1; WaitingCounter > 0; WaitingCounter--)
            {
                await Task.Delay(2000);
            }

            _databaseKey.ThrowIfNull();

            FileCryptor.Serialize(Database, App.DatabasePath, _databaseKey);
            App.Logger.Value.LogGenericDebug("Database is saved");

            // We simply cancel the previous upload operation and submit the new version again
            // (this will be extremely rare, since such a frequency of saves does not happen)
            SyncCancellationToken?.Cancel();
            SyncCancellationToken?.Dispose();

            SyncCancellationToken = new CancellationTokenSource();

            if (IsSyncAvailable && WebBrowser.IsNetworkAvailable)
            {
                //If you haven't logged in or haven't loaded
                if (GDriveManager.Instance == null && (!await GDriveManager.AuthorizeAsync(SyncCancellationToken.Token, false)) ||
                    !await GDriveManager.Instance.UploadFile(App.DatabasePath, SyncCancellationToken.Token))
                {
                    if(!SyncCancellationToken.IsCancellationRequested)
                        App.MainWindowVM.DatabaseSyncState = ESyncState.Partial;

                    return;
                }
            }

            try
            {
                App.MainWindowVM.DatabaseSyncState = ESyncState.Synchronized;
                await Task.Delay(2000, SyncCancellationToken.Token);
                App.MainWindowVM.DatabaseSyncState = ESyncState.None;
            }
            catch { return;  }

            SyncCancellationToken.Dispose();
            SyncCancellationToken = null;
        } 
        #endregion
    }
}
