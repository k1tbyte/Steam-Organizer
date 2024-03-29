﻿using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.ViewModels;
using System;
using System.Text;
using System.Threading.Tasks;
using System.Web.UI.WebControls;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public sealed partial class AuthenticationView : StackPanel
    {
        private string FilePath { get; set; }
        private readonly Action<object, byte[]> ActionIfSuccess;
        private readonly Action PasswordRegistered;

        private bool IsInitialSetup;
        private bool IsReset;

        public AuthenticationView(string filePath, Action<object, byte[]> successLoadAction,bool allowReset,string tipMsg = null)
        {
            this.ActionIfSuccess      = successLoadAction;
            this.FilePath             = filePath;

            InitializeComponent();
            Tip.Text = tipMsg ?? App.FindString("av_authInfo");
            if (allowReset)
                Reset.Visibility = System.Windows.Visibility.Visible;
        }

        public AuthenticationView(Action passwordSuccessRegistered)
        {
            InitializeComponent();
            SetupNew();
            PasswordRegistered = passwordSuccessRegistered;
        }

        private void SetupNew()
        {
            Sign.Content     = App.FindString("word_confirm");
            Tip.Text         = App.FindString("av_newPassword");
            Reset.Visibility = System.Windows.Visibility.Collapsed;
            IsInitialSetup   = true;
        }

        private async Task SetError(string key)
        {
            if (!string.IsNullOrEmpty(Error.Text))
                return;

            Error.Text = App.FindString(key);
            await Task.Delay(3000);
            Error.Text = null;
        }

        private async void OnSignIn(object sender, System.Windows.RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(PassBox.Password))
                return;

            var password = PassBox.Password;

            // We just need to initialize the key for future database saves.
            if (IsInitialSetup)
            {
                if(PassBox.Password.Length < 8)
                {
                    _ = SetError("av_tooShortPass");
                    return;
                }

                Sign.Content           = App.FindString("av_generation");


                App.Config.DatabaseKey = await Utils.InBackgroundAwait(() => FileCryptor.GenerateEncryptionKey(password, App.EncryptionKey));
                password = null;
                PassBox.Clear();
                App.Config.Save();
                App.MainWindowVM.ClosePopupWindow(true);
                PasswordRegistered?.Invoke();
                return;
            }

            FilePath.ThrowIfNullOrEmpty();

            var tmpTitle = Sign.Content;
            Sign.Content = App.FindString("av_decryption");

            var bytes = await Utils.InBackgroundAwait(() => FileCryptor.GenerateEncryptionKey(password, App.EncryptionKey));
            PassBox.Clear();

            Sign.Content = tmpTitle;

            // The file may or may not have been intentionally deleted
            if (!System.IO.File.Exists(FilePath))
            {
                await SetError("file_not_found");
                App.MainWindowVM.ClosePopupWindow();
                return;
            }

            if(!FileCryptor.Deserialize(FilePath,out object result, bytes))
            {
                _ = SetError("invalid_pass");
                return;
            }
    
            // It's ok, we do what we want with the callback
            ActionIfSuccess?.Invoke(result, bytes);
            App.MainWindowVM.ClosePopupWindow(true);
        }

        private void OnReset(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (!IsReset)
            {
                Tip.Text = App.FindString("av_resetInfo");
                IsReset = true;
                return;
            }

            System.IO.File.Delete(FilePath);


            SetupNew();
        }
    }
}
