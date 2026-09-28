---
url: https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable
retrieved: 2026-09-27
command: firecrawl scrape https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: GetExtendedTcpTable function (iphlpapi.h) - Win32 apps | Microsoft Learn
---
Table of contents Exit editor mode

Ask LearnAsk Learn

Reading modeTable of contents[Read in English](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable)Add to CollectionsAdd to Plans[Edit](https://github.com/MicrosoftDocs/sdk-api/blob/docs/sdk-api-src/content/iphlpapi/nf-iphlpapi-getextendedtcptable.md)

* * *

Copy MarkdownPrint

* * *

Note

Access to this page requires authorization. You can try [signing in](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#) or changing directories.


Access to this page requires authorization. You can try changing directories.


# GetExtendedTcpTable function (iphlpapi.h)

Feedback

Summarize this article for me


The **GetExtendedTcpTable** function retrieves a table that contains a list of TCP endpoints available to the application.

[Section titled: Syntax](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#syntax)

## Syntax

C++

Copy

```cpp
IPHLPAPI_DLL_LINKAGE DWORD GetExtendedTcpTable(
  [out]     PVOID           pTcpTable,
  [in, out] PDWORD          pdwSize,
  [in]      BOOL            bOrder,
  [in]      ULONG           ulAf,
  [in]      TCP_TABLE_CLASS TableClass,
  [in]      ULONG           Reserved
);
```

[Section titled: Parameters](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#parameters)

## Parameters

`[out] pTcpTable`

A pointer to the table structure that contains the filtered TCP endpoints available to the application. For information about how to determine the type of table returned based on specific input parameter combinations, see the Remarks section later in this document.

`[in, out] pdwSize`

The estimated size of the structure returned in _pTcpTable_, in bytes. If this value is set too small, **ERROR\_INSUFFICIENT\_BUFFER** is returned by this function, and this field will contain the correct size of the structure.

`[in] bOrder`

A value that specifies whether the TCP connection table should be sorted. If this parameter is set to **TRUE**, the TCP endpoints in the table are sorted in ascending order, starting with the lowest local IP address. If this parameter is set to **FALSE**, the TCP endpoints in the table appear in the order in which they were retrieved.

The following values are compared (as listed) when ordering the TCP endpoints:

2. Local IP address
3. Local scope ID (applicable when the _ulAf_ parameter is set to AF\_INET6)
4. Local TCP port
5. Remote IP address
6. Remote scope ID (applicable when the _ulAf_ parameter is set to AF\_INET6)
7. Remote TCP port

`[in] ulAf`

The version of IP used by the TCP endpoints.

Expand table

| Value | Meaning |
| --- | --- |
| **AF\_INET** | IPv4 is used. |
| **AF\_INET6** | IPv6 is used. |

`[in] TableClass`

The type of the TCP table structure to retrieve. This parameter can be one of the values from the [TCP\_TABLE\_CLASS](https://learn.microsoft.com/en-us/windows/desktop/api/iprtrmib/ne-iprtrmib-tcp_table_class) enumeration.

On the Windows SDK released for Windows Vista and later, the organization of header files has changed and the [TCP\_TABLE\_CLASS](https://learn.microsoft.com/en-us/windows/desktop/api/iprtrmib/ne-iprtrmib-tcp_table_class) enumeration is defined in the _Iprtrmib.h_ header file, not in the _Iphlpapi.h_ header file.

The [TCP\_TABLE\_CLASS](https://learn.microsoft.com/en-us/windows/desktop/api/iprtrmib/ne-iprtrmib-tcp_table_class) enumeration value is combined with the value of the _ulAf_ parameter to determine the extended TCP information to retrieve.

`[in] Reserved`

Reserved. This value must be zero.

[Section titled: Return value](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#return-value)

## Return value

If the call is successful, the value **NO\_ERROR** is returned.

If the function fails, the return value is one of the following error codes.

Expand table

| Return code | Description |
| --- | --- |
| **ERROR\_INSUFFICIENT\_BUFFER** | An insufficient amount of space was allocated for the table. The size of the table is returned in the _pdwSize_ parameter, and must be used in a subsequent call to this function in order to successfully retrieve the table.<br>This error is also returned if the _pTcpTable_ parameter is **NULL**. |
| **ERROR\_INVALID\_PARAMETER** | An invalid parameter was passed to the function. This error is returned if the _TableClass_ parameter contains a value that is not defined in the [TCP\_TABLE\_CLASS](https://learn.microsoft.com/en-us/windows/desktop/api/iprtrmib/ne-iprtrmib-tcp_table_class) enumeration. |

[Section titled: Remarks](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#remarks)

## Remarks

The table type returned by this function depends on the specific combination of the _ulAf_ parameter and the _TableClass_ parameter.

When the _ulAf_ parameter is set to **AF\_INET**, the following table indicates the TCP table type to retrieve in the structure pointed to by the _pTcpTable_ parameter for each possible _TableClass_ value.

Expand table

| _TableClass_ value | _pTcpTable_ structure |
| --- | --- |
| **TCP\_TABLE\_BASIC\_ALL** | [MIB\_TCPTABLE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable) |
| **TCP\_TABLE\_BASIC\_CONNECTIONS** | [MIB\_TCPTABLE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable) |
| **TCP\_TABLE\_BASIC\_LISTENER** | [MIB\_TCPTABLE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable) |
| **TCP\_TABLE\_OWNER\_MODULE\_ALL** | [MIB\_TCPTABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_module) |
| **TCP\_TABLE\_OWNER\_MODULE\_CONNECTIONS** | [MIB\_TCPTABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_module) |
| **TCP\_TABLE\_OWNER\_MODULE\_LISTENER** | [MIB\_TCPTABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_module) |
| **TCP\_TABLE\_OWNER\_PID\_ALL** | [MIB\_TCPTABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_pid) |
| **TCP\_TABLE\_OWNER\_PID\_CONNECTIONS** | [MIB\_TCPTABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_pid) |
| **TCP\_TABLE\_OWNER\_PID\_LISTENER** | [MIB\_TCPTABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_pid) |

When the _ulAf_ parameter is set to **AF\_INET6**, the following table indicates the TCP table type to retrieve in the structure pointed to by the _pTcpTable_ parameter for each possible _TableClass_ value.

Expand table

| _TableClass_ value | _pTcpTable_ structure |
| --- | --- |
| **TCP\_TABLE\_OWNER\_MODULE\_ALL** | [MIB\_TCP6TABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_module) |
| **TCP\_TABLE\_OWNER\_MODULE\_CONNECTIONS** | [MIB\_TCP6TABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_module) |
| **TCP\_TABLE\_OWNER\_MODULE\_LISTENER** | [MIB\_TCP6TABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_module) |
| **TCP\_TABLE\_OWNER\_PID\_ALL** | [MIB\_TCP6TABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_pid) |
| **TCP\_TABLE\_OWNER\_PID\_CONNECTIONS** | [MIB\_TCP6TABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_pid) |
| **TCP\_TABLE\_OWNER\_PID\_LISTENER** | [MIB\_TCP6TABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_pid) |

The **GetExtendedTcpTable** function called with the _ulAf_ parameter set to **AF\_INET6** and the _TableClass_ set to **TCP\_TABLE\_BASIC\_LISTENER**, **TCP\_TABLE\_BASIC\_CONNECTIONS**, or **TCP\_TABLE\_BASIC\_ALL** is not supported and returns **ERROR\_NOT\_SUPPORTED**.

On the Windows SDK released for Windows Vista and later, the organization of header files has changed. The various [MIB\_TCPTABLE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable) structures are defined in the _Tcpmib.h_ header file, not in the _Iprtrmib.h_ header file. Note that the _Tcpmib.h_ header file is automatically included in _Iprtrmib.h_, which is automatically included in the _Iphlpapi.h_ header file. The _Tcpmib.h_ and _Iprtrmib.h_ header files should never be used directly.

[Section titled: Requirements](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#requirements)

## Requirements

Expand table

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows Vista, Windows XP with SP2 \[desktop apps \| UWP apps\] |
| **Minimum supported server** | Windows Server 2008, Windows Server 2003 with SP1 \[desktop apps \| UWP apps\] |
| **Target Platform** | Windows |
| **Header** | iphlpapi.h |
| **Library** | Iphlpapi.lib |
| **DLL** | Iphlpapi.dll |

[Section titled: See also](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#see-also)

## See also

[MIB\_TCP6TABLE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table)

[MIB\_TCP6TABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_module)

[MIB\_TCP6TABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcp6table_owner_pid)

[MIB\_TCPTABLE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable)

[MIB\_TCPTABLE\_OWNER\_MODULE](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_module)

[MIB\_TCPTABLE\_OWNER\_PID](https://learn.microsoft.com/en-us/windows/desktop/api/tcpmib/ns-tcpmib-mib_tcptable_owner_pid)

[TCP\_TABLE\_CLASS](https://learn.microsoft.com/en-us/windows/desktop/api/iprtrmib/ne-iprtrmib-tcp_table_class)

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

- Last updated on 10/12/2021

Ask Learn is an AI assistant that can answer questions, clarify concepts, and define terms using trusted Microsoft documentation.

Please sign in to use Ask Learn.

[Sign in](https://learn.microsoft.com/en-us/windows/win32/api/iphlpapi/nf-iphlpapi-getextendedtcptable#)
