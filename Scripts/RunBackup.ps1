function Get-BackupScript()
{
    $ScriptUrl = "https://raw.githubusercontent.com/laingsimon/courage_scores/refs/heads/main/Scripts/BackupToUat.ps1"
    $PathToScript = "./Downloaded-BackupToUat.ps1"

    Invoke-WebRequest -UseDefaultCredentials -Uri $ScriptUrl -Method GET -OutFile $PathToScript

    return $PathToScript
}

function Get-Variable([string] $Name)
{
    $EnvironmentVariableName = "RunBackup_$($Name)"
    $EnvironmentVariable = [Environment]::GetEnvironmentVariable("Env:\$($EnvironmentVariableName)")
    if ($EnvironmentVariable -ne $null -and $EnvironmentVariable -ne "")
    {
        return $EnvironmentVariable
    }

    try 
    {
        $Variable = (Get-AutomationVariable -Name $Name)

        if ($Variable -eq $null -or $Variable -eq "")
        {
            throw [System.InvalidOperationException] "v1 Azure variable with name '$($Name)' was found but the value is empty"
        }

        return $Variable
    }
    catch
    {
        Write-Error $_.Exception
        throw [System.InvalidOperationException] "Could not find variable with name '$($Name)' or environment variable with name '$($EnvironmentVariableName)'"
    }
}

$PathToScript = Get-BackupScript
Write-Output "Script written to $($PathToScript)"

try
{
    Write-Output "Running the backup..."
    $RestorePassword = (Get-Variable -Name "RestorePassword")
    $RestoreToken = (Get-Variable -Name "RestoreToken")
    $BackupToken = (Get-Variable -Name "BackupToken")
    $Source = "https://courageleague.azurewebsites.net/data/api/Data/Backup/"
    $Destination = "https://courageleagueuat.azurewebsites.net/data/api/Data/Restore/"
    $Identity = "prod_backup"

    ./Downloaded-BackupToUat.ps1 -source $Source -destination $Destination -identity $Identity -backupToken $BackupToken -restoreToken $RestoreToken -restorePassword $RestorePassword
}
finally
{
    Remove-Item -Path $PathToScript
    Write-Output "Script deleted"
}