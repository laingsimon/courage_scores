using System.Collections;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using NUnit.Framework;

namespace CourageScores.Tests;

[TestFixture]
public class ClientTests
{
    [Test]
    public async Task RunClientAppTests()
    {
        var ciEnvironmentVariable = Environment.GetEnvironmentVariable("CI");
        if (!string.IsNullOrEmpty(ciEnvironmentVariable))
        {
            Assert.Inconclusive("UI tests should be run via Publish");
            return;
        }

        var process = await RunTests();

        Assert.That(process.Count, Is.GreaterThan(0));
        Assert.That(process.Select(m => m.Line), Has.Some.Contains("PASS"));
        Assert.That(process.Select(m => m.Line), Has.None.Contains("FAIL"));
    }

    private static async Task<ProcessOutput> RunTests()
    {
        var clientApp = Path.GetFullPath(Path.Combine("..", "..", "..", "..", "CourageScores", "ClientApp"));
        var output = new ProcessOutput();
        var process = new Process
        {
            StartInfo =
            {
                WorkingDirectory = clientApp,
                Arguments = "test",
                FileName = GetExecutablePath("npm.cmd"),
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8,
            },
        };
        process.OutputDataReceived += (_, args) => output.AddStdOut(args.Data);
        process.ErrorDataReceived += (_, args) => output.AddStdErr(args.Data);

        process.Start();
        process.BeginErrorReadLine();
        process.BeginOutputReadLine();

        await process.WaitForExitAsync();

        Assert.That(process.ExitCode, Is.EqualTo(0));
        return output;
    }

    private static string GetExecutablePath(string fileName)
    {
        var paths = Environment.GetEnvironmentVariable("PATH")?.Split(";") ?? Array.Empty<string>();

        foreach (var path in paths)
        {
            var filePath = Path.Combine(path, fileName);
            if (File.Exists(filePath))
            {
                return filePath;
            }
        }

        throw new InvalidOperationException($"Unable to find {fileName} in any of the paths");
    }

    private class ProcessOutput : IEnumerable<ProcessMessage>
    {
        private readonly List<ProcessMessage> _messages = new();

        public void AddStdOut(string? line)
        {
            Console.Out.WriteLine(line);
            if (!string.IsNullOrEmpty(line))
            {
                _messages.Add(new ProcessMessage(line, false));
            }
        }

        public void AddStdErr(string? line)
        {
            Console.Error.WriteLine(line);
            if (!string.IsNullOrEmpty(line))
            {
                _messages.Add(new ProcessMessage(line, true));
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public IEnumerator<ProcessMessage> GetEnumerator()
        {
            return _messages.GetEnumerator();
        }
    }

    private class ProcessMessage
    {
        public string Line { get; }
        [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
        [SuppressMessage("ReSharper", "MemberCanBePrivate.Local")]
        public bool Error { get; }

        public ProcessMessage(string line, bool error)
        {
            Line = line;
            Error = error;
        }
    }
}