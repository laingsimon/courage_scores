Function Add-PullRequestComment($GitHubToken, $Repo, $PullRequestNumber, $Markdown)
{
    $Body = @{
        'body' = $Markdown
    } | ConvertTo-Json
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
    $Body = @{
        'body' = $Markdown
    } | ConvertTo-Json
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
