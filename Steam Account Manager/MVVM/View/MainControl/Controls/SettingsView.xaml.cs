﻿using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{
    public partial class SettingsView : UserControl
    {
        private readonly Regex CharsDigitsRegex = new Regex("^[a-zA-Z0-9]+\\z");
        public SettingsView() => InitializeComponent();
        
        private void UserControl_Loaded(object sender, RoutedEventArgs e)
        {
            IsPassword.IsChecked = !string.IsNullOrEmpty(Config.Properties.Password);
            CryptoKey.Text = Config.Properties.UserCryptoKey == Config.GetDefaultCryptoKey ? "" : Config.Properties.UserCryptoKey;
        }

        #region Encryption key events
        private void ApiKey_TextChanged(object sender, TextChangedEventArgs e)
        {
            var box = (sender as TextBox);
            if (!CharsDigitsRegex.IsMatch(box.Text))
            {
                box.Text = Regex.Replace(box.Text, "[^0-9a-zA-Z]+", string.Empty);
                box.CaretIndex = box.Text.Length;
            }


            if (!string.IsNullOrEmpty(box.Text) && box.Text.Length < 32)
            {
                ErrorApiKey.Visibility = Visibility.Visible;
                return;
            }

            ErrorApiKey.Visibility = Visibility.Collapsed;
            Config.Properties.WebApiKey = box.Text;
        }
        private void GenerateKey_Click(object sender, RoutedEventArgs e)
        {
            Config.UpdateEncryption(Utils.Common.GenerateCryptoKey());
            CryptoKey.Text = Config.Properties.UserCryptoKey;
        }
        private void ResetKey_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(CryptoKey.Text) && Config.Properties.UserCryptoKey == Config.GetDefaultCryptoKey)
                return;

            CryptoKey.Text = "";
            Config.UpdateEncryption(Config.GetDefaultCryptoKey);
        } 
        #endregion

        #region App password events
        private void IsPassword_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            e.Handled = true;

            if (string.IsNullOrEmpty(Config.Properties.Password))
            {
                if (IsPassword.IsChecked == false)
                {
                    IsPassword.IsChecked = true;
                    PasswordError.Visibility = PasswordPanel.Visibility = Visibility.Visible;
                }
                else
                {
                    IsPassword.IsChecked = false;
                    PasswordPanel.Visibility = Visibility.Collapsed;
                    (this.DataContext as SettingsViewModel).Password = null;
                }
            }
            else
            {
                var result = Utils.Presentation.OpenDialogWindow(new AuthenticationWindow(false));

                if (result == null || result == false)
                    return;

                Config.Properties.Password = null;
                IsPassword.IsChecked = false;
                Config.SaveProperties();
            }


        }
        private void SetPassword_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty((this.DataContext as SettingsViewModel).Password))
                return;

            Config.Properties.Password = Utils.Common.Sha256((this.DataContext as SettingsViewModel).Password + Config.GetDefaultCryptoKey);
            (this.DataContext as SettingsViewModel).Password = null;
            PasswordPanel.Visibility = Visibility.Collapsed;
            Config.SaveProperties();
        } 
        #endregion

    }
}