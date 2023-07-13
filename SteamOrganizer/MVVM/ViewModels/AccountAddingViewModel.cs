using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.MVVM.Models;
using System;
using System.Threading.Tasks;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountAddingViewModel : ObservableObject
    {
        private static readonly string[] AnimationChunks = new string[] { ".", ". .", ". . ." };
        private readonly AccountAddingView View;
        
        private bool IsLoading = false;
        public AsyncRelayCommand AddCommand { get; private set; }
            
        public string Login { get; set; }
        public string Password { get; set; }
        public string ID { get; set; }

        private async Task<(bool,ulong)> ValidateData()
        {
            ulong id = 0;
            if (string.IsNullOrEmpty(Login))
            {
                View.Error.Text = App.FindString("adv_err_login_empty");
            }
            else if (Login.Contains(" "))
            {
                View.Error.Text = App.FindString("adv_err_login_spaces");
            }
            else if (Login.Length < 3 || Login.Length > 32)
            {
                View.Error.Text = App.FindString("adv_err_login_len");
            }
            else if (string.IsNullOrEmpty(Password))
            {
                View.Error.Text = App.FindString("adv_err_pass_empty");
            }
            else if (Password.Length < 6 || Password.Length > 50)
            {
                View.Error.Text = App.FindString("adv_err_pass_len");
            }
            else if (!string.IsNullOrEmpty(ID))
            {
                LoadingAnimation();
                if ((id = await SteamIdConverter.ToSteamID64(ID.Replace(" ", ""))) == 0)
                {
                    View.Error.Text = App.FindString("adv_err_invalid_id");
                }
                else if (App.Config.Database.Exists(o => o.SteamID64.HasValue && o.SteamID64.Value == id))
                {
                    View.Error.Text = App.FindString("adv_err_id_exists");
                }
            }

            return string.IsNullOrEmpty(View.Error?.Text) ? (true, id) : (false, 0u);
        }

        private async void LoadingAnimation()
        {
            if (IsLoading)
                return;

            IsLoading = true;
            for (int i = 0; IsLoading; i++)
            {
                View.AddButton.Content = AnimationChunks[i];

                if (i == 2)
                    i = -1;

                await Task.Delay(300);
            }            
        }

        private async Task OnAdding(object param)
        {
            try
            {
                var result = await ValidateData();
                if (!result.Item1)
                {
                    return;
                }

                LoadingAnimation();

                if (result.Item2 == 0L)
                {
                    App.Config.Database.Add(new Account(Login, Password));
                    App.Config.SaveDatabase();
                    App.MainWindowVM.ClosePopupWindow();
                    return;
                }

                var acc       = new Account(Login,Password,result.Item2);

                if (!await acc.RetrieveInfo())
                    return;

                App.Config.Database.Add(acc);
                App.Config.SaveDatabase();
                App.MainWindowVM.ClosePopupWindow();
            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }
            finally
            {
                if (IsLoading)
                {
                    IsLoading = false;
                    View.AddButton.Content = App.FindString("word_add");
                }

                if (!string.IsNullOrEmpty(View.Error.Text))
                {
                    await Task.Delay(2500);
                    View.Error.Text = null;
                }
            }
        }

        public AccountAddingViewModel(AccountAddingView owner)
        {
            View       = owner;
            AddCommand = new AsyncRelayCommand(OnAdding);
        }
    }
}
