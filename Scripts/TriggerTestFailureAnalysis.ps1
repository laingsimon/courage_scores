param()

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
}

Function Get-PullRequestComments($CommentHeading, [switch] $ExactMatch) 
{
    If ($GitHubEvent -ne "pull_request") 
    {
        $EmptyList = @()
        Return ,$EmptyList
    }

    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    Write-Message "Get pull-request comments - $($CommentHeading)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($ReadToken)";
        }

    if ($Response.StatusCode -ne 200) 
    {
        Write-Error "Error getting comment"
    }

    $Json = $Response | ConvertFrom-Json
    if ($ExactMatch)
    {
        Return $Json `
        | Where-Object { $_.body -eq $CommentHeading } `
    }

    Return $Json `
        | Where-Object { $_.body -like "*$($CommentHeading)*" } `
}

Function Set-Comment($Comments, $Markdown)
{
    if ($Comments.Length -eq 1)
    {
        $Comment = $Comments[0]
        Update-Comment -Comment $Comment -Markdown $Markdown 
        return
    }

    Remove-ExistingComments $Comments
    Add-PullRequestComment $Markdown
}

Function Update-Comment($Comment, $Markdown)
{
    If ($GitHubEvent -ne "pull_request") 
    {
        [Console]::Error.WriteLine("Cannot update PR comment; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME) / $($PullRequestNumber)`n`n$($Markdown)")
        Return
    }

    $Body = "{""body"": ""$($Markdown.Replace("`n", "\n"))""}"
    $Url="https://api.github.com/repos/$($Repo)/issues/comments/$($Comment.id)"

    # Write-Message "Sending PATCH request to $($Url) with body $($Body)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($AddCommentToken)";
        } `
        -Method Patch `
        -Body $Body

    if ($Response.StatusCode -ne 200)
    {
        Write-Error "Error updating comment at url $($Url)"
    }
}

Function Remove-ExistingComment($Comment)
{
    $CommentId = $Comment.id
    $Url = $Comment.url

    if ($CommentId -eq "" -or $CommentId -eq $null)
    {
        Write-Error "Cannot delete comment, no id: $($Comment)"
        Return
    }

    Write-Message "Deleting comment '$($CommentId)'"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($ReadToken)";
        } `
        -Method Delete

    if ($Response.StatusCode -ne 204) 
    {
        Write-Error "Error deleting comment at url $($Url)"
    }
}

Function Remove-ExistingComments($Comments) 
{
    If ($GitHubEvent -ne "pull_request") 
    {
        Return
    }

    If ($Comments.Count -gt 0)
    {
        Write-Message "Remove existing comments: $($Comments.Count)"
        $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ }
    }
}

Function Add-PullRequestComment($Markdown)
{
    If ($GitHubEvent -ne "pull_request") 
    {
        [Console]::Error.WriteLine("Cannot add PR comment; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME) / $($PullRequestNumber)`n`n$($Markdown)")
        Return
    }

    $Body = "{""body"": ""$($Markdown.Replace("`n", "\n"))""}"
    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"

    # Write-Message "Sending POST request to $($Url) with body $($Body)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($AddCommentToken)";
        } `
        -Method Post `
        -Body $Body

    if ($Response.StatusCode -ne 201) 
    {
        Write-Error "Error creating comment at url $($Url)"
    }
}

Function Get-PullRequests($Base)
{
    # find all pull requests that are targeting the $Base
    Write-Message "Getting release pull requests..."

    $Response = $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/pulls?state=open&base=release" `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($ReadToken)";
        }

    return $Response | ConvertFrom-Json | Select-Object @{ label='url'; expression={$_.url}}, @{ label='title'; expression={$_.title}}, @{ label='number'; expression={$_.number}}
}

Function Get-PullRequestCommentText()
{
    return "<!-- LogsUrl=https://api.github.com/repos/$($Repo)/actions/runs/$($GitHubRunId)/attempts/$($GitHubRunAttempt)/logs -->
<!-- PullRequestNumber=$($PullRequestNumber) -->
<!-- RefName=$($RefName) -->
<!-- GitHubJob=$($GitHubJob) -->
<!-- GitHubEvent=$($GitHubEvent) -->
<!-- GitHubRunId=$($GitHubRunId) -->
<!-- GitHubRunAttempt=$($GitHubRunAttempt) -->

⏱️ Collecting test results from run $($GitHubRunId)..."
}

$Repo = $env:GITHUB_REPOSITORY
$RefName = $env:GITHUB_REF_NAME # will be in the format <pr_number>/merge
$ReadToken=$env:GITHUB_TOKEN
$AddCommentToken=$env:ADD_COMMENT_TOKEN
If ($RefName -ne $null)
{
    $PullRequestNumber=$RefName.Replace("/merge", "")
}
else
{
    $PullRequestNumber = ""
}
$GitHubJob = $env:GITHUB_JOB
$GitHubRunAttempt = $env:GITHUB_RUN_ATTEMPT
$GitHubRunId = $env:GITHUB_RUN_ID
$GitHubRunNumber = $env:GITHUB_RUN_NUMBER
$GitHubEvent = $env:GITHUB_EVENT_NAME
$TestsCommentHeading = "Test results"

if ($PullRequestNumber -eq "main" -and $GitHubEvent -eq "push")
{
    # find the pull request for main
    $PullRequest = Get-PullRequests -Base "release"
    if ($PullRequest -ne $null)
    {
        $PullRequestNumber = "$($PullRequest.number)"
        $GitHubEvent = "pull_request"
    }
}

if ($GitHubEvent -ne "pull_request" -or $PullRequestNumber -eq "")
{
    Write-Message "Not triggered (or able to find the relevant) pull request"
    Exit
}

$Comments = [array] (Get-PullRequestComments $TestsCommentHeading)
$CommentText = Get-PullRequestCommentText

try
{
    Set-Comment -Comments $Comments -Markdown "#### $($TestsCommentHeading)`n$($CommentText)"
}
catch
{
    Write-Message "Unable to add comment: $($_.Exception.Message)"
}
