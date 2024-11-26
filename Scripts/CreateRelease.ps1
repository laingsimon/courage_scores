﻿$Token = $env:GITHUB_TOKEN
$Repo = $env:GITHUB_REPOSITORY

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

function Get-PullRequests($Base)
{
    # find all pull requests that are targeting the $Base
    Write-Host -ForegroundColor Cyan "Getting release pull requests..."

    $Response = Invoke-GitHubApiGetRequest -Uri "https://api.github.com/repos/$($Repo)/pulls?state=open&base=release"

    return $Response | ConvertFrom-Json | Select-Object @{ label='url'; expression={$_.url} }, @{ label='title'; expression={$_.title} }
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

function Get-OldestMilestone($Milestones)
{
    # sort milestones by name ascending, pick the first
    $SortedMilestones = $Milestones | Sort-Object -Property "title"

    # Write-Host -ForegroundColor Magenta $SortedMilestones
    return $SortedMilestones | Select-Object -First 1
}

function Get-CommitsBetween($Base, $Compare)
{
    $GitCommand = "git log $Base..$Compare --no-merges --format=""%h,%s"""
    # Write-Host -ForegroundColor Green $GitCommand
    $Output = Invoke-Expression $GitCommand
    # Write-Host -ForegroundColor Green $Output

    $sha = @{label='sha';expression={($_ -split ",")[0]}}
    $comment = @{label='comment';expression={$_.Substring(($_ -split ",")[0].Length + 1)}}

    return $Output | Select-Object -Property $sha,$comment
}

function Get-TicketType($IssueReference, $IssueTypeCache)
{
    if ($IssueTypeCache[$IssueReference] -ne $null)
    {
        return $IssueTypeCache[$IssueReference]
    }

    $Response = Invoke-GitHubApiGetRequest -Uri "https://api.github.com/repos/$($Repo)/issues/$($IssueReference)/labels"

    $name = @{label='name'; expression={$_.name}}

    # Write-Host -ForegroundColor Magenta $Response
    $labels = (ConvertFrom-Json -InputObject $Response) | Select-Object -Property $name
    $type = "issue"

    $labels | ForEach-Object {
        $name = $_.name

        if ($name -eq "bug")
        {
            $type = "bug"
        }
    }


    $IssueTypeCache[$IssueReference] = $type
    return $type
}

function Format-ReleaseDescription($Commits)
{
    Write-Host -ForegroundColor Blue "Formatting commits into description..."

    $Changes = @{}
    $Ancillary = New-Object System.Collections.Generic.List[string]
    $BugFixes = @{}
    $IssueTypeCache = @{}

    $Commits | ForEach-Object {
        $Commit = $_

        if ($Commit.comment -like "#*")
        {
            $IssueReference = [System.Text.RegularExpressions.Regex]::Match($Commit.comment, "#(\d+)").Groups[1].Value

            $IssueType = Get-TicketType -IssueReference $IssueReference -IssueTypeCache $IssueTypeCache
            $Accumulator = $Changes
            if ($IssueType -eq "bug")
            {
                $Accumulator = $BugFixes
            }

            $CurrentChanges = $Accumulator[$IssueReference]
            if ($CurrentChanges -eq $null)
            {
                $CurrentChanges = New-Object System.Collections.Generic.List[string]
                $Accumulator[$IssueReference] = $CurrentChanges
            }


            $CurrentChanges.Add($Commit.sha)
        }
        else
        {
            $Ancillary.Add($Commit.comment)
        }
    }
    
    $ChangeDescription = ""
    $BugFixDescription = ""
    $AncillaryDescription = ""
    
    $Changes.Keys | ForEach-Object {
        if ($ChangeDescription -eq "")
        {
            $ChangeDescription = "### Changes`n"
        }

        $ChangeDescription = "$($ChangeDescription)- #$($_)`n"
    }

    $BugFixes.Keys | ForEach-Object {
        if ($BugFixDescription -eq "")
        {
            if ($ChangeDescription -ne "")
            {
                $BugFixDescription = "`n"
            }
            $BugFixDescription = "$($BugFixDescription)### Bug Fixes`n"
        }

        $BugFixDescription = "$($BugFixDescription)- #$($_)`n"
    }

    $Ancillary | ForEach-Object {
        if ($AncillaryDescription -eq "")
        {
            if ($ChangeDescription -ne "" -or $BugFixDescription -ne "")
            {
                $AncillaryDescription = "`n"
            }
            $AncillaryDescription = "$($AncillaryDescription)### Ancillary`n"
        }

        $AncillaryDescription = "$($AncillaryDescription)- $($_)`n"
    }

    return "$($ChangeDescription)$($BugFixDescription)$($AncillaryDescription)`n"
}

function Create-PullRequest($Milestone, $Description, $Head, $Base)
{
    $Url = "https://api.github.com/repos/$($Repo)/pulls"
    Write-Host "Create pull request from $($Head) -> $($Base) for $($Milestone.title) via $($Url)"

    $Json = "{" +
        "`"title`":`"$($Milestone.title)`"," +
        "`"body`":`"$($Description)`"," +
        "`"head`":`"$($Head)`"," +
        "`"base`":`"$($Base)`"," +
        "`"milestone`":`"$($Milestone.number)`"" +
    "}"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Method Post `
        -Body $Json `
        -Headers @{
            "X-GitHub-Api-Version"="2022-11-28";
            "Accept"="application/vnd.github+json";
            "Authorization"="Bearer $($Token)";
        }

    $PullRequestUrl = (ConvertFrom-Json -InputObject $Response).issue_url
    $UpdateMilestoneBody = "{`"milestone`": $($Milestone.number)}"
    Write-Host "Update pull request at $($PullRequestUrl) to have $($UpdateMilestoneBody)"

    Invoke-WebRequest `
        -Uri $PullRequestUrl `
        -Method Patch `
        -Body $UpdateMilestoneBody `
        -Headers @{
            "X-GitHub-Api-Version"="2022-11-28";
            "Accept"="application/vnd.github+json";
            "Authorization"="Bearer $($Token)";
        }
}

function Update-PullRequestDescription($Url, $Description)
{
    $Json = "{" +
        "`"body`": `"$($Description)`"" +
    "}"

    Write-Host "Updating pull request description"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Method Patch `
        -Body $Json `
        -Headers @{
            "X-GitHub-Api-Version"="2022-11-28";
            "Accept"="application/vnd.github+json";
            "Authorization"="Bearer $($Token)";
        }
}

$Commits = Get-CommitsBetween -Base "origin/release" -Compare "origin/main"
$Description = (Format-ReleaseDescription -Commits $Commits).Trim().Replace('`"', '\"').Replace("`n", "\n")

$ReleasePullRequests = Get-PullRequests -Base "release"
if ($ReleasePullRequests.Length -gt 0)
{
    # release PR already exists
    Write-Host "Release Pull request already exists: $($ReleasePullRequests)"
    Update-PullRequestDescription -Url $ReleasePullRequests[0].url -Description $Description
}
else
{
    $Milestones = Get-OpenMilestones
    if ($Milestones.Length -eq 0)
    {
        # No milestones
        Write-Host "No milestones exist"
        Exit
    }

    $OldestMilestone = Get-OldestMilestone -Milestones $Milestones
    Write-Host "Oldest milestone: $($OldestMilestone.title)"

    Create-PullRequest -Milestone $OldestMilestone -Description $Description -Head "main" -Base "release"
}
