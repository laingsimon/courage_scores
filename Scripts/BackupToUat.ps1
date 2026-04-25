# Usage
#
# ./BackupToUat.ps1 -source https://localhost:7247/api/Data/Backup/ -destination https://localhost:7247/api/Data/Restore/ -identity automated_backup -backupToken abcd -restoreToken efgh -restorePassword ijkl

param ([string] $source, [string] $destination, [string] $identity, [switch] $dryRun)

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

$restorePassword = (Get-Variable -Name "RestorePassword")
$restoreToken = (Get-Variable -Name "RestoreToken")
$backupToken = (Get-Variable -Name "BackupToken")

try {
    Write-Output "Requesting backup from $($source)"
    $backupRequest = @{requestToken=$backupToken;identity=$identity} | ConvertTo-Json
    $backupResponse = Invoke-WebRequest -UseDefaultCredentials -Uri $source -Method POST -UseBasicParsing -ContentType "application/json" -Body $backupRequest
} catch {
    Write-Error $_.Exception
    Write-Error "Unable to backup, exiting"
    Exit -1
}

$backupData = $backupResponse | ConvertFrom-Json

$backupData.errors | ForEach-Object { Write-Error $_ }
$backupData.warnings | ForEach-Object { Write-Output $_ }
$backupData.messages | ForEach-Object { Write-Output $_ }

if ($backupData.success -ne $true) {
    Write-Error "Backup was not successful, exiting"
    Exit -2
}

$zipBytes = [System.Convert]::FromBase64String($backupData.result.zip)
Write-Output "Received backup: $([System.Math]::Round($backupData.result.zip.length / 1024))kb"

try {
    Write-Output "Restoring backup into $($destination)"
    ## needs to send a multi-part form request with the zip file

    $zipContent = [System.Text.Encoding]::GetEncoding('ISO-8859-1').GetString($zipBytes)

    $boundaryHeader = "----WebKitFormBoundarydGBlYGAAkE1mNAF8"
    $boundary = "--$($boundaryHeader)"

    $restoreRequest = @"
$($boundary)
Content-Disposition: form-data; name="Zip"; filename="backup.zip"
Content-Type: application/x-zip-compressed

$($zipContent)
$($boundary)
Content-Disposition: form-data; name="identity"

$($identity)
$($boundary)
Content-Disposition: form-data; name="requestToken"

$($restoreToken)
$($boundary)
Content-Disposition: form-data; name="password"

$($restorePassword)
$($boundary)
Content-Disposition: form-data; name="dryRun"

$($dryRun)
$($boundary)
Content-Disposition: form-data; name="purgeData"

false
$($boundary)--
"@

    $restoreResponse = Invoke-WebRequest -Uri $destination -Method POST -UseBasicParsing -ContentType "multipart/form-data; boundary=$($boundaryHeader)" -Body $restoreRequest
} catch {
    Write-Output $_.Exception

    $result = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($result)
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $responseBody = $reader.ReadToEnd()
    Write-Error $responseBody
    Write-Error "Unable to restore, exiting"
    Exit -3
}

$responseData = $restoreResponse | ConvertFrom-Json

$responseData.errors | ForEach-Object { Write-Output $_ }
$responseData.warnings | ForEach-Object { Write-Output $_ }
$responseData.messages | ForEach-Object { Write-Output $_ }

if ($responseData.success -ne $true) {
    Write-Error "Restore was not successful, exiting"
    Exit -4
}

Write-Output "Restore successful"
Exit 0