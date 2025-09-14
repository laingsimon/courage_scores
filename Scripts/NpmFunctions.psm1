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

Function Invoke-NpxCommand([string] $Command)
{
    $currentDirectory = (Get-Item .).FullName

    $processStartInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $processStartInfo.WorkingDirectory = $currentDirectory
    $processStartInfo.CreateNoWindow = $true
    $processStartInfo.FileName = Get-PathToNpx
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

Function Get-PathToNpx()
{
    $npx = Get-Command "npx"
    # Write-Message "Found npx command at $($npx.Path)"
    return $npx.Path
}

Function Format-NpmOutdatedContent($output, $error, $narrow)
{
    $Formatted = "$($error)`n"
    if ($Narrow -eq $true)
    {

    }
    else
    {
        $Formatted = "$($Formatted)|Package|Current|Latest|`n"
        $Formatted = "$($Formatted)|----|----|----|`n"
    }

    $output -split "`n" | ForEach-Object {
        $line = $_
        if ($line -ne "")
        {
            # replace windows drive letter prefixes to allow a split on :
            $line = $line.Replace("C:\", "/c/")
            $line = $line.Replace("D:\", "/d/")
            $line = $line.Replace("\", "/")

            $parts = $line -split ":"
            $package=[System.IO.Path]::GetFileName($parts[0])
            $packageDirectoryName = [System.IO.Path]::GetFileName([System.IO.Path]::GetDirectoryName($parts[0]))
            $versionOffset = 1

            if ($packageDirectoryName -like "@*")
            {
                $package = "$($packageDirectoryName)/$($package)"
                $versionOffset = 2
            }

            $wanted=$parts[1].Split("@")[$versionOffset]
            $current=$parts[2].Split("@")[$versionOffset]
            $latest=$parts[3].Split("@")[$versionOffset]
            $location=$parts[0].Substring([System.Math]::Max($parts[0].IndexOf("node_modules"), 0)).Replace("\", "/")
            $dependedBy=$parts[4]

            if ($Narrow -eq $true)
            {
                $FormattedLine = "|$($package)|$($current)|$($latest)|"
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
Export-ModuleMember -Function Invoke-NpxCommand
Export-ModuleMember -Function Format-NpmOutdatedContent