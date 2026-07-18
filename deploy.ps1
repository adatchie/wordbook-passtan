# Deploy web prototype to GitHub Pages
$ErrorActionPreference = 'Continue'
Set-Location 'C:\wordbook'

if (-not (Test-Path .git)) {
    git init
}

gh auth setup-git --hostname github.com

git config user.name "adatchie"
git config user.email "adatchie@gmail.com"

$remotes = git remote
if (-not ($remotes -contains 'origin')) {
    git remote add origin https://github.com/adatchie/wordbook
}

git add .
git commit -m "Initial web prototype"
if (-not $?) {
    Write-Host "Commit skipped (nothing to commit or already committed)"
}
git branch -M main
git push -u origin main
if (-not $?) {
    throw "Failed to push main"
}

$hasGhPages = git branch --list gh-pages
if ($hasGhPages) {
    git branch -D gh-pages
}

git checkout --orphan gh-pages

Get-ChildItem -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force

robocopy web-prototype . /E /XF test-node.js

git add .
git commit -m "Deploy web prototype to GitHub Pages"
git push -u origin gh-pages --force
if (-not $?) {
    throw "Failed to push gh-pages"
}

$json = '{"source":{"branch":"gh-pages","path":"/"}}'
$tmp = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tmp -Value $json -NoNewline -Encoding ASCII

git checkout main

gh api repos/adatchie/wordbook/pages 2>$null
if ($?) {
    Write-Host "GitHub Pages already enabled; updating source"
    gh api repos/adatchie/wordbook/pages --method PUT --input $tmp
} else {
    Write-Host "Enabling GitHub Pages with gh-pages source"
    gh api repos/adatchie/wordbook/pages --method POST --input $tmp
}

Remove-Item $tmp

Write-Host "Deployed to https://adatchie.github.io/wordbook"
Write-Host "It may take 1-2 minutes for GitHub Pages to publish."
