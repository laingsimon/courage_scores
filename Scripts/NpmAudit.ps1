param()
$AuditCommentHeading = "npm audit report"
$OutdatedCommentHeading = "npm outdated report"
$BypassNpmAuditViaCommentCommentContent = "bypass npm audit"
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
            Write-Host "Unable to find pull-request to release, unable to add npm-audit comments"
        }
    }
    else
    {
        Write-Host "Not a push to main, unable to add npm-audit comments"
    }
}

if ($GitHubEvent -eq "pull_request")
{
    $CommentsUrl = "https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    $AuditComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $AuditCommentHeading)
    $BypassNpmAuditViaCommentComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $BypassNpmAuditViaCommentCommentContent -ExactMatch)
    $OutdatedComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $OutdatedCommentHeading)
}

$NpmAuditResult = Invoke-NpmCommand -Command "audit"
If ($NpmAuditResult.ExitCode -ne 0)
{
    $BypassInstruction="Add comment to this PR with the content **$($BypassNpmAuditViaCommentCommentContent)** to bypass these vulnerabilities when the workflow runs next"
    if ($BypassNpmAuditViaCommentComments.Length -gt 0)
    {
        $BypassInstruction="A comment exists with the wording **$($BypassNpmAuditViaCommentCommentContent)**; warnings are ignored for this PR"
    }

    if ($GitHubEvent -eq "pull_request")
    {
        Update-PullRequestComment -GitHubToken $Token -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $AuditComments -Markdown "#### $($AuditCommentHeading)`n`n$($GitHubMarkdownCodeBlock)`n$($NpmAuditResult.output)`n$($NpmAuditResult.error)`n$($GitHubMarkdownCodeBlock)`n$($BypassInstruction)"
    }
    else
    {
        Write-Host "#### $($AuditCommentHeading)`n`n$($GitHubMarkdownCodeBlock)`n$($NpmAuditResult.output)`n$($NpmAuditResult.error)`n$($GitHubMarkdownCodeBlock)`n$($BypassInstruction)"
    }
}
elseif ($GitHubEvent -eq "pull_request")
{
    Remove-ExistingComments -GitHubToken $Token -Comments $AuditComments
}

$OutdatedNpmModulesComment = Invoke-Expression "$($PSScriptRoot)/Format-OutdatedNpmModules.ps1 -OutdatedCommentHeading ""$OutdatedCommentHeading"""
If ($OutdatedNpmModulesComment -ne "")
{
    if ($GitHubEvent -eq "pull_request")
    {
        Update-PullRequestComment -GitHubToken $Token -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $OutdatedComments -Markdown $OutdatedNpmModulesComment
    }
    else
    {
        Write-Host $OutdatedNpmModulesComment
    }
}
elseif ($GitHubEvent -eq "pull_request")
{
    Remove-ExistingComments -GitHubToken $Token -Comments $OutdatedComments
}

If ($NpmAuditResult.ExitCode -ne 0 -and $BypassNpmAuditViaCommentComments.Length -gt 0)
{
    Write-Message "npm audit warnings have been bypassed by request"
    Exit 0
}

Exit $NpmAuditResult.ExitCode
