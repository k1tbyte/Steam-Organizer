using SteamOrganizer.Infrastructure;
using SteamOrganizer.Storages;
using System;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Animation;

namespace SteamOrganizer.MVVM.View.Controls
{
    public sealed partial class PincodeView : Grid
    {
        private static ThicknessAnimation InvalidAnim;
        private byte[] prevBytes;

        public Action<byte[]> OnValidated;

        public PincodeView(bool allowCancel = false)
        {
            InitializeComponent();
            code.OnFieldsFilled = Validate;
            Loaded += (sender, e) => code.GetTextBoxSegment(0).Focus();

            if (allowCancel)
            {
                BackButton.Visibility = Visibility.Visible;
            }

            if (App.Config.PinCodeKey == null)
            {
                Title.Text = "Please enter new PIN code";
                return;
            }

            if (App.Config.PinCodeRemainingAttempts == GlobalStorage.MaxPincodeAttempts)
                return;

            AttemptsText.Text        = App.Config.PinCodeRemainingAttempts.ToString();
            AttemptsTitle.Visibility = Visibility.Visible;
        }

        private void Validate()
        {
            var text = code.Text;

            if (text?.Length < 4)
                return;

            
            var bytes = Utils.HashData(Encoding.UTF8.GetBytes(text + Encoding.UTF8.GetString(App.EncryptionKey)));
            if (App.Config.PinCodeKey == null)
            {
                if(prevBytes == null)
                {
                    prevBytes = bytes;
                    Title.Text = "Confirm the entered code";
                    code.Unset();
                    code.GetTextBoxSegment(0).Focus();
                    return;
                }

                if(!CheckEqual(prevBytes, bytes))
                    return;
                
            }
            else if (!CheckEqual(App.Config.PinCodeKey, bytes))
            {
                AttemptsText.Text = (--App.Config.PinCodeRemainingAttempts).ToString();
                if(AttemptsTitle.Visibility != Visibility.Visible)
                {
                    AttemptsTitle.Visibility = Visibility.Visible;
                }
                if(App.Config.PinCodeRemainingAttempts <= 0)
                {
                    System.IO.File.Delete(App.ConfigPath);
                    Process.Start(Assembly.GetExecutingAssembly().Location).Dispose();
                    App.Shutdown();
                    return;
                }

                App.Config.Save();
                return;
            }

            if(App.Config.PinCodeRemainingAttempts != GlobalStorage.MaxPincodeAttempts)
            {
                App.Config.PinCodeRemainingAttempts = GlobalStorage.MaxPincodeAttempts;
                App.Config.Save();
            }

            App.MainWindowVM.CloseSplashWindow();
            OnValidated?.Invoke(bytes);
        }

        private bool CheckEqual(byte[] sourceHash, byte[] compareHash)
        {
            if (sourceHash.SequenceEqual(compareHash))
                return true;

            InvalidAnim = InvalidAnim ?? Utils.ShakingAnimation(code, repeat: 5);
            code.BeginAnimation(FrameworkElement.MarginProperty, InvalidAnim);
            code.Unset();
            code.GetTextBoxSegment(0).Focus();
            return false;
        }

        private void CancelClick(object sender, RoutedEventArgs e)
        {
            App.MainWindowVM.CloseSplashWindow();
            OnValidated?.Invoke(null);
        }
    }
}
