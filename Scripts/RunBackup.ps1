$PathToScript = "./Downloaded-BackupToUat.ps1"

function Get-BackupScript()
{
    $ScriptUrl = "https://raw.githubusercontent.com/laingsimon/courage_scores/refs/heads/main/Scripts/BackupToUat.ps1"

    Invoke-WebRequest -UseDefaultCredentials -Uri $ScriptUrl -Method GET -OutFile $PathToScript
    Write-Output "Script written to $($PathToScript)"
}

Get-BackupScript

try
{
    Write-Output "Running the backup..."

    & $PathToScript
}
finally
{
    Remove-Item -Path $PathToScript
    Write-Output "Script deleted"
}