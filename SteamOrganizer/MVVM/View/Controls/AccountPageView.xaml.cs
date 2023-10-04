using SteamKit2;
using SteamOrganizer.Helpers;
using SteamOrganizer.Helpers.Encryption;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.ViewModels;
using System;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountPageView : Grid
    {
        private AccountPageViewModel ViewModel;
        private bool isLoginToolTipShown;

        internal AccountPageView()
        {
            InitializeComponent();
        }

        internal void OpenPage(Account account)
        {
            this.DataContext         = ViewModel = new AccountPageViewModel(this, account);
            IDComboBox.SelectedIndex = 0;
            LinksExpander.IsExpanded = false;
            UpdateButton.Visibility  = account.Login == null ? Visibility.Collapsed : Visibility.Visible;
            Scroll.ScrollToTop();
        }

        internal void Dispose()
        {
            ViewModel.Dispose();
        }

        private void OpenOtherLink(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if(sender is TextBlock block)
            {
                ViewModel.CurrentAccount.OpenInBrowser($"/{block.Text.ToLowerInvariant()}");
            }

        }

        private async void ShowRevocationCode(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            var control    = sender as TextBlock;

            if (control.Effect == null)
                return;

            var effect     = control.Effect;
            var text       = control.Text;
            control.Effect = null;
            control.Text   = EncryptionTools.XorString(ViewModel.CurrentAccount.Authenticator.Revocation_code);
            await Task.Delay(3000);
            control.Effect = effect;
            control.Text   = text;
        }


        private async void LoginPreviewTextInput(object sender, System.Windows.Input.TextCompositionEventArgs e)
        {
            e.Handled = true;
            if (isLoginToolTipShown)
            {
                return;
            }

            isLoginToolTipShown = true;
            await Utils.OpenAutoClosableToolTip(sender as FrameworkElement, App.FindString("apv_uniq_login_tip"), 3000);
            isLoginToolTipShown = false;
        }

        private void OpenContextMenu(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            var element                     = sender as FrameworkElement;
            element.ContextMenu.DataContext = element.ContextMenu.DataContext ?? this.DataContext;
            element.ContextMenu.Tag         = element.DataContext;
            e.Handled                       = element.ContextMenu.IsOpen = true;
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            SearchPopup.OpenPopup(sender as FrameworkElement, System.Windows.Controls.Primitives.PlacementMode.Bottom);
        }

        private void PhonePreviewTextInput(object sender, System.Windows.Input.TextCompositionEventArgs e)
        {
            if (!e.Text.All(char.IsDigit))
                e.Handled = true;
        }

        private void TextBox_LostFocus(object sender, RoutedEventArgs e)
        {
            var textbox       = sender as TextBox;
            object content    = textbox.Text.Length == 0 ? null : textbox.Text;
            var binding       = textbox.GetBindingExpression(TextBox.TextProperty);
            var prop          = binding.ResolvedSource.GetType().GetProperty(binding.ResolvedSourcePropertyName);
            var value         = prop.GetValue(binding.ResolvedSource);

            if (content == value || (string)content == value?.ToString())
                return;

            if (prop.PropertyType != typeof(string))
            {
                var converter = TypeDescriptor.GetConverter(prop.PropertyType);
                content       = content == null ? Activator.CreateInstance(prop.PropertyType) : converter.ConvertFromString(content as string);
            }

            prop.SetValue(binding.ResolvedSource, content);
            App.Config.SaveDatabase();
        }
    }
}
