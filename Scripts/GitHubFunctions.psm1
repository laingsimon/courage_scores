Function Get-PullRequestComments($GitHubToken, $CommentsUrl, $CommentHeading, [switch] $ExactMatch) 
{
    Write-Host "Get pull-request comments - $($CommentHeading)"

    $Response = Invoke-WebRequest `
        -Uri $CommentsUrl `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($GitHubToken)";
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

Function Get-PullRequests($GitHubToken, $Repo, $Base)
{
    # find all pull requests that are targeting the $Base
    Write-Host "Getting pull requests into $($Base)..."

    $Response = $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/pulls?state=open&base=$($Base)" `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($GitHubToken)";
        }

    return $Response | ConvertFrom-Json | Select-Object @{ label='url'; expression={$_.url}}, @{ label='title'; expression={$_.title}}, @{ label='number'; expression={$_.number}}
}

Function Remove-ExistingComments($GitHubToken, $Comments) 
{
    If ($Comments.Count -gt 0)
    {
        Write-Error "Remove existing comments: $($Comments.Count)"
        $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ -GitHubToken $GitHubToken }
    }
}

Function Upsert-PullRequestComment($GitHubToken, $Repo, $PullRequestNumber, $Comments, $Markdown)
{
    if ($Comments -ne $null -and $Comments.Length -eq 1)
    {
        $Comment = $Comments[0]
        Update-PullRequestComment -GitHubToken $GitHubToken -Repo $Repo -Comment $Comment -Markdown $Markdown
        return
    }

    if ($Comments -ne $null)
    { 
        Remove-ExistingComments -GitHubToken $GitHubToken -Comments $Comments
    }
    Add-PullRequestComment -GitHubToken $GitHubToken -Repo $Repo -Markdown $Markdown -PullRequestNumber $PullRequestNumber
}

## private
Function Add-PullRequestComment($GitHubToken, $Repo, $PullRequestNumber, $Markdown)
{
    $Body = "{""body"": ""$($Markdown.Replace("`n", "\n"))""}"
    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"

    # Write-Host "Sending POST request to $($Url) with body $($Body)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($GitHubToken)";
        } `
        -Method Post `
        -Body $Body

    if ($Response.StatusCode -ne 201) 
    {
        Write-Error "Error creating comment at url $($Url)"
    }
}

## private
Function Update-PullRequestComment($GitHubToken, $Repo, $Comment, $Markdown)
{
    $Body = "{""body"": ""$($Markdown.Replace("`n", "\n"))""}"
    $Url="https://api.github.com/repos/$($Repo)/issues/comments/$($Comment.id)"

    Write-Host "Sending PATCH request to $($Url) with body $($Body)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($GitHubToken)";
        } `
        -Method Patch `
        -Body $Body

    if ($Response.StatusCode -ne 200)
    {
        Write-Error "Error updating comment at url $($Url)"
    }
}

## private
Function Remove-ExistingComment($GitHubToken, $Comment)
{
    $CommentId = $Comment.id
    $Url = $Comment.url

    if ($CommentId -eq "" -or $CommentId -eq $null)
    {
        Write-Error "Cannot delete comment, no id: $($Comment)"
        Return
    }

    Write-Host "Deleting comment '$($CommentId)'"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($GitHubToken)";
        } `
        -Method Delete

    if ($Response.StatusCode -ne 204) 
    {
        Write-Error "Error deleting comment at url $($Url)"
    }
}
