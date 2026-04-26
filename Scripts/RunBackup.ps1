$PathToScript = "./Downloaded-BackupToUat.ps1"

function Get-BackupScript()
{
    $ScriptUrl = "https://raw.githubusercontent.com/laingsimon/courage_scores/refs/heads/main/Scripts/BackupToUat.ps1"

    Invoke-WebRequest -UseDefaultCredentials -Uri $ScriptUrl -Method GET -OutFile $PathToScript
}

Get-BackupScript
Write-Output "Script written to $($PathToScript)"

try
{
    Write-Output "Running the backup..."

    ./Downloaded-BackupToUat.ps1
}
finally
{
    Remove-Item -Path $PathToScript
    Write-Output "Script deleted"
}