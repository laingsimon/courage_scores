param([string] $Prefix, [string] $FileName, [string] $OutdatedCommentHeading)

Import-Module -Name "$PSScriptRoot/NpmFunctions.psm1"

$NpmOutdatedResult = Invoke-NpmCommand -Command "outdated --parseable"

If ($NpmOutdatedResult.ExitCode -ne 0)
{
    $Output = "#### $($OutdatedCommentHeading)`n$(Format-NpmOutdatedContent -output $NpmOutdatedResult.output -error $NpmOutdatedResult.error)"
}
else
{
    $Output = "no outdated modules"
}

Write-Output $Output
If ($FileName -ne "")
{
    "$($Prefix)$($Output)" | Out-File -Path $FileName
}
