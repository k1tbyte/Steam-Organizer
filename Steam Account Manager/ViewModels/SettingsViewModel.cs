using System;
using Steam_Account_Manager.Infrastructure;

namespace Steam_Account_Manager.ViewModels
{
    internal class SettingsViewModel : ObservableObject
    {
        private bool[] _themeKey = { true, false, false };
        private bool[] _localeKey = { true, false, false };
        private bool _autoCloseKey;
        private bool _noConfirmModeKey;
        private bool _takeAccountInfoKey;
        public RelayCommand SaveChangesCommand { get; set; }

        public bool TakeAccountInfo
        {
            get => _takeAccountInfoKey;
            set
            {
                _takeAccountInfoKey = value;
                OnPropertyChanged(nameof(_takeAccountInfoKey));
            }
        }

        public bool[] LocaleMode
        {
            get => _localeKey;
            set
            {
                _localeKey = value;
                OnPropertyChanged();
            }
        }

        public bool[] ThemeMode
        {
            get => _themeKey;
            set
            {
                _themeKey = value;
                OnPropertyChanged();
            }
        }

        public bool AutoCloseMode
        {
            get => _autoCloseKey;
            set
            {
                _autoCloseKey = value;
                OnPropertyChanged(nameof(_autoCloseKey));
            }
        }

        public bool NoConfirmMode
        {
            get => _noConfirmModeKey;
            set
            {
                _noConfirmModeKey = value;
                OnPropertyChanged(nameof(_noConfirmModeKey));
            }
        }

        public SettingsViewModel()
        {
            var config = Config.GetInstance();

            #region Считывание языка
            for (int i = 0; i < 3; i++)
                LocaleMode[i] = false;
            if (config.Language == config.SupportedLanguages[(int)Config.Languages.English] || config.Language == null)
                LocaleMode[0] = true;
            else if (config.Language == config.SupportedLanguages[(int)Config.Languages.Russian])
                LocaleMode[1] = true;
            else if (config.Language == config.SupportedLanguages[(int)Config.Languages.Ukrainian])
                LocaleMode[2] = true; 
            #endregion

            #region Считывание темы

            for (int i = 0; i < 3; i++)
                ThemeMode[i] = false;
            if (config.Theme == Config.Themes.Dark)
                ThemeMode[0] = true;
            else if (config.Theme == Config.Themes.Light)
                ThemeMode[1] = true;
            else if (config.Theme == Config.Themes.Nebula)
                ThemeMode[2] = true;
            
            #endregion


            SaveChangesCommand = new RelayCommand(o =>
            {
                byte i = 0;
                for (; ; i++) 
                    if (ThemeMode[i])
                    {
                        config.Theme = config.SupportedThemes[Convert.ToInt32(i)];
                        break;
                    }

                for (i=0; ; i++)
                    if (LocaleMode[i])
                    {
                        config.Language = config.SupportedLanguages[Convert.ToInt32(i)];
                        break;
                    }
                config.NoConfirmMode = NoConfirmMode;
                config.SaveChanges();
            });
        }
    }
}
