param([switch] $DryRun)
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

function Get-OldestMilestone($Milestones)
{
    # sort milestones by name ascending, pick the first
    $SortedMilestoneVersions = $Milestones | %{ new-object System.Version ($_.title.Substring(1)) } | Sort-Object
    $LowestMilestoneVersion = $SortedMilestoneVersions | Select-Object -First 1
    Write-Host "Lowest milestone version $($LowestMilestoneVersion) from $($SortedMilestoneVersions.Length) of $($Milestones.Length) milestone/s "
    $LowestMilestone = $Milestones | Where-Object { $_.title -eq "v$($LowestMilestoneVersion)" }
    return $LowestMilestone
}

function Get-CommitsBetween($Base, $Compare)
{
    $GitCommand = "git log $Base..$Compare --no-merges --format=""%h,%s"""
    Write-Host -ForegroundColor Green $GitCommand
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

    $type = "issue"
    try
    {
        $Response = Invoke-GitHubApiGetRequest -Uri "https://api.github.com/repos/$($Repo)/issues/$($IssueReference)/labels"

        $name = @{label='name'; expression={$_.name}}

        # Write-Host -ForegroundColor Magenta $Response
        $labels = (ConvertFrom-Json -InputObject $Response) | Select-Object -Property $name

        $labels | ForEach-Object {
            $name = $_.name

            if ($name -eq "bug")
            {
                $type = "bug"
            }
        }
    }
    catch 
    {
        Write-Error "Could not find issue $($IssueReference) in repo $($Repo): $($_.Exception)"
    }


    $IssueTypeCache[$IssueReference] = $type
    return $type
}

function Set-IssueMilestone($IssueReference, $Milestone)
{
    Write-Host "Set milestone to $($Milestone.title) for #$($IssueReference)..."

    $Json = "{" +
        "`"milestone`": $($Milestone.number)" +
    "}"
    $Url = "https://api.github.com/repos/$($Repo)/issues/$($IssueReference)"

    if ($DryRun)
    {
        Write-Host -ForegroundColor Red "DRY RUN: New description = '$($Json)'"
        Return
    }

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

function Set-PullRequestMilestone($Milestone, $Response)
{
    Set-IssueMilestone -IssueReference (ConvertFrom-Json -InputObject $Response).number -Milestone $Milestone
}

function Format-ReleaseDescription($Commits, $Milestone)
{
    Write-Host -ForegroundColor Blue "Formatting commits into description..."

    $Changes = @{}
    $Ancillary = New-Object System.Collections.Generic.List[string]
    $BugFixes = @{}
    $IssueTypeCache = @{}

    $Commits | ForEach-Object {
        $Commit = $_
        Write-Host -ForegroundColor Yellow "Commit: $($Commit)"

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
            $Ancillary.Add(  ( Format-AncillaryChange -Message $Commit.comment.Trim() )  )
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

        Set-IssueMilestone -IssueReference $_ -Milestone $Milestone
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

        Set-IssueMilestone -IssueReference $_ -Milestone $Milestone
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

function Format-AncillaryChange($Message)
{
    ## Bump jest from 30.0.4 to 30.0.5 in /CourageScores/ClientApp
    $DependabotFromAndToNpmRegex = "^Bump (.+) from ([0-9.]+) to ([0-9.]+) in .+"
    $DependabotUpdateNpmRegex = "^Bump (.+) in .+"
    $DependabotFromAndToNugetRegex = "^Bump (.+) from (.+) to (.+)"
    $DependabotUpdateNugetRegex = "^Bump (.+) to (.+)"
    $DependabotUpdate = [System.Text.RegularExpressions.Regex]::Match($Message, $DependabotFromAndToNpmRegex)
    if ($DependabotUpdate.Success -eq $true)
    {
        return "[Npm] Update **$($DependabotUpdate.Groups[1].Value)** to $($DependabotUpdate.Groups[3].Value)"
    }

    $DependabotUpdate = [System.Text.RegularExpressions.Regex]::Match($Message, $DependabotFromAndToNugetRegex)
    if ($DependabotUpdate.Success -eq $true)
    {
        return "[Nuget] Update **$($DependabotUpdate.Groups[1].Value)** to $($DependabotUpdate.Groups[3].Value)"
    }

    $DependabotUpdate = [System.Text.RegularExpressions.Regex]::Match($Message, $DependabotUpdateNpmRegex)
    if ($DependabotUpdate.Success -eq $true)
    {
        return "[Npm] Update **$($DependabotUpdate.Groups[1].Value)**"
    }

    $DependabotUpdate = [System.Text.RegularExpressions.Regex]::Match($Message, $DependabotUpdateNugetRegex)
    if ($DependabotUpdate.Success -eq $true)
    {
        return "[Nuget] Update **$($DependabotUpdate.Groups[1].Value)** to $($DependabotUpdate.Groups[2].Value)"
    }

    return $Message
}

function Create-PullRequest($Milestone, $Description, $Head, $Base)
{
    $Url = "https://api.github.com/repos/$($Repo)/pulls"
    Write-Host "Create pull request from $($Head) -> $($Base) for $($Milestone.title) via $($Url)"

    $Json = "{" +
        "`"title`":`"$($Milestone.title)`"," +
        "`"body`":`"$($Description.Replace('`"', '\"'))`"," +
        "`"head`":`"$($Head)`"," +
        "`"base`":`"$($Base)`"" +
    "}"

    if ($DryRun)
    {
        Write-Host -ForegroundColor Red "DRY RUN: Description = '$($Json)'"
        Return
    }

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Method Post `
        -Body $Json `
        -Headers @{
            "X-GitHub-Api-Version"="2022-11-28";
            "Accept"="application/vnd.github+json";
            "Authorization"="Bearer $($Token)";
        }

    Set-PullRequestMilestone -Milestone $Milestone -Response $Response
}

