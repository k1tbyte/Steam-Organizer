using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using Steam_Account_Manager.Utils;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Automation;
using static Steam_Account_Manager.Utils.Win32;

namespace Steam_Account_Manager.Infrastructure
{
    internal static class SteamHandler
    {
        private static async Task UpdateLoggedUser(Account acc)
        {
            if (await MainWindowViewModel.NowLoginUserParse(15000) && Config.Properties.AutoGetSteamId && !acc.ContainParseInfo)
            {
                try
                {
                    Presentation.OpenPopupMessageBox(App.FindString("atv_inf_getLocalAccInfo"));
                    acc.SteamId64 = Utils.Common.SteamId32ToSteamId64(Utils.Common.GetSteamRegistryActiveUser());
                    await acc.ParseInfo();
                    Config.SaveAccounts();
                }
                catch
                {
                    Presentation.OpenPopupMessageBox((string)App.Current.FindResource("atv_inf_errorWhileScanning"));
                }
            }
        }


        public static async Task ConnectToSteam(Account acc)
        {
            bool isShuttingDown = false;

            App.MainWindow.IsHitTestVisible = false;
            await Task.Factory.StartNew(() =>
            {
                Config.Properties.SteamDirection = Utils.Common.GetSteamRegistryDirection();
                if (Config.Properties.SteamDirection != null)
                {

                    //Copy steam auth code in clipboard
                    if (!String.IsNullOrEmpty(acc.AuthenticatorPath) && System.IO.File.Exists(acc.AuthenticatorPath))
                    {
                        Application.Current.Dispatcher.Invoke(new Action(() =>
                        {
                            Utils.Win32.Clipboard.SetText(
                            JsonConvert.DeserializeObject<SteamGuardAccount>(
                                System.IO.File.ReadAllText(acc.AuthenticatorPath)).GenerateSteamGuardCode());
                        }));
                        VirtualSteamLogger(acc, Config.Properties.RememberPassword, true);
                    }
                    else if (Config.Properties.RememberPassword)
                    {
                        VirtualSteamLogger(acc, true, false);
                    }
                    else
                    {
                        Utils.Common.KillSteamAndConnect(Config.Properties.SteamDirection, $"-noreactlogin -login {acc.Login} {acc.Password} -tcp");
                        isShuttingDown = Config.Properties.ActionAfterLogin == LoggedAction.Close;
                    }


                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        //Сохраняем данные о недавно используемых аккаунтов
                        if (acc.SteamId64.HasValue)
                        {

                            var match = Config.Properties.RecentlyLoggedUsers.Find(o => o.SteamID64 == acc.SteamId64.Value);
                            if(match != default(RecentlyLoggedUser))
                            {
                                var index = Config.Properties.RecentlyLoggedUsers.IndexOf(match);
                                if (Config.Properties.RecentlyLoggedUsers.Count > 1 && index != 0)
                                      Config.Properties.RecentlyLoggedUsers.Move(index, 0);
                            }
                            else
                            {
                                Config.Properties.RecentlyLoggedUsers.Insert(0,new RecentlyLoggedUser { Nickname = acc.Nickname, SteamID64 = acc.SteamId64.Value });
                                if (Config.Properties.RecentlyLoggedUsers.Count > 5)
                                    Config.Properties.RecentlyLoggedUsers.RemoveAt(5);
                            }
                            App.Tray.TrayListUpdate();
                            Config.SaveProperties();
                        }

                        if (Config.Properties.ActionAfterLogin != LoggedAction.None)
                        {
                            switch (Config.Properties.ActionAfterLogin)
                            {
                                case LoggedAction.Close:
                                    if (isShuttingDown)
                                        App.Shutdown();
                                    break;
                                case LoggedAction.Minimize:
                                    if (App.MainWindow.IsVisible)
                                        App.MainWindow.Hide();
                                    break;
                            }
                        }
                    });

                    Presentation.OpenPopupMessageBox($"{App.FindString("atv_inf_loggedInSteam1")} \"{acc.Nickname}\". {App.FindString("atv_inf_loggedInSteam2")}");

                    //Если надо получить данные об аккаунте без информации
                    _ = UpdateLoggedUser(acc);
                }
                else
                {
                    Presentation.OpenPopupMessageBox(App.FindString("atv_inf_steamNotFound"));
                    return;
                }
            });

            App.MainWindow.IsHitTestVisible = true;
        }

        private static void VirtualSteamLogger(Account account, bool savePassword = false, bool paste2fa = false)
        {
            Automation.RemoveAllEventHandlers();
            if (Utils.Common.GetSteamRegistryLanguage() != account.Login)
            {
                Utils.Common.SetSteamRegistryRememberUser(String.Empty);
            }

            Utils.Common.KillSteamAndConnect(Config.Properties.SteamDirection);
            byte SteamAwaiter = 0;

            Automation.AddAutomationEventHandler(
                WindowPattern.WindowOpenedEvent,
                AutomationElement.RootElement,
                TreeScope.Children,
                (sender, e) =>
                {
                    var element = sender as AutomationElement;

                    if (element.Current.Name.Equals("Steam"))
                    {
                        if (++SteamAwaiter >= 2)
                        {
                            Automation.RemoveAllEventHandlers();
                        }
                    }
                    if (element.Current.Name.Contains("Steam") && element.Current.Name.Length > 5)
                    {
                        Thread.Sleep(500);
                        ForceWindowToForeground((IntPtr)element.Current.NativeWindowHandle);
                        SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                        Thread.Sleep(50);

                        if (Utils.Common.GetSteamRegistryActiveUser() == 0)
                        {
                            BlockInput(true);
                            if (String.IsNullOrEmpty(Utils.Common.GetSteamRegistryRememberUser()))
                            {
                                foreach (char c in account.Login)
                                {
                                    SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                    PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                                }
                                Thread.Sleep(100);
                                SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.TAB);
                                Thread.Sleep(100);
                            }

                            foreach (char c in account.Password)
                            {
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                            }

                            if (savePassword)
                            {
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                Thread.Sleep(100);
                                SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.TAB);
                                Thread.Sleep(100);
                                SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.SPACE);
                            }

                            SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                            Thread.Sleep(100);
                            System.Windows.Forms.SendKeys.SendWait("{ENTER}");
                            SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                            if (paste2fa)
                            {
                                string code = "";
                                App.Current.Dispatcher.Invoke(() => { code = System.Windows.Clipboard.GetText(TextDataFormat.Text); });
                                Thread.Sleep(2700);
                                if(Config.Properties.Input2FaMethod == Models.Input2faMethod.Manually)
                                {
                                    foreach (char c in code)
                                    {
                                        SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                        PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                                    }
                                }
                                else
                                {
                                    keybd_event(0x11, 0, 0x00, 0);
                                    keybd_event(0x56, 0, 0x00, 0);
                                    Thread.Sleep(50);
                                    keybd_event(0x11, 0, 0x02, 0);
                                    keybd_event(0x56, 0, 0x02, 0);
                                }

                                
                                Thread.Sleep(200);
                                System.Windows.Forms.SendKeys.SendWait("{ENTER}");
                            }
                            Automation.RemoveAllEventHandlers();
                            BlockInput(false);



                            if (Config.Properties.ActionAfterLogin == Models.LoggedAction.Close)
                                App.Current.Dispatcher.InvokeShutdown();
                        }

                    }

                });
        }
    }
}
