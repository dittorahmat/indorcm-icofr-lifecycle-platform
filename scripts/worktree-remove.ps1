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
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not $Path -and $Slot) {
    $Path = "..\icofr$Slot"
}

if (-not $Path) {
    Write-Error "Either -Path or -Slot must be specified."
    exit 1
}

$targetNodeModules = Join-Path $Path "node_modules"
if (Test-Path $targetNodeModules) {
    Write-Host "Removing node_modules junction at $targetNodeModules..." -ForegroundColor Cyan
    cmd /c rmdir "$targetNodeModules"
}

Write-Host "Removing git worktree at $Path..." -ForegroundColor Cyan
if ($Force) {
    git worktree remove $Path --force
} else {
    git worktree remove $Path
}

Write-Host "Worktree safely removed from $Path" -ForegroundColor Green
