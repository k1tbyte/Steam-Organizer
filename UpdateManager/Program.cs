namespace UpdateManager
{
    internal static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            if (args.Length >= 1)
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new UpdaterForm());
            }
            else
            {
                return;
            }

        }
    }
}