---
url: https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo
retrieved: 2026-09-26
command: firecrawl scrape https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: IDXGIAdapter3::QueryVideoMemoryInfo (dxgi1_4.h) - Win32 apps | Microsoft Learn
---
Table of contents Exit editor mode

Ask LearnAsk Learn

Reading modeTable of contents[Read in English](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo)Add to CollectionsAdd to Plans[Edit](https://github.com/MicrosoftDocs/sdk-api/blob/docs/sdk-api-src/content/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo.md)

* * *

Copy MarkdownPrint

* * *

Note

Access to this page requires authorization. You can try [signing in](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#) or changing directories.


Access to this page requires authorization. You can try changing directories.


# IDXGIAdapter3::QueryVideoMemoryInfo method (dxgi1\_4.h)

Feedback

Summarize this article for me


This method informs the process of the current budget and process usage.

[Section titled: Syntax](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#syntax)

## Syntax

C++

Copy

```cpp
HRESULT QueryVideoMemoryInfo(
  [in]  UINT                         NodeIndex,
  [in]  DXGI_MEMORY_SEGMENT_GROUP    MemorySegmentGroup,
  [out] DXGI_QUERY_VIDEO_MEMORY_INFO *pVideoMemoryInfo
);
```

[Section titled: Parameters](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#parameters)

## Parameters

`[in] NodeIndex`

Type: **UINT**

Specifies the device's physical adapter for which the video memory information is queried.
For single-GPU operation, set this to zero.
If there are multiple GPU nodes, set this to the index of the node (the device's physical adapter) for which the video memory information is queried.
See [Multi-adapter systems](https://learn.microsoft.com/en-us/windows/win32/direct3d12/multi-engine).

`[in] MemorySegmentGroup`

Type: **[DXGI\_MEMORY\_SEGMENT\_GROUP](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/ne-dxgi1_4-dxgi_memory_segment_group)**

Specifies a DXGI\_MEMORY\_SEGMENT\_GROUP that identifies the group as local or non-local.

`[out] pVideoMemoryInfo`

Type: **[DXGI\_QUERY\_VIDEO\_MEMORY\_INFO](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/ns-dxgi1_4-dxgi_query_video_memory_info)\***

Fills in a DXGI\_QUERY\_VIDEO\_MEMORY\_INFO structure with the current values.

[Section titled: Return value](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#return-value)

## Return value

Type: **[HRESULT](https://learn.microsoft.com/en-us/windows/win32/com/structure-of-com-error-codes)**

Returns S\_OK if successful; an error code otherwise.
For a list of error codes, see [DXGI\_ERROR](https://learn.microsoft.com/en-us/windows/win32/direct3ddxgi/dxgi-error).

[Section titled: Remarks](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#remarks)

## Remarks

Applications must explicitly manage their usage of physical memory explicitly and keep usage within the budget assigned to the application process.
Processes that cannot kept their usage within their assigned budgets will likely experience stuttering, as they are intermittently frozen and paged-out to allow other processes to run.

[Section titled: Requirements](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#requirements)

## Requirements

Expand table

| Requirement | Value |
| --- | --- |
| **Target Platform** | Windows |
| **Header** | dxgi1\_4.h (include DXGI1\_3.h) |
| **Library** | Dxgi.lib |
| **DLL** | Dxgi.dll |

[Section titled: See also](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#see-also)

## See also

[IDXGIAdapter3](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nn-dxgi1_4-idxgiadapter3)

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

[Sign in](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo#)
