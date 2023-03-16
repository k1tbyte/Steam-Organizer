using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Parsers.Vdf;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.ViewModels;
using Steam_Account_Manager.Utils;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Automation;
using static Steam_Account_Manager.Utils.Win32;

namespace Steam_Account_Manager.Infrastructure
{
    internal static class SteamHandler
    {
        public static async Task ConnectToSteam(Account acc,string addArgs = "")
        {
            if (acc == null)
                return;

            bool isShuttingDown      = false;
            bool connectFromRemember = false;

            App.MainWindow.IsHitTestVisible = false;
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

                if(!acc.ContainParseInfo && Config.Properties.AutoGetSteamId)
                {
                    MainWindowViewModel.CollectInfoTimeStamp = DateTime.Now;
                    MainWindowViewModel.CollectInfoAcc       = acc;
                }

                var vdfConfigPath = $"{App.SteamExePath.Substring(0, App.SteamExePath.Length - 9)}config\\loginusers.vdf";
                if (steamHwnd == IntPtr.Zero && acc.SteamId64 != null && System.IO.File.Exists(vdfConfigPath))
                {
                    var loginConfig = new VdfDeserializer(System.IO.File.ReadAllText(vdfConfigPath));
                    foreach (VdfTable table in (loginConfig.Deserialize() as VdfTable)?.Cast<VdfTable>())
                    {
                        if(table.Name == acc.SteamId64.Value.ToString() && (table["RememberPassword"] as VdfInteger).Content == 1
                        && (table["MostRecent"] as VdfInteger).Content == 1 && (table["AllowAutoLogin"] as VdfInteger).Content == 1)
                        {
                            connectFromRemember = true;
                            break;
                        }
                    }
                }

                if (connectFromRemember)
                {
                    Common.ConnectSteam(App.SteamExePath, null);
                }
                //Copy steam auth code in clipboard
                else if (!String.IsNullOrEmpty(acc.AuthenticatorPath) && System.IO.File.Exists(acc.AuthenticatorPath))
                {
                    Application.Current.Dispatcher.Invoke(new Action(() =>
                    {
                        Win32.Clipboard.SetText(
                            JsonConvert.DeserializeObject<SteamGuardAccount>(
                                System.IO.File.ReadAllText(acc.AuthenticatorPath)).GenerateSteamGuardCode());
                    }));
                    VirtualSteamLogger(acc, Config.Properties.DontRememberPassword, true);
                }
                else if (Config.Properties.DontRememberPassword)
                {
                    VirtualSteamLogger(acc, true, false);
                }
                else
                {
                    Common.KillSteamAndConnect(App.SteamExePath, $"-login {acc.Login} {acc.Password} -tcp " + addArgs);
                    isShuttingDown = Config.Properties.ActionAfterLogin == LoggedAction.Close;
                }


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
            });

            App.MainWindow.IsHitTestVisible = true;
        }

        private static void VirtualSteamLogger(Account account, bool dontRememberPassword = false, bool paste2fa = false)
        {
            Automation.RemoveAllEventHandlers();
            Common.KillSteamProcess();
            if (Common.GetSteamRegistryLanguage() != account.Login)
            {
                Common.SetSteamRegistryRememberUser(String.Empty);
            }

            Thread.Sleep(1500);
            Common.ConnectSteam(App.SteamExePath,"");
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
                        Thread.Sleep(3000);
                        Win32.BringWindowToFront((IntPtr)element.Current.NativeWindowHandle);
                        Thread.Sleep(150);

#if !DEBUG
                        BlockInput(true);
#endif
                        if (String.IsNullOrEmpty(Common.GetSteamRegistryRememberUser()))
                        {
                            foreach (char c in account.Login)
                            {
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                            }
                            
                            Thread.Sleep(100);
                        }

                        System.Windows.Forms.SendKeys.SendWait("{TAB}");
                        Thread.Sleep(100);

                        foreach (char c in account.Password)
                        {
                            SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                            PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                        }

                        
                        Thread.Sleep(100);
                        System.Windows.Forms.SendKeys.SendWait("{TAB}");

                        if (dontRememberPassword)
                            Win32.KeyboardEvent(0x20);

                        Thread.Sleep(100);
                        System.Windows.Forms.SendKeys.SendWait("{TAB}");
                        System.Windows.Forms.SendKeys.SendWait("{ENTER}");

                        if (paste2fa)
                        {
                            string code = "";
                            App.Current.Dispatcher.Invoke(() => code = System.Windows.Clipboard.GetText(TextDataFormat.Text));
                            Thread.Sleep(2500);
                            if (Config.Properties.Input2FaMethod == Input2faMethod.Manually)
                            {
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                foreach (char c in code)
                                       PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                            }
                            else
                            {
                                keybd_event(0x11, 0, 0x00, 0);
                                keybd_event(0x56, 0, 0x00, 0);
                                Thread.Sleep(50);
                                keybd_event(0x11, 0, 0x02, 0);
                                keybd_event(0x56, 0, 0x02, 0);
                            }
                        }
                        Automation.RemoveAllEventHandlers();
#if !DEBUG
                            BlockInput(false);
#endif

                        if (Config.Properties.ActionAfterLogin == LoggedAction.Close)
                            App.Current.Dispatcher.InvokeShutdown();
                    }

                });
        }
    }
}
