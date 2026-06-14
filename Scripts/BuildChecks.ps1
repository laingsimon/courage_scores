param([int] $ErrorThreshold, [int] $WarningThreshold, [string] $Extension)

$currentDirectory = (Get-Item .).FullName
$branch = $env:GITHUB_HEAD_REF
Import-Module -Name "$PSScriptRoot/GitHubFunctions.psm1" -Force

Function Get-Files($MinLines, $MaxLines)
{
    Write-Message "Finding $($Extension) files with > $($MinLines) lines and <= $($MaxLines)..."
    return Get-ChildItem -Recurse `
        | Where-Object { $_.Name.EndsWith($Extension) } `
        | Where-Object { $_.FullName.Contains("node_modules") -eq $False } `
        | Select-Object  @{ label='fullName'; expression={$_.FullName} }, 
                         @{ label='relativePath'; expression={[System.IO.Path]::GetRelativePath($currentDirectory, $_.fullName)}},
                         @{ label='name'; expression={$_.name} },
                         @{ label='lines'; expression={(Get-Content $_.FullName | Measure-Object -Line).Lines} } `
        | Where-Object { $_.lines -gt $MinLines -and $_.lines -le $MaxLines } `
        | Sort-Object -descending -property 'lines' `
        | Select-Object @{ label='row'; expression = {"| [$($_.name)](../blob/$($branch)/$($_.relativePath)) | $($_.lines) |" } },
                        @{ label='file'; expression = {$_.fullName} },
                        @{ label='relativePath'; expression = {$_.relativePath} },
                        @{ label='lines'; expression = {$_.lines} }
}

Function Print-Files($Heading, $Files, $Comments) 
{
    $Output=""
    $Output += "| File | Lines |`n"
    $Output += "| --- | --- |`n"

    $Files | ForEach-Object {
        Upsert-PullRequestReviewComment -GitHubToken $Token -File $_.file -RelativePath $_.relativePath -Lines $_.lines
        $Output += "$($_.row)`n"
    }

    [Console]::Error.WriteLine($Heading)
    [Console]::Error.WriteLine($Output)
}

Function Remove-OutOfDateComments($GitHubToken, $Matching)
{
    $AllComments = Get-PullRequestReviewComments -GitHubToken $Token -Repo $Repo -PullRequestNumber $PullRequestNumber -Side "LEFT" -SubjectType "file"

    Write-Message "Found $($AllComments.length) pull request review comments"
    $CommentsToRemove = $AllComments | Where-Object { $_.body -like "*<!-- BuildChecksComment -->*" -and $_.body -like $Matching -and $_.body -like "*<!-- Extension: $($Extension) -->*" } | Where-Object {
        $Comment = $_
        $CommentPath = $Comment.path
        $MatchingComment = $Files | Where-Object { $Comment.relativePath -eq $CommentPath }
        $CanRemove = $MatchingComment -eq $null

        if ($CanRemove)
        {
            Write-Message "File $($CommentPath) doesn't exceed the threshold, the comment $($Comment.id) can be removed"
        }
        return $CanRemove
    }

    Write-Message "Attempting to remove $($CommentsToRemove.length) pull request review comments"
    if ($CommentsToRemove -ne $null)
    {
        Clear-PullRequestReviewComments -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $CommentsToRemove
    }
}

Function Upsert-PullRequestReviewComment($GitHubToken, $File, $RelativePath, $Lines)
{
    If ($Lines -le $ErrorThreshold)
    {
        $Reason = "is approaching the threshold of $($ErrorThreshold) lines"
    }
    else
    {
        $Reason = "has exceeded the threshold of $($ErrorThreshold) lines"
    }

    $Message = "<!-- Extension: $($Extension) -->File has $($Lines) which $($Reason)"
    $CommitSha = $env:COMMIT_SHA

    if ($GitHubEvent -ne "pull_request")
    {
        return
    }

    $RelativePath = $RelativePath.Replace("\", "/")
    Set-PullRequestReviewComment -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -Body $Message -CommitId $CommitSha -Path $RelativePath -Side "LEFT" -SubjectType "file"
}

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
}

If ($Extension -eq $null -or $Extension -eq "" -or $Extension -eq ".")
{
    [Console]::Error.WriteLine("File extension must be supplied")
    Exit 1
}

$RefName=$env:GITHUB_REF_NAME # will be in the format <pr_number>/merge
$Token=$env:GITHUB_TOKEN
If ($RefName -ne $null)
{
    $PullRequestNumber=$RefName.Replace("/merge", "")
}
else
{
    $PullRequestNumber = ""
}
$Repo = $env:GITHUB_REPOSITORY
$GitHubEvent = $env:GITHUB_EVENT_NAME

if ($GitHubEvent -ne "pull_request")
{
    if ($PullRequestNumber -eq "main" -and $GitHubEvent -eq "push")
    {
        # find the pull request for main
        $PullRequest = Get-PullRequests -GitHubToken $Token -Repo $Repo -Base "release"
        if ($PullRequest -ne $null)
        {
            $PullRequestNumber = "$($PullRequest.number)"
            $GitHubEvent = "pull_request"
        }
        else
        {
            Write-Host "Unable to find pull-request to release, unable to add build-check comments"
        }
    }
    else
    {
        Write-Host "Not a push to main, unable to add comments"
    }
}

if ($GitHubEvent -eq "pull_request")
{
    $CommentsUrl = "https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    $ApproachingComments = Get-PullRequestComments -GitHubToken $Token -CommentsUrl $CommentsUrl -CommentHeading "*$($Extension) file/s approaching*"
    $ExceedingComments = Get-PullRequestComments -GitHubToken $Token -CommentsUrl $CommentsUrl -CommentHeading "*$($Extension) file/s exceeding*"
}
$MaxLines = [int]::MaxValue

If ($ErrorThreshold -gt 0)
{
    $FilesOverThreshold = [array] (Get-Files -MinLines $ErrorThreshold -MaxLines $MaxLines)
    If ($FilesOverThreshold.Length -gt 0)
    {
        Print-Files -Heading "$($FilesOverThreshold.Length) $($Extension) file/s exceeding limit" -Files $FilesOverThreshold -Comments $ExceedingComments
        [Console]::Error.WriteLine("There are $($FilesOverThreshold.Length) $($Extension) file/s that have more than $($ErrorThreshold) lines")
    }
    elseif ($GitHubEvent -eq "pull_request")
    {
        Remove-OutOfDateComments -GitHubToken $Token -Matching "*exceeded*"
    }
}

If ($WarningThreshold -gt 0)
{
    If ($ErrorThreshold -le 0)
    {
        $Warning = "over $($WarningThreshold) line warning threshold"
        $FilesNearingLimit = [array] (Get-Files -MinLines $WarningThreshold -MaxLines $MaxLines)
    }
    else
    {
        $Warning = "approaching $($ErrorThreshold) line limit"
        $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines $ErrorThreshold
    }

    If ($FilesNearingLimit.Length -gt 0)
    {
        Print-Files -Heading "$($FilesNearingLimit.Length) $($Extension) file/s $($Warning)" -Files $FilesNearingLimit -Comments $ApproachingComments
    }
    elseif ($GitHubEvent -eq "pull_request")
    {
        Remove-OutOfDateComments -GitHubToken $Token -Matching "*approaching*"
    }
}

if ($ErrorThreshold -le 0 -and $WarningThreshold -le 0)
{
    [Console]::Error.WriteLine("Neither -ErrorThreshold nor -WarningThreshold are supplied; no constraints to apply to files")
}
