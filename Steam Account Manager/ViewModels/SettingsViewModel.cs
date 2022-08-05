using System;
using System.Windows;
using Steam_Account_Manager.ViewModels.View;
using Steam_Account_Manager.Infrastructure;

namespace Steam_Account_Manager.ViewModels
{
    internal class SettingsViewModel : ObservableObject
    {
        private bool _Theme_Key;
        private bool _AutoClose_Key;
        private bool _noConfirmMode_Key;
        private bool _TakeAccountInfo_Key;
        public RelayCommand SaveChangesCommand { get; set; }
        public bool TakeAccountInfo
        {
            get { return _TakeAccountInfo_Key; }
            set
            {
                _TakeAccountInfo_Key = value;
                OnPropertyChanged(nameof(_TakeAccountInfo_Key));
            }
        }

        public bool ThemeMode
        {
            get { return _Theme_Key; }
            set
            {
                _Theme_Key = value;
                OnPropertyChanged(nameof(_Theme_Key));
            }
        }

        public bool AutoCloseMode
        {
            get { return _AutoClose_Key; }
            set
            {
                _AutoClose_Key = value;
                OnPropertyChanged(nameof(_AutoClose_Key));
            }
        }

        public bool NoConfirmMode
        {
            get { return _noConfirmMode_Key; }
            set
            {
                _noConfirmMode_Key = value;
                OnPropertyChanged(nameof(_noConfirmMode_Key));
            }
        }

        public SettingsViewModel()
        {
            Config config = Config.GetInstance();
            if (config.Theme == Config.Themes.Light)
                ThemeMode = true;
            else if (config.Theme == Config.Themes.Dark)
                ThemeMode = false;
            AutoCloseMode = config.AutoClose;
            NoConfirmMode = config.NoConfirmMode;
            TakeAccountInfo = config.TakeAccountInfo;

            SaveChangesCommand = new RelayCommand(o =>
            {
                config.AutoClose = AutoCloseMode;
                config.Theme = config.SupportedThemes[Convert.ToInt32(ThemeMode)];
                config.TakeAccountInfo = TakeAccountInfo;
                config.NoConfirmMode = NoConfirmMode;
                config.SaveChanges();
            });
        }
    }
}
