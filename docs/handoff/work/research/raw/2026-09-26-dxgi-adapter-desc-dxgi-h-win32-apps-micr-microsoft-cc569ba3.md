---
url: https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc
retrieved: 2026-09-26
command: firecrawl scrape https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: DXGI_ADAPTER_DESC (dxgi.h) - Win32 apps | Microsoft Learn
---
Table of contents Exit editor mode

Ask LearnAsk Learn

Reading modeTable of contents[Read in English](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc)Add to CollectionsAdd to Plans[Edit](https://github.com/MicrosoftDocs/sdk-api/blob/docs/sdk-api-src/content/dxgi/ns-dxgi-dxgi_adapter_desc.md)

* * *

Copy MarkdownPrint

* * *

Note

Access to this page requires authorization. You can try [signing in](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc#) or changing directories.


Access to this page requires authorization. You can try changing directories.


# DXGI\_ADAPTER\_DESC structure (dxgi.h)

Feedback

Summarize this article for me


Describes an adapter (or video card) by using DXGI 1.0.

[Section titled: Syntax](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc#syntax)

## Syntax

C++

Copy

```cpp
typedef struct DXGI_ADAPTER_DESC {
  WCHAR  Description[128];
  UINT   VendorId;
  UINT   DeviceId;
  UINT   SubSysId;
  UINT   Revision;
  SIZE_T DedicatedVideoMemory;
  SIZE_T DedicatedSystemMemory;
  SIZE_T SharedSystemMemory;
  LUID   AdapterLuid;
} DXGI_ADAPTER_DESC;
```

[Section titled: Members](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc#members)

## Members

`Description[128]`

Type: **WCHAR\[128\]**

A string that contains the adapter description. On [feature level](https://learn.microsoft.com/en-us/windows/desktop/direct3d11/overviews-direct3d-11-devices-downlevel-intro) 9 graphics hardware, [GetDesc](https://learn.microsoft.com/en-us/windows/desktop/api/dxgi/nf-dxgi-idxgiadapter-getdesc) returns “Software Adapter” for the description string.

`VendorId`

Type: **[UINT](https://learn.microsoft.com/en-us/windows/desktop/WinProg/windows-data-types)**

The PCI ID or ACPI ID of the adapter's hardware vendor. If this value is less than or equal to 0xFFFF, it is a PCI ID; otherwise, it is an ACPI ID. On [feature level](https://learn.microsoft.com/en-us/windows/desktop/direct3d11/overviews-direct3d-11-devices-downlevel-intro) 9 graphics hardware, [GetDesc](https://learn.microsoft.com/en-us/windows/desktop/api/dxgi/nf-dxgi-idxgiadapter-getdesc) returns zero for this value.

`DeviceId`

Type: **[UINT](https://learn.microsoft.com/en-us/windows/desktop/WinProg/windows-data-types)**

The PCI ID or ACPI ID of the adapter's hardware device. If **VendorId** is a PCI ID, it is also a PCI ID; otherwise, it is an ACPI ID. On [feature level](https://learn.microsoft.com/en-us/windows/desktop/direct3d11/overviews-direct3d-11-devices-downlevel-intro) 9 graphics hardware, [GetDesc](https://learn.microsoft.com/en-us/windows/desktop/api/dxgi/nf-dxgi-idxgiadapter-getdesc) returns zero for this value.

`SubSysId`

Type: **[UINT](https://learn.microsoft.com/en-us/windows/desktop/WinProg/windows-data-types)**

The PCI ID or ACPI ID of the adapter's hardware subsystem. If **VendorId** is a PCI ID, it is also a PCI ID; otherwise, it is an ACPI ID. On [feature level](https://learn.microsoft.com/en-us/windows/desktop/direct3d11/overviews-direct3d-11-devices-downlevel-intro) 9 graphics hardware, [GetDesc](https://learn.microsoft.com/en-us/windows/desktop/api/dxgi/nf-dxgi-idxgiadapter-getdesc) returns zero for this value.

`Revision`

Type: **[UINT](https://learn.microsoft.com/en-us/windows/desktop/WinProg/windows-data-types)**

The adapter's PCI or ACPI revision number. If **VendorId** is a PCI ID, it is a PCI device revision number; otherwise, it is an ACPI device revision number. On [feature level](https://learn.microsoft.com/en-us/windows/desktop/direct3d11/overviews-direct3d-11-devices-downlevel-intro) 9 graphics hardware, [GetDesc](https://learn.microsoft.com/en-us/windows/desktop/api/dxgi/nf-dxgi-idxgiadapter-getdesc) returns zeros for this value.

`DedicatedVideoMemory`

Type: **[SIZE\_T](https://learn.microsoft.com/en-us/windows/desktop/WinProg/windows-data-types)**

The number of bytes of dedicated video memory that are not shared with the CPU.

`DedicatedSystemMemory`

Type: **[SIZE\_T](https://learn.microsoft.com/en-us/windows/desktop/WinProg/windows-data-types)**

The number of bytes of dedicated system memory that are not shared with the CPU. This memory is allocated from available system memory at boot time.

`SharedSystemMemory`

Type: **[SIZE\_T](https://learn.microsoft.com/en-us/windows/desktop/WinProg/windows-data-types)**

The number of bytes of shared system memory. This is the maximum value of system memory that may be consumed by the adapter during operation. Any incidental memory consumed by the driver as it manages and uses video memory is additional.

`AdapterLuid`

Type: **[LUID](https://learn.microsoft.com/en-us/previous-versions/windows/hardware/drivers/ff549708(v=vs.85))**

A unique value that identifies the adapter. See [LUID](https://learn.microsoft.com/en-us/previous-versions/windows/hardware/drivers/ff549708(v=vs.85)) for a definition of the structure. **LUID** is defined in dxgi.h.

[Section titled: Remarks](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc#remarks)

## Remarks

The **DXGI\_ADAPTER\_DESC** structure provides a description of an adapter. This structure is initialized by using the [IDXGIAdapter::GetDesc](https://learn.microsoft.com/en-us/windows/desktop/api/dxgi/nf-dxgi-idxgiadapter-getdesc) method.

[Section titled: Requirements](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc#requirements)

## Requirements

Expand table

| Requirement | Value |
| --- | --- |
| **Header** | dxgi.h |

[Section titled: See also](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc#see-also)

## See also

[DXGI Structures](https://learn.microsoft.com/en-us/windows/desktop/direct3ddxgi/d3d10-graphics-reference-dxgi-structures)

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

[Sign in](https://learn.microsoft.com/en-us/windows/win32/api/dxgi/ns-dxgi-dxgi_adapter_desc#)
