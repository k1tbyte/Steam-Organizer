using SteamOrganizer.Infrastructure.Steam;
using SteamOrganizer.MVVM.ViewModels;
using SteamOrganizer.Storages;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;

namespace SteamOrganizer.Infrastructure
{
    internal static class ArgumentsParser
    {
        private const char BeginningCommand = '-';

        [AttributeUsage(AttributeTargets.Field, AllowMultiple = false)]
        private sealed class Command : Attribute
        {
            public readonly string Name;
            public Command(string argumentName)
                => Name = argumentName;
        }

        private sealed class AvailableCommands
        {
            [Command("app")]
            public static readonly int LaunchAppId;

            [Command("login")]
            public static readonly string AccountLogin;

            [Command("noicon")]
            public static readonly bool NeedResetIcon;

            [Command("restart")]
            public static readonly bool Restart;

            [Command("forcewindow")]
            public static readonly bool ForceWindow;
        }

        private static Dictionary<string, object> ParseArguments(string args)
        {
            var splitArgs = args.Split(BeginningCommand).Where(o => !string.IsNullOrEmpty(o)).ToArray();

            if (splitArgs.Length < 1)
                return null;

            var availableCmds = typeof(AvailableCommands).GetFields().ToList();
            var commands = new Dictionary<string, object>(availableCmds.Count);

            foreach (var arg in splitArgs)
            {
                foreach (var cmd in availableCmds)
                {
                    if (!arg.StartsWith(cmd.GetCustomAttribute<Command>().Name, StringComparison.InvariantCultureIgnoreCase))
                        continue;

                    try
                    {
                        object value = null;

                        if (cmd.FieldType != typeof(bool))
                        {
                            var converter = TypeDescriptor.GetConverter(cmd.FieldType);
                            var argValue = arg.Split(' ').Where(o => !string.IsNullOrEmpty(o)).Skip(1).FirstOrDefault();
                            value = converter.ConvertFromInvariantString(argValue);
                        }

                        commands.Add(cmd.Name, value ?? true);
                    }
                    catch { }

                    // No command duplicates
                    availableCmds.Remove(cmd);
                    break;
                }

                if (availableCmds.Count == 0)
                    break;
            }

            return commands;
        }

        internal static bool HandleStartArguments(string args)
        {
            var commands = ParseArguments(args);

            if (commands.Count == 0)
                return true;

            if(commands.ContainsKey(nameof(AvailableCommands.Restart)))
            {
                App.Restart(args.Replace("-restart",""));
                return false;
            }

            if (commands.ContainsKey(nameof(AvailableCommands.NeedResetIcon)))
            {
                var path = $"{App.WorkingDir}\\SteamOrganizer.lnk";
                var location = Assembly.GetExecutingAssembly().Location;

                Win32.CreateShortcut(path, location, args.Replace("-noicon", ""), App.WorkingDir, null, "", location);
                App.Shutdown();
                System.Diagnostics.Process.Start(path);
                return false;
            }

            foreach (var cmd in commands)
            {
                switch (cmd.Key)
                {
                    case nameof(AvailableCommands.ForceWindow):
                        GlobalStorage.RequiredOpeningWindow = true;
                        break;

                    case nameof(AvailableCommands.LaunchAppId):
                        break;

                    case nameof(AvailableCommands.AccountLogin):
                        MainWindowViewModel.AccountsViewInitialized += (context) =>
                            context.LoginCommand.Execute(App.Config.Database.FirstOrDefault(o => o.Login.IndexOf(cmd.Value.ToString(), StringComparison.OrdinalIgnoreCase) >= 0));
                        break;
                }
            }
            return true;
        }

        internal static bool HandleStartArguments(string[] args)
        {
            if (args.Length == 0)
                return true;

            return HandleStartArguments(string.Join(" ", args).ToLower());
        }
    }
}
