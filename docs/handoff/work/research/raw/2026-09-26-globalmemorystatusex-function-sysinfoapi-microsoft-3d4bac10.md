---
url: https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex
retrieved: 2026-09-26
command: firecrawl scrape https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: GlobalMemoryStatusEx function (sysinfoapi.h) - Win32 apps | Microsoft Learn
---
Table of contents Exit editor mode

Ask LearnAsk Learn

Reading modeTable of contents[Read in English](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex)Add to CollectionsAdd to Plans[Edit](https://github.com/MicrosoftDocs/sdk-api/blob/docs/sdk-api-src/content/sysinfoapi/nf-sysinfoapi-globalmemorystatusex.md)

* * *

Copy MarkdownPrint

* * *

Note

Access to this page requires authorization. You can try [signing in](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#) or changing directories.


Access to this page requires authorization. You can try changing directories.


# GlobalMemoryStatusEx function (sysinfoapi.h)

Feedback

Summarize this article for me


Retrieves information about the system's current usage of both physical and virtual memory.

[Section titled: Syntax](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#syntax)

## Syntax

C++

Copy

```cpp
BOOL GlobalMemoryStatusEx(
  [in, out] LPMEMORYSTATUSEX lpBuffer
);
```

[Section titled: Parameters](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#parameters)

## Parameters

`[in, out] lpBuffer`

A pointer to a
[MEMORYSTATUSEX](https://learn.microsoft.com/en-us/windows/desktop/api/sysinfoapi/ns-sysinfoapi-memorystatusex) structure that receives information about current memory availability.

[Section titled: Return value](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#return-value)

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call
[GetLastError](https://learn.microsoft.com/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

[Section titled: Remarks](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#remarks)

## Remarks

You can use the
**GlobalMemoryStatusEx** function to determine how much memory your application can allocate without severely impacting other applications.

The information returned by the
**GlobalMemoryStatusEx** function is volatile. There is no guarantee that two sequential calls to this function will return the same information.

The **ullAvailPhys** member of the [MEMORYSTATUSEX](https://learn.microsoft.com/en-us/windows/desktop/api/sysinfoapi/ns-sysinfoapi-memorystatusex) structure at _lpBuffer_ includes memory for all NUMA nodes.

[Section titled: Examples](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#examples)

#### Examples

The following code shows a simple use of the
**GlobalMemoryStatusEx** function.

C++

Copy

```cpp
//  Sample output:
//  There is       51 percent of memory in use.
//  There are 2029968 total KB of physical memory.
//  There are  987388 free  KB of physical memory.
//  There are 3884620 total KB of paging file.
//  There are 2799776 free  KB of paging file.
//  There are 2097024 total KB of virtual memory.
//  There are 2084876 free  KB of virtual memory.
//  There are       0 free  KB of extended memory.

#include <windows.h>
#include <stdio.h>
#include <tchar.h>

// Use to convert bytes to KB
#define DIV 1024

// Specify the width of the field in which to print the numbers.
// The asterisk in the format specifier "%*I64d" takes an integer
// argument and uses it to pad and right justify the number.
#define WIDTH 7

void _tmain()
{
  MEMORYSTATUSEX statex;

  statex.dwLength = sizeof (statex);

  GlobalMemoryStatusEx (&statex);

  _tprintf (TEXT("There is  %*ld percent of memory in use.\n"),
            WIDTH, statex.dwMemoryLoad);
  _tprintf (TEXT("There are %*I64d total KB of physical memory.\n"),
            WIDTH, statex.ullTotalPhys/DIV);
  _tprintf (TEXT("There are %*I64d free  KB of physical memory.\n"),
            WIDTH, statex.ullAvailPhys/DIV);
  _tprintf (TEXT("There are %*I64d total KB of paging file.\n"),
            WIDTH, statex.ullTotalPageFile/DIV);
  _tprintf (TEXT("There are %*I64d free  KB of paging file.\n"),
            WIDTH, statex.ullAvailPageFile/DIV);
  _tprintf (TEXT("There are %*I64d total KB of virtual memory.\n"),
            WIDTH, statex.ullTotalVirtual/DIV);
  _tprintf (TEXT("There are %*I64d free  KB of virtual memory.\n"),
            WIDTH, statex.ullAvailVirtual/DIV);

  // Show the amount of extended memory available.

  _tprintf (TEXT("There are %*I64d free  KB of extended memory.\n"),
            WIDTH, statex.ullAvailExtendedVirtual/DIV);
}
```

[Section titled: Requirements](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#requirements)

## Requirements

Expand table

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP \[desktop apps \| UWP apps\] |
| **Minimum supported server** | Windows Server 2003 \[desktop apps \| UWP apps\] |
| **Target Platform** | Windows |
| **Header** | sysinfoapi.h (include Windows.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |

[Section titled: See also](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#see-also)

## See also

[MEMORYSTATUSEX](https://learn.microsoft.com/en-us/windows/desktop/api/sysinfoapi/ns-sysinfoapi-memorystatusex)

[Memory\\
Management Functions](https://learn.microsoft.com/en-us/windows/desktop/Memory/memory-management-functions)

[Memory Performance Information](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/legacy/aa965225(v=vs.85))

[Virtual Address Space and Physical Storage](https://learn.microsoft.com/en-us/windows/desktop/Memory/virtual-address-space-and-physical-storage)

Reading mode disabled

* * *

## Feedback

Was this page helpful?


YesNoNo

Need help with this topic?


Want to try using Ask Learn to clarify or guide you through this topic?


Ask LearnAsk Learn

Suggest a fix?

* * *

## Additional resources

* * *

- Last updated on 02/22/2024

Ask Learn is an AI assistant that can answer questions, clarify concepts, and define terms using trusted Microsoft documentation.

Please sign in to use Ask Learn.

[Sign in](https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex#)
