---
title: "Private Book Download Protection"
description: "Added detection and blocking for private encrypted books to prevent unauthorized downloads and improve user experience"
date: "2026-04-25"
---

# Private Book Download Protection

## Introduction

We've enhanced the download system to respect book privacy settings. This update ensures that private and encrypted books are properly identified and blocked from downloading, protecting content creators' privacy rights.

## What's New

- **Private Book Detection**: Automatically detects encrypted books using FlipHTML5's `isEncryptionBook` flag from both configuration locations
- **Download Blocking**: Prevents downloading of private books with clear error messaging
- **User-Friendly Notifications**: Displays helpful toast notifications explaining why the download was blocked
- **ZIP File Path Fix**: Corrected URL construction for ZIP files to use the proper `files/content-page/` path

## How to Use

When you attempt to download a private book, the system will:
1. Detect the encryption flag during configuration loading
2. Display an error message: "This is a private book and is not available for download"
3. Stop the download process immediately

No additional setup required - the protection works automatically.

## Improvements

- Better respect for content creators' privacy settings
- Clear error messaging when downloads are blocked
- Improved ZIP file URL handling for more reliable downloads
- Faster failure detection (checks before starting download process)

## Summary

This update adds important privacy protections by detecting and blocking downloads of private encrypted books. Users now receive clear feedback when attempting to download restricted content, and ZIP file handling has been improved for better reliability. Thank you for using Flipbook Downloader responsibly.
