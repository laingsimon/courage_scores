param($MinOpen)
$Token = $env:GITHUB_TOKEN
$Repo = $env:GITHUB_REPOSITORY

Import-Module -Name "$PSScriptRoot/GitHubFunctions.psm1" -Force

if ($Repo -eq "" -or $Repo -eq $null)
{
    $Repo = "laingsimon/courage_scores"
}

function Invoke-GitHubApiGetRequest($Uri)
{
    return Invoke-WebRequest `
        -Uri $Uri `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($Token)";
        }
}

function Get-OpenMilestones()
{
    Write-Host -ForegroundColor Yellow "Getting milestones..."
    
    # query the API for all open milestones 
    $Response = Invoke-GitHubApiGetRequest -Uri "https://api.github.com/repos/$($Repo)/milestones?state=open"

    $title = @{label='title';expression={$_.title}}
    $url = @{label='url';expression={$_.url}}
    $number = @{label='number';expression={$_.number}}

    return (ConvertFrom-Json -InputObject $Response) | Select-Object -Property $title,$url,$number
}

function Get-NewestMilestone($Milestones)
{
    # sort milestones by name ascending, pick the first
    $SortedMilestoneVersions = $Milestones | %{ new-object System.Version ($_.title.Substring(1)) } | sort -Descending
    $HighestMilestoneVersion = $SortedMilestoneVersions | Select-Object -First 1
    $HighestMilestone = $Milestones | Where-Object { $_.title -eq "v$($HighestMilestoneVersion)" }
    return $HighestMilestone
}

function Create-Milestone($From, $Increment)
{
    $Match = [System.Text.RegularExpressions.Regex]::Match($From, "^(.+?)\.(\d+)$")
    $MajorAndMinorVersion = $Match.Groups[1].Value
    $PatchVersion = $Match.Groups[2].Value
    $NewPatchVersion = ([int]$PatchVersion) + $Increment
    $NewVersion = "$($MajorAndMinorVersion).$($NewPatchVersion)"

    Write-Host "Create milestone $($NewVersion)..."

    $Json = "{" +
        "`"state`": `"open`"," +
        "`"title`": `"$($NewVersion)`"" +
    "}"

    $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/milestones" `
        -Method POST `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($Token)";
        } `
        -Body $Json

    return $Response.StatusCode -eq 201
}

$Milestones = [array](Get-OpenMilestones)
if ($Milestones.Length -eq 0)
{
    # No milestones
    Write-Host "There are no open milestones"
    Exit
}

if ($Milestones.Length -ge $MinOpen)
{
    Write-Host "There are $($Milestones.Length) open milestone/s, no need to create more"
    Exit
}

$MilestonesToCreate = $MinOpen - $Milestones.Length
$NewestMilestone = Get-NewestMilestone -Milestones $Milestones

Write-Host "Need to create $($MilestonesToCreate) milestone(s) following from $($NewestMilestone.title)"

for ($Index = 1; $Index -le $MilestonesToCreate; $Index++)
{
    $Success = Create-Milestone -From $NewestMilestone.title -Increment $Index
    if ($Success -ne $true)
    {
        Write-Host "Failed to create milestone, aborting script"
        Exit
    }
}