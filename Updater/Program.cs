using System.Diagnostics;
using System.IO.Compression;
using System.Net;


namespace Updater
{
    internal class Program
    {
        static void Main(string[] args)
        {

            if (args.Length != 0)
            {
                try
                {
                    Console.SetWindowSize(40, 5);
                    Console.WriteLine("Donwloading...");
                    var webClient = new WebClient();
                    webClient.DownloadFile("https://drive.google.com/uc?export=download&id=11ivjqOtmPdVgTaJP6kZL9_5bcYgwog0u", @"LastUpd.zip");
                    Console.WriteLine("Extract...");

                    if (File.Exists(@".\Steam Account Manager.exe"))
                        File.Delete(@".\Steam Account Manager.exe");

                    if (File.Exists(@".\Steam Account Manager.exe.config"))
                        File.Delete(@".\Steam Account Manager.exe.config");

                    ZipFile.ExtractToDirectory(@".\LastUpd.zip", @".\");
                    File.Delete(@".\LastUpd.zip");
                    Process.Start(@".\Steam Account Manager.exe");
                }
                catch
                {
                    Console.WriteLine("An error occurred while updating...");
                    Thread.Sleep(1000);
                }
            }


        }
    }
}
