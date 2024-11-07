Function Invoke-NpmCommand([string] $Command)
{
    $currentDirectory = (Get-Item .).FullName

    $processStartInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $processStartInfo.WorkingDirectory = $currentDirectory
    $processStartInfo.CreateNoWindow = $true
    $processStartInfo.FileName = Get-PathToNpm
    $processStartInfo.Arguments = $Command
    $processStartInfo.RedirectStandardOutput = $true
    $processStartInfo.RedirectStandardError = $true
    $processStartInfo.UseShellExecute = $false
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $processStartInfo
    $success = $process.Start()
    $stdOut = $process.StandardOutput.ReadToEnd()
    $stdErr = $process.StandardError.ReadToEnd()
    $exitCode = $process.ExitCode

    return @{
        success = $success;
        output = $stdOut;
        error = $stdErr;
        exitCode = $exitCode;
        workingDirectory = $processStartInfo.WorkingDirectory
        path = $processStartInfo.FileName
    }
}

Function Get-PathToNpm()
{
    $npm = Get-Command "npm"
    # Write-Message "Found npm command at $($npm.Path)"
    return $npm.Path
}

Function Format-NpmOutdatedContent($output, $error, $narrow)
{
    $Formatted = "$($error)`n"
    if ($Narrow -eq $true)
    {

    }
    else
    {
        $Formatted = "$($Formatted)|Package|Current|Wanted|Latest|`n"
        $Formatted = "$($Formatted)|----|----|----|----|`n"
    }

    $output -split "`n" | ForEach-Object {
        $line = $_
        if ($line -ne "")
        {
            # replace windows drive letter prefixes to allow a split on :
            $line = $line.Replace("C:\", "/c/")

            $parts = $line -split ":"
            $package=[System.IO.Path]::GetFileName($parts[0])
            $wanted=$parts[1].Split("@")[1]
            $current=$parts[2].Split("@")[1]
            $latest=$parts[3].Split("@")[1]
            $location=$parts[0].Substring([System.Math]::Max($parts[0].IndexOf("node_modules"), 0)).Replace("\", "/")
            $dependedBy=$parts[4]

            if ($Narrow -eq $true)
            {
                $FormattedLine = "|$($package)|$($current)|$($wanted)|$($latest)|"
            }
            else
            {
                $FormattedLine = "|$($package)|$($current)|$($wanted)|$($latest)|$($location)|$($dependedBy)|"
            }
            $Formatted = "$($Formatted)$($FormattedLine)`n"
        }
    }

    Return $Formatted
}

Export-ModuleMember -Function Invoke-NpmCommand
Export-ModuleMember -Function Format-NpmOutdatedContent