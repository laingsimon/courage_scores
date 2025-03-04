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
$CommentsUrl = "https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
$AuditComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $AuditCommentHeading)
$BypassNpmAuditViaCommentComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $BypassNpmAuditViaCommentCommentContent -ExactMatch)
$OutdatedComments = [array] (Get-PullRequestComments -GitHubToken $Token -Repo $Repo -CommentsUrl $CommentsUrl -CommentHeading $OutdatedCommentHeading)

$NpmAuditResult = Invoke-NpmCommand -Command "audit"
If ($NpmAuditResult.output -ne "")
{
    Write-Output $NpmAuditResult.output
}
If ($NpmAuditResult.error -ne "")
{
    Write-Error $NpmAuditResult.error
}
If ($NpmAuditResult.ExitCode -ne 0)
{
    $BypassInstruction="Add comment to this PR with the content **$($BypassNpmAuditViaCommentCommentContent)** to bypass these vulnerabilities when the workflow runs next"
    if ($BypassNpmAuditViaCommentComments.Length -gt 0)
    {
        $BypassInstruction="A comment exists with the wording **$($BypassNpmAuditViaCommentCommentContent)**; warnings are ignored for this PR"
    }

    if ($env:GITHUB_EVENT_NAME -eq "pull_request")
    {
        Upsert-PullRequestComment -GitHubToken $Token -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $AuditComments -Markdown "#### $($AuditCommentHeading)`n`n$($GitHubMarkdownCodeBlock)`n$($NpmAuditResult.output)`n$($NpmAuditResult.error)`n$($GitHubMarkdownCodeBlock)`n$($BypassInstruction)"
    }
}
elseif ($env:GITHUB_EVENT_NAME -eq "pull_request")
{
    Remove-ExistingComments -GitHubToken $Token -Comments $AuditComments
}

$OutdatedNpmModulesComment = Invoke-Expression "$($PSScriptRoot)/Format-OutdatedNpmModules.ps1 -OutdatedCommentHeading ""$OutdatedCommentHeading"""
If ($OutdatedNpmModulesComment -ne "")
{
    if ($env:GITHUB_EVENT_NAME -eq "pull_request")
    {
        Upsert-PullRequestComment -GitHubToken $Token -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $OutdatedComments -Markdown $OutdatedNpmModulesComment
    }
}
elseif ($env:GITHUB_EVENT_NAME -eq "pull_request")
{
    Remove-ExistingComments -GitHubToken $Token -Comments $OutdatedComments
}

If ($NpmAuditResult.ExitCode -ne 0 -and $BypassNpmAuditViaCommentComments.Length -gt 0)
{
    Write-Message "npm audit warnings have been bypassed by request"
    Exit 0
}

Exit $NpmAuditResult.exitCode
