param()

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

$Repo = $env:GITHUB_REPOSITORY
$RefName = $env:GITHUB_REF_NAME # will be in the format <pr_number>/merge
$Token = $env:GITHUB_TOKEN
$GitHubJob = $env:GITHUB_JOB
$GitHubRunAttempt = $env:GITHUB_RUN_ATTEMPT
$GitHubRunId = $env:GITHUB_RUN_ID
$GitHubRunNumber = $env:GITHUB_RUN_NUMBER
$TestsCommentHeading = "Failed tests"

Write-Host "GITHUB_JOB=$($GitHubJob), GITHUB_RUN_ATTEMPT=$($GitHubRunAttempt), GITHUB_RUN_ID=$($GitHubRunId), GITHUB_RUN_NUMBER=$($GitHubRunNumber)"

$Comments = [array] (Get-PullRequestComments $TestsCommentHeading)
Remove-ExistingComments -Comments $Comments

Add-PullRequestComment "#### $($TestsCommentHeading)`n`nDetails of the failed tests (jest and dotnet)"