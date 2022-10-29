using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace UpdateManager
{
    internal static class Program
    {
        public static bool Repair = false;
        [STAThread]
        static void Main(string[] args)
        {
     
            if (args.Length < 1)
                return;
            else if (args[0].ToLower() == "-repair")
                Repair = true;
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new UpdaterForm());

        }
    }
}