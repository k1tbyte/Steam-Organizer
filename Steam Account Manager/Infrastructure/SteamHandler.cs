using Steam_Account_Manager.Infrastructure.Models.AccountModel;
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows;
using System.Windows.Automation;
using static Steam_Account_Manager.Utils.Win32;

namespace Steam_Account_Manager.Infrastructure
{
    internal class SteamHandler
    {
        public static void VirtualSteamLogger(Account account, bool savePassword = false, bool paste2fa = false)
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
