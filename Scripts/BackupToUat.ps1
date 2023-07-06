param ([string] $source, [string] $destination, [string] $identity, [string] $backupToken, [string] $restoreToken, [string] $restorePassword, [switch] $dryRun)

# Usage
#
# ./BackupToUat.ps1 -source https://localhost:7247/api/Data/Backup/ -destination https://localhost:7247/api/Data/Restore/ -identity automated_backup -backupToken abcd -restoreToken efgh -restorePassword ijkl

try {
    Write-Host -ForegroundColor Cyan "Requesting backup from $($source)"
    $backupRequest = @{requestToken=$backupToken;identity=$identity} | ConvertTo-Json
    $backupResponse = Invoke-WebRequest -UseDefaultCredentials -Uri $source -Method POST -UseBasicParsing -ContentType "application/json" -Body $backupRequest
} catch {
    Write-Host -ForegroundColor Red $_.Exception
    Write-Host -ForegroundColor Red "Unable to continue, exiting"
    Exit
}

$backupData = $backupResponse | ConvertFrom-Json

$backupData.errors | ForEach-Object { Write-Host -ForegroundColor Red $_ }
$backupData.warnings | ForEach-Object { Write-Host -ForegroundColor DarkYellow $_ }
$backupData.messages | ForEach-Object { Write-Host -ForegroundColor DarkCyan $_ }

if ($backupData.success -ne $true) {
    Write-Host -ForegroundColor Red "Backup was not successful, exiting"
    Exit
}

$zipBytes = [System.Convert]::FromBase64String($backupData.result.zip)
Write-Host -ForegroundColor Cyan "Received backup: $([System.Math]::Round($backupData.result.zip.length / 1024))kb"

try {
    Write-Host -ForegroundColor Cyan "Restoring backup into $($destination)"
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
    Write-Host -ForegroundColor Red $_.Exception

    $result = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($result)
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $responseBody = $reader.ReadToEnd()
    Write-Host -ForegroundColor Red $responseBody
    Write-Host -ForegroundColor Red "Unable to continue, exiting"
    Exit
}

$responseData = $restoreResponse | ConvertFrom-Json

$responseData.errors | ForEach-Object { Write-Host -ForegroundColor Red $_ }
$responseData.warnings | ForEach-Object { Write-Host -ForegroundColor DarkYellow $_ }
$responseData.messages | ForEach-Object { Write-Host -ForegroundColor DarkCyan $_ }

if ($responseData.success -ne $true) {
    Write-Host -ForegroundColor Red "Restore was not successful, exiting"
    Exit
}

Write-Host -ForegroundColor Green "Restore successful"