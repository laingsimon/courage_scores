function Get-BackupScript()
{
    $ScriptUrl = "https://raw.githubusercontent.com/laingsimon/courage_scores/refs/heads/main/Scripts/BackupToUat.ps1"
    $PathToScript = "./Downloaded-BackupToUat.ps1"

    Invoke-WebRequest -UseDefaultCredentials -Uri $ScriptUrl -Method GET -OutFile $PathToScript

    return $PathToScript
}

$PathToScript = Get-BackupScript
Write-Output "Script written to $($PathToScript)"

try
{
    Write-Output "Running the backup..."
    $Source = "https://courageleague.azurewebsites.net/data/api/Data/Backup/"
    $Destination = "https://courageleagueuat.azurewebsites.net/data/api/Data/Restore/"
    $Identity = "prod_backup"

    ./Downloaded-BackupToUat.ps1 -source $Source -destination $Destination -identity $Identity
}
finally
{
    Remove-Item -Path $PathToScript
    Write-Output "Script deleted"
}