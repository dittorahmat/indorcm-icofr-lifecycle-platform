<#
.SYNOPSIS
    Safely removes a git worktree and its node_modules junction on Windows.
.EXAMPLE
    .\scripts\worktree-remove.ps1 -Slot 1
    .\scripts\worktree-remove.ps1 -Path "..\icofr1"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$Path,
    [Parameter(Mandatory=$false)]
    [ValidateSet(1, 2, 3)]
    [int]$Slot,
    [Parameter(Mandatory=$false)]
    [string]$Branch,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not $Path) {
    if ($Slot) {
        $Path = "..\icofr$Slot"
    } else {
        throw "Either -Path or -Slot (1, 2, or 3) must be provided."
    }
}

$targetNodeModules = Join-Path $Path "node_modules"
if (Test-Path $targetNodeModules) {
    Write-Host "Removing node_modules junction at $targetNodeModules..." -ForegroundColor Cyan
    cmd /c rmdir "$targetNodeModules"
}

Write-Host "Removing git worktree at $Path..." -ForegroundColor Cyan
try {
    if ($Force) {
        git worktree remove $Path --force
    } else {
        git worktree remove $Path
    }
} catch {
    Write-Warning "Standard git worktree remove failed: $_. Retrying with force..."
    git worktree remove $Path --force
}

if (Test-Path $Path) {
    Write-Host "Cleaning residual directory at $Path via cmd rmdir..." -ForegroundColor Yellow
    cmd /c rmdir /s /q "$Path"
}

Write-Host "Worktree safely removed from $Path" -ForegroundColor Green

if ($Branch) {
    Write-Host "Deleting branch $Branch..." -ForegroundColor Cyan
    try {
        git branch -d $Branch 2>$null
        if ($LASTEXITCODE -ne 0 -and $Force) {
            git branch -D $Branch
        }
    } catch {
        if ($Force) {
            git branch -D $Branch
        }
    }
}
