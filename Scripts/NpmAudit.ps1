param()
$AuditCommentHeading = "npm audit report"
$OutdatedCommentHeading = "npm outdated report"
$BypassNpmAuditViaCommentCommentContent = "bypass npm audit"
$GitHubMarkdownCodeBlock="``````"

Import-Module -Name "$PSScriptRoot/NpmFunctions.psm1"

Function Get-PullRequestComments($CommentHeading, [switch] $ExactMatch) 
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
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
            Authorization="Bearer $($Token)";
        }

    if ($Response.StatusCode -ne 200) 
    {
        $Response
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
            Authorization="Bearer $($Token)";
        } `
        -Method Delete

    if ($Response.StatusCode -ne 204) 
    {
        Write-Error "Error deleting comment at url $($Url)"
        $Response
    }
}

Function Remove-ExistingComments($Comments) 
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
    {
        Return
    }

    If ($Comments.Count -gt 0)
    {
        Write-Message "Remove existing comments: $($Comments.Count)"
        $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ }
    }
}

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
}

Function Add-PullRequestComment($Markdown)
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
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
            Authorization="Bearer $($Token)";
        } `
        -Method Post `
        -Body $Body

    if ($Response.StatusCode -ne 201) 
    {
        Write-Error "Error creating comment at url $($Url)"
        $Response
    }
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
$AuditComments = [array] (Get-PullRequestComments $AuditCommentHeading)
$BypassNpmAuditViaCommentComments = [array] (Get-PullRequestComments $BypassNpmAuditViaCommentCommentContent -ExactMatch)
Remove-ExistingComments -Comments $AuditComments
$OutdatedComments = [array] (Get-PullRequestComments $OutdatedCommentHeading)
Remove-ExistingComments -Comments $OutdatedComments

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

    Add-PullRequestComment "#### $($AuditCommentHeading)`n`n$($GitHubMarkdownCodeBlock)`n$($NpmAuditResult.output)`n$($NpmAuditResult.error)`n$($GitHubMarkdownCodeBlock)`n$($BypassInstruction)"
}

$OutdatedNpmModulesComment = Invoke-Expression "$($PSScriptRoot)/Format-OutdatedNpmModules.ps1 -OutdatedCommentHeading ""$OutdatedCommentHeading"""
If ($OutdatedNpmModulesComment -ne "")
{
    Add-PullRequestComment $OutdatedNpmModulesComment
}

If ($NpmAuditResult.ExitCode -ne 0 -and $BypassNpmAuditViaCommentComments.Length -gt 0)
{
    Write-Message "npm audit warnings have been bypassed by request"
    Exit 0
}

Exit $NpmAuditResult.exitCode
