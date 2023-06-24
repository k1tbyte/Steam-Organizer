using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.UIA3;
using Newtonsoft.Json;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.Infrastructure.Parsers.Vdf;
using SteamOrganizer.Infrastructure.SteamRemoteClient.Authenticator;
using SteamOrganizer.MVVM.ViewModels;
using SteamOrganizer.Utils;
using System;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using static SteamOrganizer.Utils.Win32;

namespace SteamOrganizer.Infrastructure
{
    internal static class SteamHandler
    {
        private static bool _isLocked = false;
        public static async Task ConnectToSteam(Account acc, string addArgs = "")
        {
            if (acc == null || _isLocked)
                return;

            bool connectFromRemember = false;
            _isLocked = true;

            try
            {
                await Task.Factory.StartNew(() =>
                {
                    if (!System.IO.File.Exists(App.SteamExePath))
                    {
                        Presentation.OpenPopupMessageBox(App.FindString("atv_inf_steamNotFound"));
                        return;
                    }

                    var steamHwnd = FindWindow(null, "Steam");
                    if (steamHwnd != IntPtr.Zero && Common.GetSteamRegistryActiveUser() == acc.SteamId32)
                    {
                        BringWindowToFront(steamHwnd);
                        return;
                    }

                    if (!acc.ContainParseInfo && Config.Properties.AutoGetSteamId)
                    {
                        MainWindowViewModel.CollectInfoTimeStamp = DateTime.Now;
                        MainWindowViewModel.CollectInfoAcc = acc;
                    }

                    var vdfConfigPath = $"{App.SteamExePath.Substring(0, App.SteamExePath.Length - 9)}config\\loginusers.vdf";

                    if (acc.SteamId64 != null && System.IO.File.Exists(vdfConfigPath))
                    {
                        var loginConfig = new VdfDeserializer(System.IO.File.ReadAllText(vdfConfigPath));
                        foreach (VdfTable table in (loginConfig.Deserialize() as VdfTable)?.Cast<VdfTable>())
                        {
                            if (table.Name == acc.SteamId64.Value.ToString() && (table["RememberPassword"] as VdfInteger).Content == 1 && (table["AllowAutoLogin"] as VdfInteger).Content == 1)
                            {
                                connectFromRemember = true;
                                break;
                            }
                        }
                    }

                    Presentation.OpenPopupMessageBox($"{App.FindString("atv_inf_loggedInSteam1")} \"{acc.Nickname}\". {App.FindString("atv_inf_loggedInSteam2")}");

                    if (connectFromRemember)
                    {
                        Common.SetSteamRegistryRememberUser(acc.Login.ToLower());
                        Common.KillSteamAndConnect(App.SteamExePath, null);
                    }
                    else if (!VirtualSteamLogger(acc) & Win32.BlockInput(false))
                    {
                        return;
                    }
                    /*                else
                                    {
                                        Common.KillSteamAndConnect(App.SteamExePath, $"-login {acc.Login} {acc.Password} -tcp " + addArgs);
                                    }*/

                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        //Сохраняем данные о недавно используемых аккаунтов
                        if (acc.SteamId64.HasValue)
                        {

                            var match = Config.Properties.RecentlyLoggedUsers.Find(o => o.SteamID64 == acc.SteamId64.Value);
                            if (match != default(RecentlyLoggedUser))
                            {
                                var index = Config.Properties.RecentlyLoggedUsers.IndexOf(match);
                                if (Config.Properties.RecentlyLoggedUsers.Count > 1 && index != 0)
                                    Config.Properties.RecentlyLoggedUsers.Move(index, 0);
                            }
                            else
                            {
                                Config.Properties.RecentlyLoggedUsers.Insert(0, new RecentlyLoggedUser { Nickname = acc.Nickname, SteamID64 = acc.SteamId64.Value });
                                if (Config.Properties.RecentlyLoggedUsers.Count > 5)
                                    Config.Properties.RecentlyLoggedUsers.RemoveAt(5);
                            }
                            App.Tray.TrayListUpdate();
                            Config.SaveProperties();
                        }

                        switch (Config.Properties.ActionAfterLogin)
                        {
                            case LoggedAction.Close:
                                App.Shutdown();
                                break;
                            case LoggedAction.Minimize:
                                if (App.MainWindow.IsVisible)
                                    App.MainWindow.Hide();
                                break;
                        }

                    });
                });
            }
            catch
            {
                Presentation.OpenPopupMessageBox(App.FindString("atv_inf_loggedInSteamErr"), true);
            }
            _isLocked = false;
        }

        private static bool VirtualSteamLogger(Account account)
        {
            Common.SetSteamRegistryRememberUser("");
            if (Process.GetProcessesByName("Steam")?.Length != 0)
            {
                Common.ConnectSteam(App.SteamExePath, "-shutdown");
                for (int i = 0; i < 15; i++)
                {
                    Thread.Sleep(1000);
                    if(Process.GetProcessesByName("Steam")?.Length == 0)
                        break;
                }
            }

            IntPtr loginWindowHandle = IntPtr.Zero;
            for (int i = 0; i < 15; i++) // 15000 ms (15 s) timeout
            {
                var proc = Process.GetProcessesByName("steamwebhelper").FirstOrDefault(o => o.MainWindowHandle != IntPtr.Zero);
                if (proc == null)
                {
                    Common.ConnectSteam(App.SteamExePath, "-login");
                }
                else if (proc.MainWindowTitle?.Length > 5 && proc.MainWindowTitle?.EndsWith("Steam") == true)
                {
                    loginWindowHandle = proc.MainWindowHandle;
                    break;
                }
                if (loginWindowHandle != IntPtr.Zero) break;
                Thread.Sleep(1000);
            }

            if (loginWindowHandle == IntPtr.Zero)
                return false;

            using (var automation = new UIA3Automation())
            {
                var window = automation.FromHandle(loginWindowHandle);

                Win32.BringWindowToFront(loginWindowHandle);
                if (!RetrieveAutomationDocument(window, 15, out AutomationElement document))
                    return false;

                if (!RetrieveAutomationChildrens(document, 15, out AutomationElement[] childrens))
                    return false;

                var textBoxes = childrens.Where(o => o.ControlType == ControlType.Edit)?.Select(o => o.AsTextBox()).ToArray();

                //Selection account view
                if (textBoxes.Length != 2)
                {
                    childrens.Last().AsButton().Invoke();

                    Win32.BringWindowToFront(loginWindowHandle);
                    if (!RetrieveAutomationDocument(window, 15, out document) || !RetrieveAutomationChildrens(document, 15, out childrens))
                        return false;
                    textBoxes = childrens.Where(o => o.ControlType == ControlType.Edit)?.Select(o => o.AsTextBox()).ToArray();
                }
#if !DEBUG
                    Win32.BlockInput(true);
#endif

                /*                    var rememberButton    = document.FindFirstChild(o => o.ByControlType(ControlType.Group)).AsButton();*/
                var loginButton = document.FindFirstChild(o => o.ByControlType(ControlType.Button)).AsButton();
                textBoxes[0].Text = account.Login;
                textBoxes[1].Text = account.Password;

                /*                    if (Config.Properties.DontRememberPassword)
                                    {
                                        rememberButton.Focus();
                                        rememberButton.Invoke();
                                    }*/

                loginButton.Focus();
                loginButton.Invoke();

                if (account.AuthenticatorPath == null || !System.IO.File.Exists(account.AuthenticatorPath))
                    return true;

                Win32.BringWindowToFront(loginWindowHandle);

                for (int i = 0; i < 15 && document.FindFirstChild().AutomationId != "Layer_2" || textBoxes?.Length == 2; i++)
                {
                    document = window.FindFirstDescendant(o => o.ByControlType(ControlType.Document));
                    textBoxes = document.FindAllChildren(o => o.ByControlType(ControlType.Edit))?.Select(o => o.AsTextBox()).ToArray();
                    Thread.Sleep(500);
                }

                if (textBoxes?.Length != 5)
                {
                    RetrieveAutomationChildrens(document, 15, out childrens);
                    childrens[childrens.Length - 2].Focus();
                    childrens[childrens.Length - 2].Click();
                }

                for (int i = 0; i < 10 && textBoxes.Length != 5; i++)
                {
                    textBoxes = window.FindFirstDescendant(o => o.ByControlType(ControlType.Document)).FindAllChildren(o => o.ByControlType(ControlType.Edit))?.Select(o => o.AsTextBox()).ToArray();
                    Thread.Sleep(500);
                }

                var authCode = JsonConvert.DeserializeObject<SteamGuardAccount>(System.IO.File.ReadAllText(account.AuthenticatorPath)).GenerateSteamGuardCode();
                for (int i = 0; i < 5; i++)
                    textBoxes[i].Text = authCode[i].ToString();

                return true;
            }

            bool RetrieveAutomationChildrens(AutomationElement element, int timeout, out AutomationElement[] childrens)
            {
                childrens = element.FindAllChildren();
                for (int i = 0; i < timeout && (childrens?.Length <= 0 || childrens[0].ActualWidth == 0 || childrens[0].ActualHeight == 0); i++)
                {
                    Thread.Sleep(500);
                    childrens = element.FindAllChildren();
                }
                if (childrens?.Length <= 0 || childrens[0].ActualWidth == 0 || childrens[0].ActualHeight == 0)
                    return false;

                return true;
            }
            bool RetrieveAutomationDocument(AutomationElement window, int timeout, out AutomationElement document)
            {
                document = window.FindFirstDescendant(o => o.ByControlType(ControlType.Document));
                for (int i = 0; i < timeout && (document == null || document.FindAllChildren().Length <= 2); i++)
                {
                    Thread.Sleep(500);
                    document = window.FindFirstDescendant(o => o.ByControlType(ControlType.Document));
                }

                if (document == null || document.FindFirstChild() == null)
                    return false;

                Thread.Sleep(500);
                return true;
            }
        }
    }
}
