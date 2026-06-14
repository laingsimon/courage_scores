Function Add-PullRequestComment($GitHubToken, $Repo, $PullRequestNumber, $Markdown)
{
    $Body = (@{
        'body' = $Markdown
    } | ConvertTo-Json) -replace "\\u001b\[[0-9]+m",""
    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"

    Write-Host "Sending POST request to $($Url) with body`n`n$($Body)"

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

Function Set-PullRequestComment($GitHubToken, $Repo, $Comment, $Markdown)
{
    $Body = (@{
        'body' = $Markdown
    } | ConvertTo-Json) -replace "\\u001b\[[0-9]+m",""
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

Function Remove-PullRequestReviewComment($GitHubToken, $Repo, $PullRequestNumber, $CommentId)
{
    Write-Host "Deleting pull request comment '$($CommentId)' from pr #$($PullRequestNumber)"

    $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/pulls/comments/$($CommentId)" `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($GitHubToken)";
        } `
        -Method Delete

    if ($Response.StatusCode -ne 204)
    {
        Write-Error "Error deleting pull request comment $($CommentId) from pr #$($PullRequestNumber)"
    }
}

Function Update-PullRequestReviewComment($GitHubToken, $Repo, $PullRequestNumber, $CommentId, $Body)
{
    $Body = (@{
        'body' = $Body
    } | ConvertTo-Json) -replace "\\u001b\[[0-9]+m",""
    $Url="https://api.github.com/repos/$($Repo)/pulls/comments/$($CommentId)"

    Write-Host "Sending PATCH request to $($Url) with body $($Body) for pr #$($PullRequestNumber)"

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
        Write-Error "Error updating pull request review comment $($CommentId) on #$($PullRequestNumber)"
    }
}

Function Add-PullRequestReviewComment($GitHubToken, $Repo, $PullRequestNumber, $CommitId, $Path, $Side, $SubjectType, $Body)
{
    $Body = (@{
        'body' = $Body; 
        'side' = $Side;
        'commit_id' = $CommitId;
        'subject_type' = $SubjectType;
        'path' = $Path;
    } | ConvertTo-Json) -replace "\\u001b\[[0-9]+m",""
    $Url="https://api.github.com/repos/$($Repo)/pulls/$($PullRequestNumber)/comments"

    Write-Host "Sending POST pull request review comment for pr #$($PullRequestNumber) with body`n`n$($Body)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($GitHubToken)";
        } `
        -Method Post `
        -Body $Body `
        -SkipHttpErrorCheck

    if ($Response.StatusCode -ne 201) 
    {
        $Content = $Response.Content
        Write-Error "Error creating pull request review comment at url $($Url) for #$($PullRequestNumber)`nContent`n$($Content)"
    }
}

