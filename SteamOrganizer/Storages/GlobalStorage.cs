using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using SteamOrganizer.MVVM.Models;
using System.Threading.Tasks;
using System.IO;
using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using System.ComponentModel;
using static System.Net.Mime.MediaTypeNames;

namespace SteamOrganizer.Storages
{

    internal enum ESideBarState : byte
    {
        Hidden = 0,
        Open = 70,
        Expanded = 200
    }

    [Serializable]
    internal class GlobalStorage
    {
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

        public bool MinimizeOnStart { get; set; }
        public bool MinimizeToTray { get; set; }

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

        public bool Save()
            =>  FileCryptor.Serialize(this, App.ConfigPath, Utils.GetLocalMachineGUID());
        

        public static GlobalStorage Load()
        {
            if (File.Exists(App.ConfigPath) &&
                FileCryptor.Deserialize(App.ConfigPath,out GlobalStorage result,Utils.GetLocalMachineGUID()))
            {
                return result;
            }

            return new GlobalStorage();
        }


        public bool LoadDatabase()
        {
            if(!File.Exists(App.DatabasePath))
            {
                Database = new ObservableCollection<Account>();
                return true;
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

        public void SaveDatabase()
        {
            _databaseKey.ThrowIfNull();

            FileCryptor.Serialize(Database, App.DatabasePath, _databaseKey);
        }
    }
}
