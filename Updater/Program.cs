using System.Diagnostics;
using System.IO.Compression;
using System.Net;


namespace Updater
{
    internal class Program
    {
        static void Main(string[] args)
        {
            if (args.Length >= 1)
            {

                try
                {

                     Console.SetWindowSize(40, 5);
                    Console.WriteLine("Donwloading...");
                    var webClient = new WebClient();
                    webClient.DownloadFile("https://drive.google.com/uc?export=download&id=11mSIJZeTQhUHtnDVwa74iQuAQXJ8WH5Q", @"LastUpd.zip");
                    Console.WriteLine("Extract...");

                    Directory.CreateDirectory(@".\Temp");
                    ZipFile.ExtractToDirectory(@".\LastUpd.zip", @".\Temp");

                    if (File.Exists(@".\Temp\Updater.exe"))
                        File.Delete(@".\Temp\Updater.exe");

                    var updateFiles = Directory.GetFiles(@".\Temp").Select(a => Path.GetFileName(a));

                    foreach (var item in updateFiles)
                    {
                        File.Move($@".\Temp\{item}", $@".\{item}", true);
                    }

                    var dirs = Directory.GetDirectories(@".\Temp", "*", SearchOption.TopDirectoryOnly);
                    foreach (var item in dirs)
                    {
                        var tmpDir = item.Split('\\');
                        var clearDir = tmpDir[tmpDir.Length - 1];

                        Console.WriteLine("Find overwrite dir " + clearDir);
                        if (Directory.Exists($@".\{clearDir}"))
                        {
                            Directory.Delete($@".\{clearDir}", true);

                            Directory.CreateDirectory($@".\{clearDir}");
                        }
                        else
                        {
                            Directory.CreateDirectory($@".\{clearDir}");
                        }

                        try
                        {

                            var files = Directory.GetFiles(item).Select(a => Path.GetFileName(a));
                            foreach (var copied in files)
                            {
                                File.Copy($@".\Temp\{clearDir}\{copied}", $@".\{clearDir}\{copied}");
                            }
                        }
                        catch { }
                    }

                    Directory.Delete(@".\Temp", true);
                    File.Delete(@".\LastUpd.zip");
                    Process.Start(@".\Steam Account Manager.exe");
                }
                catch (Exception e)
                {
                    Console.WriteLine("An error occurred while updating...\n\n\n");
                    Console.WriteLine(e);
                    Thread.Sleep(1000);
                }
            }

        }

    }
}
