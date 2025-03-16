param()

Import-Module -Name "$PSScriptRoot/GitHubFunctions.psm1" -Force

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
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
<!-- AnalysisStatus=TODO -->

### ⏱️ Analysing build..."
}

$Repo = $env:GITHUB_REPOSITORY
$RefName = $env:GITHUB_REF_NAME # will be in the format <pr_number>/merge
$GitHubToken=$env:GITHUB_TOKEN
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
$TestsCommentHeading = "Build and test output"

if ($PullRequestNumber -eq "main" -and $GitHubEvent -eq "push")
{
    # find the pull request for main
    $PullRequest = Get-PullRequests -GitHubToken $GitHubToken -Repo $Repo -Base "release"
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

$CommentsUrl = "https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
$Comments = [array] (Get-PullRequestComments -GitHubToken $GitHubToken -CommentsUrl $CommentsUrl -CommentHeading $TestsCommentHeading)
$CommentText = Get-PullRequestCommentText

try
{
    Update-PullRequestComment -GitHubToken $AddCommentToken -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $Comments -Markdown "### $($TestsCommentHeading)`n$($CommentText)"
}
catch
{
    Write-Message "Unable to add comment: $($_.Exception.Message)"
}
