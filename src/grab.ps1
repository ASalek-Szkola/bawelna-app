# Define the file extensions to look for
$extensions = @("*.jsx", "*.css", "*.json", "*.js")

# Initialize an empty string to hold all content
$allContent = ""

# Get all files recursively, filtering by extensions
$files = Get-ChildItem -Recurse -Include $extensions

foreach ($file in $files) {
    # Get the relative path (starting from current directory)
    $relativePath = $file.FullName.Replace($(Get-Location).Path, "")
    
    # Create the header
    $header = "// $relativePath`n"
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Append header and content to the main string with a newline for separation
    $allContent += $header + $content + "`n`n"
}

# Send the final string to the clipboard
$allContent | Set-Clipboard

Write-Host "Success! Content from $($files.Count) files has been copied to the clipboard." -ForegroundColor Cyan