using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.UIA3;
using SteamOrganizer.Infrastructure.Parsers.Vdf;
using SteamOrganizer.Log;
using SteamOrganizer.MVVM.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SteamOrganizer.Infrastructure.Steam
{
    internal sealed class LoginEmulator
    {
        private const int MaxTries = 15;
        private static bool IsBusy;

        private readonly Account Account;
        private readonly string SteamExePath;

        internal enum ELoginResult
        {
            Success,
            SteamNotFound,
            NoAccountPassword,
            ExternalError,
            Busy
        }

        public LoginEmulator(Account acc)
        {
            acc.ThrowIfNull();
            Account      = acc;

            //We must get the path each time as it can change
            SteamExePath = SteamRegistry.GetSteamExePath();
        }

        private bool CheckIfAlreadyLogged()
        {
            var steamHWND = Win32.FindWindow(null, "Steam");
            if (steamHWND != IntPtr.Zero && SteamRegistry.GetActiveUserSteamID() == Account.SteamID64)
            {
                Win32.BringWindowToFront(steamHWND);
                return true;
            }

            return false;
        }

        private bool CheckIfRecentlyRemembered()
        {
            var vdfConfigPath = $"{SteamExePath.Substring(0, SteamExePath.Length - 9)}config\\loginusers.vdf";

            if (Account.SteamID64 == null || !System.IO.File.Exists(vdfConfigPath))
                return false;

            var loginConfig = new VdfDeserializer(System.IO.File.ReadAllText(vdfConfigPath));
            foreach (VdfTable table in (loginConfig.Deserialize() as VdfTable)?.Cast<VdfTable>())
            {
                if (table.Name == $"{Account.SteamID64}" && (table["RememberPassword"] as VdfInteger)?.Content == 1)
                {
                    return true; ;
                }
            }

            return false;
        }

        private async Task<bool> AttemptExecuteAction(Func<bool> action,int attempts,int timeout = 1000,bool withThrow  = false)
        {
            for (int i = 0; i < attempts; i++)
            {
                if (action.Invoke())
                    return true;

                await Task.Delay(timeout);
            }

            if(withThrow)
            {
                throw new WarnException("Failed to execute action");
            }
                
            return false;
        }

        public async Task<ELoginResult> Login()
        {
            if (IsBusy)
                return ELoginResult.Busy;

            if (string.IsNullOrEmpty(SteamExePath))
                return ELoginResult.SteamNotFound;

            if (string.IsNullOrEmpty(Account.Password))
                return ELoginResult.NoAccountPassword;

            UIA3Automation emulator       = null;
            AutomationElement document    = null;
            AutomationElement window      = null;
            AutomationElement[] childrens = null;
            Process webHelper             = null;

            try
            {
                IsBusy = true;

                // We don't need to do anything other than focus the window if the account is already logged in.
                if (CheckIfAlreadyLogged())
                    return ELoginResult.Success;

                // This check is needed to optimize the login - we do not need to restart Steam if the login page is already active.
                if ((webHelper = Process.GetProcessesByName("steamwebhelper").FirstOrDefault(o => o.MainWindowHandle != IntPtr.Zero)) == null || !webHelper.MainWindowTitle?.EndsWith("Steam") == true)
                {
                    if (!await SteamRegistry.ShutdownSteam(MaxTries, SteamExePath))
                        return ELoginResult.ExternalError;
                }


                var remembered = CheckIfRecentlyRemembered();
                SteamRegistry.SetActiveUserLogin(null);

                IntPtr loginWindowHandle = webHelper == null ? IntPtr.Zero : webHelper.MainWindowHandle;

                #region Finding the Steam Login Window

                // if loginWindowHandle is already initialized AttemptExecuteAction will not happen (&&)
                if (loginWindowHandle == IntPtr.Zero && !await AttemptExecuteAction(() =>
                {
                    webHelper = Process.GetProcessesByName("steamwebhelper").FirstOrDefault(o => o.MainWindowHandle != IntPtr.Zero);
                    if (webHelper == null)
                    {
                        Utils.StartProcess(SteamExePath);
                    }
                    else if (webHelper.MainWindowTitle?.Length > 5 && webHelper.MainWindowTitle?.EndsWith("Steam") == true)
                    {
                        loginWindowHandle = webHelper.MainWindowHandle;
                    }

                    if (loginWindowHandle != IntPtr.Zero)
                        return true;

                    return false;
                }, MaxTries))
                    return ELoginResult.ExternalError;

                #endregion

                emulator   = new UIA3Automation();
                window     = emulator.FromHandle(loginWindowHandle);

                #if !DEBUG
                Win32.BlockInput(false);
                #endif

                Win32.BringWindowToFront(loginWindowHandle);

                await AttemptExecuteAction(RetrieveAutomationElements, MaxTries, 500, true);

                #region If we are on the account selection page

                if (childrens.Length < 14)
                {
                    AutomationElement rememberAccButton = null;
                    if (remembered && (rememberAccButton = childrens.FirstOrDefault(o => o.Name.EndsWith(Account.Login, StringComparison.OrdinalIgnoreCase))) != null)
                    {
                        rememberAccButton.AsButton().Invoke();

                        await Task.Delay(2000);

                        // We are logged in from a saved account
                        if (SteamRegistry.GetActiveUserLogin() != null)
                        {
                            return ELoginResult.Success;
                        }
                    }
                    else
                    {
                        childrens.Last().AsButton().Invoke();
                    }

                    await Task.Delay(500);

                    await AttemptExecuteAction(RetrieveAutomationElements, MaxTries, 500, true);
                }

                #endregion

                var textBoxes     = childrens.Where(o => o.ControlType == ControlType.Edit)?.Select(o => o.AsTextBox()).ToArray();

                if (textBoxes.Length < 2)
                    return ELoginResult.ExternalError;


                textBoxes[0].Text = Account.Login;
                textBoxes[1].Text = Account.Password;

                childrens.FirstOrDefault(o => o.ControlType == ControlType.Button)?.AsButton()?.Invoke();

                if (Account.Authenticator == null)
                    return ELoginResult.Success;

                #region If 2fa is linked to the account

                await Task.Delay(1000);

                await AttemptExecuteAction(() =>
                {
                    if (!RetrieveAutomationElements() || !childrens[0].AutomationId.StartsWith("Layer_2", StringComparison.OrdinalIgnoreCase))
                        return false;

                    if ((textBoxes = childrens.Where(o => o.ControlType == ControlType.Edit)?.Select(o => o.AsTextBox()).ToArray()).Length != 5)
                    {
                        if (textBoxes.Length == 0)
                        {
                            childrens[childrens.Length - 2].AsButton().Invoke();
                        }
                        return false;
                    }

                    return true;
                }, MaxTries, 500, true);

                var code = await Account.Authenticator.GenerateCode();
                for (int i = 0; i < 5; i++)
                {
                    textBoxes[i].Text = code[i].ToString();
                }

                #endregion

                bool RetrieveAutomationElements()
                {
                    document = window.FindFirstDescendant(o => o.ByControlType(ControlType.Document));
                    childrens = document.FindAllChildren();

                    if (document == null || childrens?.Length <= 2 || childrens[0].ActualWidth == 0 || childrens[0].ActualHeight == 0)
                        return false;

                    return true;
                }
            }
            catch(Exception e)
            {
                App.Logger.Value.LogHandledException(e);
                return ELoginResult.ExternalError;
            }
            finally
            {
                IsBusy = false;
                emulator?.Dispose();
                webHelper?.Dispose();

                #if !DEBUG
                Win32.BlockInput(true);
                #endif
            }

            return ELoginResult.Success;

        }
    }
}
