param()
$PrettierCommentHeading = "npm prettier report"
$BypassNpmPrettierViaCommentCommentContent = "bypass npm prettier"
$GitHubMarkdownCodeBlock="``````"

Import-Module -Name "$PSScriptRoot/NpmFunctions.psm1"
Import-Module -Name "$PSScriptRoot/GitHubFunctions.psm1"

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
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
            Write-Host "Unable to find pull-request to release, unable to add npm-prettier comments"
        }
    }
    else
    {
        Write-Host "Not a push to main, unable to add npm-prettier comments"
    }
}

if ($GitHubEvent -eq "pull_request")
{
    $CommentsUrl = "https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    $PrettierComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $PrettierCommentHeading)
    $BypassNpmPrettierViaCommentComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $BypassNpmPrettierViaCommentCommentContent -ExactMatch)
    $OutdatedComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $OutdatedCommentHeading)
}

Write-Message "Running prettier..."
$NpmPrettierCheckResult = Invoke-NpxCommand -Command "prettier . --check"

If ($NpmPrettierCheckResult.ExitCode -ne 0)
{
    Write-Message $NpmPrettierCheckResult.error

    $NpmPrettierWriteResult = Invoke-NpxCommand -Command "prettier . --write"
    $GitDiffContent = (git diff) -join "`n"

    $BypassInstruction="Add comment to this PR with the content **$($BypassNpmPrettierViaCommentCommentContent)** to bypass these checks when the workflow runs next"
    if ($BypassNpmPrettierViaCommentComments.Length -gt 0)
    {
        $BypassInstruction="A comment exists with the wording **$($BypassNpmPrettierViaCommentCommentContent)**; warnings are ignored for this PR"
    }

    $CommentContent = "$($NpmPrettierCheckResult.error)`n$($GitDiffContent)" 

    if ($GitHubEvent -eq "pull_request")
    {
        Update-PullRequestComment -GitHubToken $Token -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $PrettierComments -Markdown "#### $($PrettierCommentHeading)`n`n$($GitHubMarkdownCodeBlock)`n$($CommentContent)`n$($GitHubMarkdownCodeBlock)`n$($BypassInstruction)"
    }
    else
    {
        Write-Host "#### $($PrettierCommentHeading)`n`n$($GitHubMarkdownCodeBlock)`n$($CommentContent)`n$($GitHubMarkdownCodeBlock)`n$($BypassInstruction)"
    }

    If ($BypassNpmPrettierViaCommentComments.Length -gt 0)
    {
        Write-Message "npm prettier warnings have been bypassed by request"
        Exit 0
    }

    Exit -1
}

Remove-ExistingComments -GitHubToken $Token -Comments $PrettierComments
