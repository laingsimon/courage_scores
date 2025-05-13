$PrTitle = $env:PR_TITLE
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

function Close-Milestone($Milestone)
{
    $Json = "{" +
        "`"state`": `"`closed`"" +
    "}"

    Write-Host "Closing milestone $($Milestone.title) ($($Milestone.number))..."
    $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/milestones/$($Milestone.number)" `
        -Method PATCH `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($Token)";
        } `
        -Body $Json

    return $Response.StatusCode -eq 200
}

$Milestones = [array](Get-OpenMilestones)
if ($Milestones.Length -eq 0)
{
    # No milestones
    Write-Host "No open milestones exist"
    Exit
}

$Milestone = $Milestones | Where-Object { $_.title -eq $PrTitle }
if ($Milestone -eq $null)
{
    # No milestones
    Write-Host "Open milestone not found with name '$($PrTitle)'"
    Exit
}

## close the milestone
$Closed = Close-Milestone -Milestone $Milestone
if ($Closed)
{
    Write-Host "Milestone closed"
}
else
{
    Write-Host "Milestone could not be closed"
}