function Update-PullRequestDescription($Url, $Description, $Milestone)
{
    $Json = "{" +
        "`"body`": `"$($Description.Replace('`"', '\"'))`"" +
    "}"

    Write-Host "Updating pull request description: $($Json) via $($Url)"

    if ($DryRun)
    {
        Write-Host -ForegroundColor Red "DRY RUN: New description = '$($Json)'"
        Return
    }

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Method Patch `
        -Body $Json `
        -Headers @{
            "X-GitHub-Api-Version"="2022-11-28";
            "Accept"="application/vnd.github+json";
            "Authorization"="Bearer $($Token)";
        }

    Set-PullRequestMilestone -Milestone $Milestone -Response $Response
}

$Commits = Get-CommitsBetween -Base "origin/release" -Compare "origin/main"
$Milestones = [array](Get-OpenMilestones)
if ($Milestones.Length -eq 0)
{
    # No milestones
    Write-Host "No milestones exist"
    Exit
}

$OldestMilestone = Get-OldestMilestone -Milestones $Milestones
if ($OldestMilestone -eq $null)
{
    Write-Host "Could not find oldest milestone"
    Exit 1
}

Write-Host "Oldest milestone: $($OldestMilestone.title)"

$Description = (Format-ReleaseDescription -Commits $Commits -Milestone $OldestMilestone).Trim().Replace("`n", "\n")

$ReleasePullRequests = [array] (Get-PullRequests -GitHubToken $Token -Repo $Repo -Base "release")
if ($ReleasePullRequests.Length -gt 0)
{
    # release PR already exists
    Write-Host "Release Pull request already exists: $($ReleasePullRequests.title)"
    Update-PullRequestDescription -Milestone $OldestMilestone -Url $ReleasePullRequests[0].url -Description $Description
}
else
{
    Create-PullRequest -Milestone $OldestMilestone -Description $Description -Head "main" -Base "release"
}
