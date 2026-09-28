---
url: https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html
retrieved: 2026-09-26
command: firecrawl scrape https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Device Queries — NVML API Reference Guide
---
[Skip to main content](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#main-content)

![country_code](https://www.nvidia.com/content/dam/1x1-00000000.png)

Back to top`⌘` + `K`

[![NVML API Reference Guide - Home](https://docs.nvidia.com/deploy/nvml-api/_static/nvidia-logo-horiz-rgb-blk-for-screen.svg)![NVML API Reference Guide - Home](https://docs.nvidia.com/deploy/nvml-api/_static/nvidia-logo-horiz-rgb-wht-for-screen.svg)\\
NVML API Reference Guide](https://docs.nvidia.com/deploy/nvml-api/index.html)

Choose version

- [PDF](https://docs.nvidia.com/deploy/nvml-api/api/pdf/NVML_API_Reference_Guide.pdf)

LightDarkSystem Settings

[Is this page helpful?](https://surveys.hotjar.com/4904bf71-6484-47a7-83ff-4715cceabdb5)

# Device Queries [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#device-queries "Link to this heading")

This chapter describes that queries that NVML can perform against each device.

//

In each case the device is identified with an nvmlDevice\_t handle. This handle is obtained by calling one of [nvmlDeviceGetHandleByIndex\_v2()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga370332ca9b5938b2d0bef265e8e27785), [nvmlDeviceGetHandleBySerial()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf0454cd4f3da9dd3c0c51115ef5a16b6), [nvmlDeviceGetHandleByPciBusId\_v2()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6d95e59c11ec96ce8bc13a6646e66660). or [nvmlDeviceGetHandleByUUID()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5f8df708abce63c37d2736674a9ab28d).

## Macros [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#macros "Link to this heading")

[nvmlTemperature\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5ee141742a7d474180ff9a4e5d081093)

Version macro for _nvmlTemperature\_v1\_t_ .

## Functions [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#functions "Link to this heading")

nvmlReturn\_t [nvmlDeviceGetAPIRestriction](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga9a37b9f5487a8b48f5ef8aaa99554e6c)(nvmlDevice\_t device, nvmlRestrictedAPI\_t apiType, nvmlEnableState\_t \*isRestricted)

Retrieves the root/admin permissions on the target API.

nvmlReturn\_t [nvmlDeviceGetAdaptiveClockInfoStatus](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac8e1d055a57f18f89458f47c3e05585d)(nvmlDevice\_t device, unsigned int \*adaptiveClockStatus)

Gets the device's Adaptive Clock status.

nvmlReturn\_t [nvmlDeviceGetAdaptiveTgpModeInfo\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac47e7e50af086ef87af288395c960cfe)(nvmlDevice\_t device, nvmlAdaptiveTgpModeInfo\_v1\_t \*info)

Retrieves Adaptive TGP Mode state and telemetry for a GPU.

nvmlReturn\_t [nvmlDeviceGetApplicationsClock](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf98771b71edb1ed7210ef805eb9d572a)(nvmlDevice\_t device, nvmlClockType\_t clockType, unsigned int \*clockMHz)

nvmlReturn\_t [nvmlDeviceGetArchitecture](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga88d7964421dd0cd76626331cac832493)(nvmlDevice\_t device, nvmlDeviceArchitecture\_t \*arch)

Get architecture for device.

nvmlReturn\_t [nvmlDeviceGetAttributes\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaa120eda53e058d3a898a50342dea33a4)(nvmlDevice\_t device, nvmlDeviceAttributes\_t \*attributes)

Get attributes (engine counts etc.) for the given NVML device handle.

nvmlReturn\_t [nvmlDeviceGetAutoBoostedClocksEnabled](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf15cb76a4c96112035f02c596ca898b4)(nvmlDevice\_t device, nvmlEnableState\_t \*isEnabled, nvmlEnableState\_t \*defaultIsEnabled)

Retrieve the current state of Auto Boosted clocks on a device and store it in _isEnabled_ .

nvmlReturn\_t [nvmlDeviceGetBAR1MemoryInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga376f41ed84decd4fbec136d7884fd973)(nvmlDevice\_t device, nvmlBAR1Memory\_t \*bar1Memory)

Gets Total, Available and Used size of BAR1 memory.

nvmlReturn\_t [nvmlDeviceGetBBXTimeData\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga7c834122c4ea86738b010c3cce8d61b4)(nvmlDevice\_t device, nvmlBBXTimeData\_v1\_t \*timeData)

Retrieves the cumulative number of seconds the GPU has had the driver loaded.

nvmlReturn\_t [nvmlDeviceGetBankRemapperStatus\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf35729d6461c4a42d37aa1a3dbc47110)(nvmlDevice\_t device, nvmlEccBankRemapperStatus\_v1\_t \*pBankRemapperStatus)

Get bank remapper status.

nvmlReturn\_t [nvmlDeviceGetBoardId](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga431935127dfa0b71129f9357a6af1b52)(nvmlDevice\_t device, unsigned int \*boardId)

Retrieves the device boardId from 0-N.

nvmlReturn\_t [nvmlDeviceGetBoardPartNumber](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga895b4a1cd48d26d47d0c6e704095e42c)(nvmlDevice\_t device, char \*partNumber, unsigned int length)

Retrieves the the device board part number which is programmed into the board's InfoROM.

nvmlReturn\_t [nvmlDeviceGetBrand](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaba820132cd9d46a8c2c3e1c66d8ed8c9)(nvmlDevice\_t device, nvmlBrandType\_t \*type)

Retrieves the brand of this device.

nvmlReturn\_t [nvmlDeviceGetBridgeChipInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaa4d7cfaaac3c8582538f3b9f8af34abf)(nvmlDevice\_t device, nvmlBridgeChipHierarchy\_t \*bridgeHierarchy)

Get Bridge Chip Information for all the bridge chips on the board.

nvmlReturn\_t [nvmlDeviceGetBusType](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaff1d5c5910b706fdfc512cf176794035)(nvmlDevice\_t device, nvmlBusType\_t \*type)

Get the type of the GPU Bus (PCIe, PCI, …)

nvmlReturn\_t [nvmlDeviceGetC2cModeInfoV](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga8fb58bcd3e7e01c41051061add4dc44d)(nvmlDevice\_t device, nvmlC2cModeInfo\_v1\_t \*c2cModeInfo)

Retrieves the Device's C2C Mode information.

nvmlReturn\_t [nvmlDeviceGetClkMonStatus](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf2f304c0ac25886c031f3f1903638912)(nvmlDevice\_t device, nvmlClkMonStatus\_t \*status)

Retrieves the frequency monitor fault status for the device.

nvmlReturn\_t [nvmlDeviceGetClock](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae5fb56ed34c6b6ab81d8f2402710f890)(nvmlDevice\_t device, nvmlClockType\_t clockType, nvmlClockId\_t clockId, unsigned int \*clockMHz)

Retrieves the clock speed for the clock specified by the clock type and clock ID.

nvmlReturn\_t [nvmlDeviceGetClockInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6c718e0df86350ce27fcd279b3e482d1)(nvmlDevice\_t device, nvmlClockType\_t type, unsigned int \*clock)

Retrieves the current clock speeds for the device.

nvmlReturn\_t [nvmlDeviceGetClockOffsets](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gafe8863734acf66762e98240e1b26defe)(nvmlDevice\_t device, nvmlClockOffset\_t \*info)

Retrieve min, max and current clock offset of some clock domain for a given PState.

nvmlReturn\_t [nvmlDeviceGetComputeMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga49ae030488c4e6c61b826365e7fd7e92)(nvmlDevice\_t device, nvmlComputeMode\_t \*mode)

Retrieves the current compute mode for the device or MIG device.

nvmlReturn\_t [nvmlDeviceGetComputeRunningProcesses\_v3](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga073b2f90368f65cadcc237f7a2e210b8)(nvmlDevice\_t device, unsigned int \*infoCount, nvmlProcessInfo\_t \*infos)

Get information about processes with a compute context on a device.

nvmlReturn\_t [nvmlDeviceGetConfComputeGpuAttestationReport](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gab4fc7463fc99a9d2a57bb3ffa909a30a)(nvmlDevice\_t device, nvmlConfComputeGpuAttestationReport\_t \*gpuAtstReport)

Get Conf Computing GPU attestation report.

nvmlReturn\_t [nvmlDeviceGetConfComputeGpuCertificate](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga3d53e6b2645166404cd7afb60b94dbae)(nvmlDevice\_t device, nvmlConfComputeGpuCertificate\_t \*gpuCert)

Get Conf Computing GPU certificate details.

nvmlReturn\_t [nvmlDeviceGetConfComputeMemSizeInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga006d7b56593728493126eaae7bf63467)(nvmlDevice\_t device, nvmlConfComputeMemSizeInfo\_t \*memInfo)

Get Conf Computing Protected and Unprotected Memory Sizes.

nvmlReturn\_t [nvmlDeviceGetConfComputeProtectedMemoryUsage](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga7debb9b59bd358c70606200108844063)(nvmlDevice\_t device, nvmlMemory\_t \*memory)

Get Conf Computing protected memory usage.

nvmlReturn\_t [nvmlDeviceGetCoolerInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga3671017dae358c2c2c9842749670b35a)(nvmlDevice\_t device, nvmlCoolerInfo\_t \*coolerInfo)

Retrieves the cooler's information.

nvmlReturn\_t [nvmlDeviceGetCount\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf2828b5a2e93e9f4384367e1e3602f5c)(unsigned int \*deviceCount)

Retrieves the number of compute devices in the system.

nvmlReturn\_t [nvmlDeviceGetCudaComputeCapability](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga736c2f7e99d747b36dcd9a7d51e786ce)(nvmlDevice\_t device, int \*major, int \*minor)

Retrieves the CUDA compute capability of the device.

nvmlReturn\_t [nvmlDeviceGetCurrPcieLinkGeneration](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga2ec9da6a6a065c0a9c8ba95d536b98ea)(nvmlDevice\_t device, unsigned int \*currLinkGen)

Retrieves the current PCIe link generation.

nvmlReturn\_t [nvmlDeviceGetCurrPcieLinkWidth](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1c1e9c65244ef4e60c7a0c3574a50634)(nvmlDevice\_t device, unsigned int \*currLinkWidth)

Retrieves the current PCIe link width.

nvmlReturn\_t [nvmlDeviceGetCurrentClockFreqs](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga284c599edddf759ef7a9dd9ae9a95bb3)(nvmlDevice\_t device, nvmlDeviceCurrentClockFreqs\_t \*currentClockFreqs)

Retrieves a string with the associated current GPU Clock and Memory Clock values.

nvmlReturn\_t [nvmlDeviceGetCurrentClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga880d8166732d6db9f24419dbff9fee03)(nvmlDevice\_t device, unsigned long long \*clocksEventReasons)

Retrieves current clocks event reasons.

nvmlReturn\_t [nvmlDeviceGetCurrentClocksThrottleReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad698bfa1be35195c45df8142cb923182)(nvmlDevice\_t device, unsigned long long \*clocksThrottleReasons)

nvmlReturn\_t [nvmlDeviceGetDecoderUtilization](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga807a28c45ff3e3958680a1ca16a5ec8c)(nvmlDevice\_t device, unsigned int \*utilization, unsigned int \*samplingPeriodUs)

Retrieves the current utilization and sampling size in microseconds for the Decoder.

nvmlReturn\_t [nvmlDeviceGetDefaultApplicationsClock](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4dadd0fea64ac07cb93dc10dba272f70)(nvmlDevice\_t device, nvmlClockType\_t clockType, unsigned int \*clockMHz)

nvmlReturn\_t [nvmlDeviceGetDefaultEccMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gab8fa108e1e66f3337bb53791c9844150)(nvmlDevice\_t device, nvmlEnableState\_t \*defaultMode)

Retrieves the default ECC modes for the device.

nvmlReturn\_t [nvmlDeviceGetDetailedEccErrors](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf9c96c30614e23659118df156b840fef)(nvmlDevice\_t device, nvmlMemoryErrorType\_t errorType, nvmlEccCounterType\_t counterType, nvmlEccErrorCounts\_t \*eccCounts)

Retrieves the detailed ECC error counts for the device.

nvmlReturn\_t [nvmlDeviceGetDisplayActive](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga58818df1bba8571013bb01cb18523494)(nvmlDevice\_t device, nvmlEnableState\_t \*isActive)

Retrieves the display active state for the device.

nvmlReturn\_t [nvmlDeviceGetDisplayMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gab20ec27c422c694d2730ae6e220d1b33)(nvmlDevice\_t device, nvmlEnableState\_t \*display)

Retrieves the display mode for the device.

nvmlReturn\_t [nvmlDeviceGetDramEncryptionMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gafd315fa191c49cc8c7f09fc77012bd16)(nvmlDevice\_t device, nvmlDramEncryptionInfo\_t \*current, nvmlDramEncryptionInfo\_t \*pending)

Retrieves the current and pending DRAM Encryption modes for the device.

nvmlReturn\_t [nvmlDeviceGetDriverModel\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gab10b0e44c7fc3a4e3fe124e8c5ccc7a1)(nvmlDevice\_t device, nvmlDriverModel\_t \*current, nvmlDriverModel\_t \*pending)

Retrieves the current and pending driver model for the device.

nvmlReturn\_t [nvmlDeviceGetDynamicPstatesInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4390702629bb656f232102526fa66e49)(nvmlDevice\_t device, nvmlGpuDynamicPstatesInfo\_t \*pDynamicPstatesInfo)

Retrieve performance monitor samples from the associated subdevice.

nvmlReturn\_t [nvmlDeviceGetEccMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad4d0b47acbab4f49bd832ba4930c4277)(nvmlDevice\_t device, nvmlEnableState\_t \*current, nvmlEnableState\_t \*pending)

Retrieves the current and pending ECC modes for the device.

nvmlReturn\_t [nvmlDeviceGetEncoderCapacity](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga3ec634a6703c2f22ad3de5151886d156)(nvmlDevice\_t device, nvmlEncoderType\_t encoderQueryType, unsigned int \*encoderCapacity)

Retrieves the current capacity of the device's encoder, as a percentage of maximum encoder capacity with valid values in the range 0-100.

nvmlReturn\_t [nvmlDeviceGetEncoderSessions](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaa50af515166e39dfdfa3bf01b49b2ae2)(nvmlDevice\_t device, unsigned int \*sessionCount, nvmlEncoderSessionInfo\_t \*sessionInfos)

Retrieves information about active encoder sessions on a target device.

nvmlReturn\_t [nvmlDeviceGetEncoderStats](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4fca51548ec579ea39131b0cf6bee9ff)(nvmlDevice\_t device, unsigned int \*sessionCount, unsigned int \*averageFps, unsigned int \*averageLatency)

Retrieves the current encoder statistics for a given device.

nvmlReturn\_t [nvmlDeviceGetEncoderUtilization](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga93674a73d03ac95c42eff9c34eac4b09)(nvmlDevice\_t device, unsigned int \*utilization, unsigned int \*samplingPeriodUs)

Retrieves the current utilization and sampling size in microseconds for the Encoder.

nvmlReturn\_t [nvmlDeviceGetEnforcedPowerLimit](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga33003f8cd235b8372b6a94e5789ae7ed)(nvmlDevice\_t device, unsigned int \*limit)

Get the effective power limit that the driver enforces after taking into account all limiters.

nvmlReturn\_t [nvmlDeviceGetFBCSessions](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga44b208b1d227932700961dc53d5b0f9f)(nvmlDevice\_t device, unsigned int \*sessionCount, nvmlFBCSessionInfo\_t \*sessionInfo)

Retrieves information about active frame buffer capture sessions on a target device.

nvmlReturn\_t [nvmlDeviceGetFBCStats](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gadb01046297f59915db173a3662377004)(nvmlDevice\_t device, nvmlFBCStats\_t \*fbcStats)

Retrieves the active frame buffer capture sessions statistics for a given device.

nvmlReturn\_t [nvmlDeviceGetFanControlPolicy\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4c76f810a54f389f9fec75f899c92134)(nvmlDevice\_t device, unsigned int fan, nvmlFanControlPolicy\_t \*policy)

Gets current fan control policy.

nvmlReturn\_t [nvmlDeviceGetFanSpeed](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gada70f00ea4738a548613f116bda5bdd1)(nvmlDevice\_t device, unsigned int \*speed)

Retrieves the intended operating speed of the device's fan.

nvmlReturn\_t [nvmlDeviceGetFanSpeedRPM](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga481762b270636b2d72a1a3768c5abdb3)(nvmlDevice\_t device, nvmlFanSpeedInfo\_t \*fanSpeed)

Retrieves the intended operating speed in rotations per minute (RPM) of the device's specified fan.

nvmlReturn\_t [nvmlDeviceGetFanSpeed\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae4f08e6b2b2bba4c44fb71321c965ca8)(nvmlDevice\_t device, unsigned int fan, unsigned int \*speed)

Retrieves the intended operating speed of the device's specified fan.

nvmlReturn\_t [nvmlDeviceGetGpcClkMinMaxVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga8ac5b50a7b5d71179c706afcecca4785)(nvmlDevice\_t device, int \*minOffset, int \*maxOffset)

Retrieve the GPCCLK min max VF offset value.

nvmlReturn\_t [nvmlDeviceGetGpcClkVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga596f6bb44703119b371d60d068010c9d)(nvmlDevice\_t device, int \*offset)

Retrieve the GPCCLK VF offset value.

nvmlReturn\_t [nvmlDeviceGetGpuFabricInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae927ec21da56d96275ab10595c072a16)(nvmlDevice\_t device, nvmlGpuFabricInfo\_t \*gpuFabricInfo)

nvmlReturn\_t [nvmlDeviceGetGpuFabricInfoV](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga426d75b00e5a5ea887aabd7bb6bc82dc)(nvmlDevice\_t device, nvmlGpuFabricInfoV\_t \*gpuFabricInfo)

Versioned wrapper around [nvmlDeviceGetGpuFabricInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae927ec21da56d96275ab10595c072a16) that accepts a versioned [nvmlGpuFabricInfo\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuFabricInfo__v2__t.html#structnvmlgpufabricinfo__v2__t) or later output structure.

nvmlReturn\_t [nvmlDeviceGetGpuFabricInfo\_v4](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac50cb4906726a17bd259a232865f0286)(nvmlDevice\_t device, nvmlGpuFabricInfo\_v4\_t \*gpuFabricInfo)

Retrieves GPU fabric information including per-type clique assignments.

nvmlReturn\_t [nvmlDeviceGetGpuMaxPcieLinkGeneration](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf03ad6ba78ba9b21c5fd1c56983fe43b)(nvmlDevice\_t device, unsigned int \*maxLinkGenDevice)

Retrieves the maximum PCIe link generation supported by this device.

nvmlReturn\_t [nvmlDeviceGetGpuOperationMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad258b2d2a8ff9cdd066fb6c2c0058c32)(nvmlDevice\_t device, nvmlGpuOperationMode\_t \*current, nvmlGpuOperationMode\_t \*pending)

Retrieves the current GOM and pending GOM (the one that GPU will switch to after reboot).

nvmlReturn\_t [nvmlDeviceGetGraphicsRunningProcesses\_v3](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf1f51bb62fd6355567fda1bf50477aac)(nvmlDevice\_t device, unsigned int \*infoCount, nvmlProcessInfo\_t \*infos)

Get information about processes with a graphics context on a device.

nvmlReturn\_t [nvmlDeviceGetGspFirmwareMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae9b606aed222c229560523c729e07a84)(nvmlDevice\_t device, unsigned int \*isEnabled, unsigned int \*defaultMode)

Retrieve GSP firmware mode.

nvmlReturn\_t [nvmlDeviceGetGspFirmwareVersion](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gabfc322ec7cd5e149aa6e2696c0384f7d)(nvmlDevice\_t device, char \*version)

Retrieve GSP firmware version.

nvmlReturn\_t [nvmlDeviceGetHandleByIndex\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga370332ca9b5938b2d0bef265e8e27785)(unsigned int index, nvmlDevice\_t \*device)

Acquire the handle for a particular device, based on its index.

nvmlReturn\_t [nvmlDeviceGetHandleByPciBusId\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6d95e59c11ec96ce8bc13a6646e66660)(const char \*pciBusId, nvmlDevice\_t \*device)

Acquire the handle for a particular device, based on its PCI bus id.

nvmlReturn\_t [nvmlDeviceGetHandleBySerial](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf0454cd4f3da9dd3c0c51115ef5a16b6)(const char \*serial, nvmlDevice\_t \*device)

Acquire the handle for a particular device, based on its board serial number.

nvmlReturn\_t [nvmlDeviceGetHandleByUUID](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5f8df708abce63c37d2736674a9ab28d)(const char \*uuid, nvmlDevice\_t \*device)

Acquire the handle for a particular device, based on its globally unique immutable UUID (in ASCII format) associated with each device.

nvmlReturn\_t [nvmlDeviceGetHandleByUUIDV](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf03a13e93bfbff0071289e6f2bdc0e09)(const nvmlUUID\_t \*uuid, nvmlDevice\_t \*device)

Acquire the handle for a particular device, based on its globally unique immutable UUID (in either ASCII or binary format) associated with each device.

nvmlReturn\_t [nvmlDeviceGetHostname\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaabc5d886ae01b94218e1db022b067695)(nvmlDevice\_t device, nvmlHostname\_v1\_t \*hostname)

Get the hostname for the device.

nvmlReturn\_t [nvmlDeviceGetIndex](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga2aecb745e547dda7fa71009d18ac0e56)(nvmlDevice\_t device, unsigned int \*index)

Retrieves the NVML index of this device.

nvmlReturn\_t [nvmlDeviceGetInforomConfigurationChecksum](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gabc7e308b3d973d8858465d47aa4fe40e)(nvmlDevice\_t device, unsigned int \*checksum)

Retrieves the checksum of the configuration stored in the device's infoROM.

nvmlReturn\_t [nvmlDeviceGetInforomImageVersion](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1df61c76389e2619f416554d7990361b)(nvmlDevice\_t device, char \*version, unsigned int length)

Retrieves the global infoROM image version.

nvmlReturn\_t [nvmlDeviceGetInforomVersion](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae72d874ef25a5bb259d7e3d528935c5a)(nvmlDevice\_t device, nvmlInforomObject\_t object, char \*version, unsigned int length)

Retrieves the version information for the device's infoROM object.

nvmlReturn\_t [nvmlDeviceGetIrqNum](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga413797ecfcc3a727f10d8c8277a167c7)(nvmlDevice\_t device, unsigned int \*irqNum)

Gets the device's interrupt number.

nvmlReturn\_t [nvmlDeviceGetJpgUtilization](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gab415f691fdd1f272cfd417ceb3556270)(nvmlDevice\_t device, unsigned int \*utilization, unsigned int \*samplingPeriodUs)

Retrieves the current utilization and sampling size in microseconds for the JPG.

nvmlReturn\_t [nvmlDeviceGetLastBBXFlushTime](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4011da359229459f0c90e99397c040a0)(nvmlDevice\_t device, unsigned long long \*timestamp, unsigned long \*durationUs)

Retrieves the timestamp and the duration of the last flush of the BBX (blackbox) infoROM object during the current run.

nvmlReturn\_t [nvmlDeviceGetMPSComputeRunningProcesses\_v3](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga9787d8abe50a0981b8eb0b4ee9688e31)(nvmlDevice\_t device, unsigned int \*infoCount, nvmlProcessInfo\_t \*infos)

Get information about processes with a Multi-Process Service (MPS) compute context on a device.

nvmlReturn\_t [nvmlDeviceGetMarginTemperature](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gacddb19b0e02b60b30bd55276fa1462ea)(nvmlDevice\_t device, nvmlMarginTemperature\_t \*marginTempInfo)

Retrieves the thermal margin temperature (distance to nearest slowdown threshold).

nvmlReturn\_t [nvmlDeviceGetMaxClockInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6206e529e16973f1670a4d87439725d9)(nvmlDevice\_t device, nvmlClockType\_t type, unsigned int \*clock)

Retrieves the maximum clock speeds for the device.

nvmlReturn\_t [nvmlDeviceGetMaxCustomerBoostClock](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga581affdefda3c6df446510f5af890fb7)(nvmlDevice\_t device, nvmlClockType\_t clockType, unsigned int \*clockMHz)

Retrieves the customer defined maximum boost clock speed specified by the given clock type.

nvmlReturn\_t [nvmlDeviceGetMaxPcieLinkGeneration](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad5034c5694af02f622cf4b52ea4c19f7)(nvmlDevice\_t device, unsigned int \*maxLinkGen)

Retrieves the maximum PCIe link generation possible with this device and system.

nvmlReturn\_t [nvmlDeviceGetMaxPcieLinkWidth](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga9984484b4ef0818aabb48f7921a63439)(nvmlDevice\_t device, unsigned int \*maxLinkWidth)

Retrieves the maximum PCIe link width possible with this device and system.

nvmlReturn\_t [nvmlDeviceGetMemClkMinMaxVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6d50061e0ce011df5cec28882d9ead02)(nvmlDevice\_t device, int \*minOffset, int \*maxOffset)

Retrieve the MemClk (Memory Clock) min max VF offset value.

nvmlReturn\_t [nvmlDeviceGetMemClkVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga00ea9dfb980ae9be5f112fe444703fa4)(nvmlDevice\_t device, int \*offset)

Retrieve the MemClk (Memory Clock) VF offset value.

nvmlReturn\_t [nvmlDeviceGetMemoryBusWidth](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1deb26e0e0243e06e256b8399f32aba6)(nvmlDevice\_t device, unsigned int \*busWidth)

Gets the device's memory bus width.

nvmlReturn\_t [nvmlDeviceGetMemoryErrorCounter](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga7267425aae7ad6a5e221a53549be1371)(nvmlDevice\_t device, nvmlMemoryErrorType\_t errorType, nvmlEccCounterType\_t counterType, nvmlMemoryLocation\_t locationType, unsigned long long \*count)

Retrieves the requested memory error counter for the device.

nvmlReturn\_t [nvmlDeviceGetMemoryInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4c3edd27b32891197b73117b5d61f464)(nvmlDevice\_t device, nvmlMemory\_t \*memory)

Retrieves the amount of used, free, reserved and total memory available on the device, in bytes.

nvmlReturn\_t [nvmlDeviceGetMemoryInfo\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga030c167e7242fb3af1c5051a6c4a2d44)(nvmlDevice\_t device, nvmlMemory\_v2\_t \*memory)

Retrieves the amount of used, free, reserved and total memory available on the device, in bytes.

nvmlReturn\_t [nvmlDeviceGetMemoryLimits\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga01cbc43094d5b071e07e94117c5342ed)(nvmlDevice\_t device, nvmlGetMemoryLimits\_v1\_t \*limits)

Get the memory limits of the device for the cgroup partition.

nvmlReturn\_t [nvmlDeviceGetMinMaxClockOfPState](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga02a1ea569b85291982b23832cd985766)(nvmlDevice\_t device, nvmlClockType\_t type, nvmlPstates\_t pstate, unsigned int \*minClockMHz, unsigned int \*maxClockMHz)

Retrieve min and max clocks of some clock domain for a given PState.

nvmlReturn\_t [nvmlDeviceGetMinMaxFanSpeed](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4c810b787a6a17e28abbcf60bb9742fe)(nvmlDevice\_t device, unsigned int \*minSpeed, unsigned int \*maxSpeed)

Retrieves the min and max fan speed that user can set for the GPU fan.

nvmlReturn\_t [nvmlDeviceGetMinorNumber](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga97d0ec3ec9f84173788f5cd3df6f5665)(nvmlDevice\_t device, unsigned int \*minorNumber)

Retrieves minor number for the device.

nvmlReturn\_t [nvmlDeviceGetModuleId](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga0ce5871fd9255c3b6d3bbcfd4114c47b)(nvmlDevice\_t device, unsigned int \*moduleId)

Get a unique identifier for the device module on the baseboard.

nvmlReturn\_t [nvmlDeviceGetMultiGpuBoard](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae5e9df768894dd5822c76cd238ecca78)(nvmlDevice\_t device, unsigned int \*multiGpuBool)

Retrieves whether the device is on a Multi-GPU Board Devices that are on multi-GPU boards will set _multiGpuBool_ to a non-zero value.

nvmlReturn\_t [nvmlDeviceGetName](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga68661e469621272ce01dca43409fca55)(nvmlDevice\_t device, char \*name, unsigned int length)

Retrieves the name of this device.

nvmlReturn\_t [nvmlDeviceGetNumFans](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga2e388393da7cedfc36c3cc1af54488d6)(nvmlDevice\_t device, unsigned int \*numFans)

Retrieves the number of fans on the device.

nvmlReturn\_t [nvmlDeviceGetNumGpuCores](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf89b714a5303e2c11f4c4ea31d0aeebd)(nvmlDevice\_t device, unsigned int \*numCores)

Gets the device's core count.

nvmlReturn\_t [nvmlDeviceGetOfaUtilization](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaa3eed3d9fa1c0af30649bf38ce94b699)(nvmlDevice\_t device, unsigned int \*utilization, unsigned int \*samplingPeriodUs)

Retrieves the current utilization and sampling size in microseconds for the OFA (Optical Flow Accelerator)

nvmlReturn\_t [nvmlDeviceGetP2PStatus](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga7e4232fe93566e35b754b5bae6dab020)(nvmlDevice\_t device1, nvmlDevice\_t device2, nvmlGpuP2PCapsIndex\_t p2pIndex, nvmlGpuP2PStatus\_t \*p2pStatus)

Retrieve the status for a given p2p capability index between a given pair of GPU.

nvmlReturn\_t [nvmlDeviceGetPciInfoExt](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaffd35a33a58e5a03351c718a30eca974)(nvmlDevice\_t device, nvmlPciInfoExt\_t \*pci)

Retrieves PCI attributes of this device.

nvmlReturn\_t [nvmlDeviceGetPciInfo\_v3](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga936b0edab70ff7323670cfe5ec4f9b79)(nvmlDevice\_t device, nvmlPciInfo\_t \*pci)

Retrieves the PCI attributes of this device.

nvmlReturn\_t [nvmlDeviceGetPcieLinkMaxSpeed](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac10469b675e9e084ba957450a89e65c2)(nvmlDevice\_t device, unsigned int \*maxSpeed)

Gets the device's PCIE Max Link speed in MBPS.

nvmlReturn\_t [nvmlDeviceGetPcieReplayCounter](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad86b423f2c0f1c2e2398022314b68f75)(nvmlDevice\_t device, unsigned int \*value)

Retrieve the PCIe replay counter.

nvmlReturn\_t [nvmlDeviceGetPcieSpeed](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga9e5b0b9ee1ec05d40f2f29baa59ba52d)(nvmlDevice\_t device, unsigned int \*pcieSpeed)

Gets the device's PCIe Link speed in Mbps.

nvmlReturn\_t [nvmlDeviceGetPcieThroughput](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga38125b6163619aa36504671d8aae9a79)(nvmlDevice\_t device, nvmlPcieUtilCounter\_t counter, unsigned int \*value)

Retrieve PCIe utilization information.

nvmlReturn\_t [nvmlDeviceGetPdi](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac8c4a31e69cfac0a7815bcbf2121570f)(nvmlDevice\_t device, nvmlPdi\_t \*pdi)

Retrieves the Per Device Identifier (PDI) associated with this device.

nvmlReturn\_t [nvmlDeviceGetPerformanceModes](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaa4a7ea3b36e2dc81c9b1da1d2d1f736e)(nvmlDevice\_t device, nvmlDevicePerfModes\_t \*perfModes)

Retrieves a performance mode string with all the performance modes defined for this device along with their associated GPU Clock and Memory Clock values.

nvmlReturn\_t [nvmlDeviceGetPerformanceState](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga83a309f33edeb1ad287c720e316155b4)(nvmlDevice\_t device, nvmlPstates\_t \*pState)

Retrieves the current performance state for the device.

nvmlReturn\_t [nvmlDeviceGetPersistenceMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga2973860574465cbfeadc0b6ce089d76c)(nvmlDevice\_t device, nvmlEnableState\_t \*mode)

Retrieves the persistence mode associated with this device.

nvmlReturn\_t [nvmlDeviceGetPlatformInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga086d374a6cb67a9724fa0e6b71293e65)(nvmlDevice\_t device, nvmlPlatformInfo\_t \*platformInfo)

Get platform information of this device.

nvmlReturn\_t [nvmlDeviceGetPowerManagementDefaultLimit](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gafcde3f35a931af8033d12096cf3a824b)(nvmlDevice\_t device, unsigned int \*defaultLimit)

Retrieves default power management limit on this device, in milliwatts.

nvmlReturn\_t [nvmlDeviceGetPowerManagementLimit](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga241efb1dd9fb32cd89ae462198311159)(nvmlDevice\_t device, unsigned int \*limit)

Retrieves the power management limit associated with this device.

nvmlReturn\_t [nvmlDeviceGetPowerManagementLimitConstraints](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4a3abfe1a2bda62d409d7da96785b22b)(nvmlDevice\_t device, unsigned int \*minLimit, unsigned int \*maxLimit)

Retrieves information about possible values of power management limits on this device.

nvmlReturn\_t [nvmlDeviceGetPowerManagementMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5576e74f8666b7e73ba851fceaea44a7)(nvmlDevice\_t device, nvmlEnableState\_t \*mode)

nvmlReturn\_t [nvmlDeviceGetPowerMizerMode\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae4688574d7eab35963bd8e2afcf85c99)(nvmlDevice\_t device, nvmlDevicePowerMizerModes\_v1\_t \*powerMizerMode)

Retrieves current power mizer mode on this device.

nvmlReturn\_t [nvmlDeviceGetPowerSource](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac045eab89ebf9f287c5bf9a05ae71d31)(nvmlDevice\_t device, nvmlPowerSource\_t \*powerSource)

Gets the devices power source.

nvmlReturn\_t [nvmlDeviceGetPowerState](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga444669b5e9ff90c810410d6e062f6e96)(nvmlDevice\_t device, nvmlPstates\_t \*pState)

nvmlReturn\_t [nvmlDeviceGetPowerUsage](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga88c8833331b0b3049a9008781fedf234)(nvmlDevice\_t device, unsigned int \*power)

Retrieves power usage for this GPU in milliwatts and its associated circuitry (e.g.

nvmlReturn\_t [nvmlDeviceGetProcessUtilization](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga3f83d22ad467f1fd69e6754366fb7c63)(nvmlDevice\_t device, nvmlProcessUtilizationSample\_t \*utilization, unsigned int \*processSamplesCount, unsigned long long lastSeenTimeStamp)

Retrieves the current utilization and process ID.

nvmlReturn\_t [nvmlDeviceGetProcessesUtilizationInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac386c33689ec31b6628b53b9dc9a3a7f)(nvmlDevice\_t device, nvmlProcessesUtilizationInfo\_t \*procesesUtilInfo)

Retrieves the recent utilization and process ID for all running processes.

nvmlReturn\_t [nvmlDeviceGetRemappedRows](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1cd925a276100d7ab70c57e2f9a48557)(nvmlDevice\_t device, unsigned int \*corrRows, unsigned int \*uncRows, unsigned int \*isPending, unsigned int \*failureOccurred)

Get number of remapped rows.

nvmlReturn\_t [nvmlDeviceGetRemappedRows\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga67d636e7e243d6f80fac85c09813611d)(nvmlDevice\_t device, nvmlRemappedRowsInfo\_v2\_t \*info)

Get the status of row remapper.

nvmlReturn\_t [nvmlDeviceGetRetiredPages](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad251bd46571caf51a362a25c3d635fec)(nvmlDevice\_t device, nvmlPageRetirementCause\_t cause, unsigned int \*pageCount, unsigned long long \*addresses)

Returns the list of retired pages by source, including pages that are pending retirement The address information provided from this API is the hardware address of the page that was retired.

nvmlReturn\_t [nvmlDeviceGetRetiredPagesPendingStatus](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaaa4483c080f6edbbe6939fcba3551883)(nvmlDevice\_t device, nvmlEnableState\_t \*isPending)

Check if any pages are pending retirement and need a reboot to fully retire.

nvmlReturn\_t [nvmlDeviceGetRetiredPages\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad1bb860814d5b2e56363cbead6bd7bd1)(nvmlDevice\_t device, nvmlPageRetirementCause\_t cause, unsigned int \*pageCount, unsigned long long \*addresses, unsigned long long \*timestamps)

Returns the list of retired pages by source, including pages that are pending retirement The address information provided from this API is the hardware address of the page that was retired.

nvmlReturn\_t [nvmlDeviceGetRowRemapperHistogram](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5c04b44c92c398bca1a3144baa6edc94)(nvmlDevice\_t device, nvmlRowRemapperHistogramValues\_t \*values)

Get the row remapper histogram.

nvmlReturn\_t [nvmlDeviceGetRunningProcessDetailList](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaac18390ca50d6e76236c216bd5bdf31c)(nvmlDevice\_t device, nvmlProcessDetailList\_t \*plist)

Get information about running processes on a device for input context.

nvmlReturn\_t [nvmlDeviceGetSamples](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf6e32a038416597d5baf7ea5192d5714)(nvmlDevice\_t device, nvmlSamplingType\_t type, unsigned long long lastSeenTimeStamp, nvmlValueType\_t \*sampleValType, unsigned int \*sampleCount, nvmlSample\_t \*samples)

Gets recent samples for the GPU.

nvmlReturn\_t [nvmlDeviceGetSerial](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga55b39fce0b84164657a0e0a62843a426)(nvmlDevice\_t device, char \*serial, unsigned int length)

Retrieves the globally unique board serial number associated with this device's board.

nvmlReturn\_t [nvmlDeviceGetSramEccErrorStatus](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga53a6933cec318945585868e2c7874631)(nvmlDevice\_t device, nvmlEccSramErrorStatus\_t \*status)

Get SRAM ECC error status of this device.

nvmlReturn\_t [nvmlDeviceGetSramUniqueUncorrectedEccErrorCounts](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga08da630d5f584b08367e6da211c25d61)(nvmlDevice\_t device, nvmlEccSramUniqueUncorrectedErrorCounts\_t \*errorCounts)

Retrieves the counts of SRAM unique uncorrected ECC errors.

nvmlReturn\_t [nvmlDeviceGetSupportedClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga712f3716df87ac72898939d1806f2b90)(nvmlDevice\_t device, unsigned long long \*supportedClocksEventReasons)

Retrieves bitmask of supported clocks event reasons that can be returned by [nvmlDeviceGetCurrentClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga880d8166732d6db9f24419dbff9fee03) .

nvmlReturn\_t [nvmlDeviceGetSupportedClocksThrottleReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga3aae8301a421a33c9a67ec4c57ff945a)(nvmlDevice\_t device, unsigned long long \*supportedClocksThrottleReasons)

nvmlReturn\_t [nvmlDeviceGetSupportedGraphicsClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gad656e70d5f69e44a217eec324e271bb0)(nvmlDevice\_t device, unsigned int memoryClockMHz, unsigned int \*count, unsigned int \*clocksMHz)

Retrieves the list of possible graphics clocks that can be used as an argument for [nvmlDeviceSetGpuLockedClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga93b815f72dda73104e00decd878e416a) .

nvmlReturn\_t [nvmlDeviceGetSupportedMemoryClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga2d32e824672f60c9e6c8aab4ed377e25)(nvmlDevice\_t device, unsigned int \*count, unsigned int \*clocksMHz)

Retrieves the list of possible memory clocks that can be used as an argument for [nvmlDeviceSetMemoryLockedClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1gaa4d0070f514e8ffd06270970897b18fa) .

nvmlReturn\_t [nvmlDeviceGetSupportedPerformanceStates](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga132f42b77c8693ccd02cb479e67a11d1)(nvmlDevice\_t device, nvmlPstates\_t \*pstates, unsigned int size)

Get all supported Performance States (P-States) for the device.

nvmlReturn\_t [nvmlDeviceGetTargetFanSpeed](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga892a89b97b0fc085feef859190872cb7)(nvmlDevice\_t device, unsigned int fan, unsigned int \*targetSpeed)

Retrieves the intended target speed of the device's specified fan.

nvmlReturn\_t [nvmlDeviceGetTemperature](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga8ba71930afbf6a1bb1300e01fb6e7f67)(nvmlDevice\_t device, nvmlTemperatureSensors\_t sensorType, unsigned int \*temp)

nvmlReturn\_t [nvmlDeviceGetTemperatureThreshold](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae807f6073146cb90d2d0d7d7bedb2af6)(nvmlDevice\_t device, nvmlTemperatureThresholds\_t thresholdType, unsigned int \*temp)

Retrieves the temperature threshold for the GPU with the specified threshold type in degrees C.

nvmlReturn\_t [nvmlDeviceGetTemperatureV](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac178b1164f60fa7ef7eeaec33dfb492c)(nvmlDevice\_t device, nvmlTemperature\_t \*temperature)

Retrieves the current temperature readings (in degrees C) for the given device.

nvmlReturn\_t [nvmlDeviceGetThermalSettings](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga25971125aea4ebf174442f1aea4c7d70)(nvmlDevice\_t device, unsigned int sensorIndex, nvmlGpuThermalSettings\_t \*pThermalSettings)

Used to execute a list of thermal system instructions.

nvmlReturn\_t [nvmlDeviceGetTopologyCommonAncestor](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6f37e4968e5924589ebbb3cc3425b4a3)(nvmlDevice\_t device1, nvmlDevice\_t device2, nvmlGpuTopologyLevel\_t \*pathInfo)

Retrieve the common ancestor for two devices For all products.

nvmlReturn\_t [nvmlDeviceGetTopologyNearestGpus](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga190392714a4906b75291cc4183aef2f5)(nvmlDevice\_t device, nvmlGpuTopologyLevel\_t level, unsigned int \*count, nvmlDevice\_t \*deviceArray)

Retrieve the set of GPUs that are nearest to a given device at a specific interconnectivity level For all products.

nvmlReturn\_t [nvmlDeviceGetTotalEccErrors](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5ca6c7f177d7f3d89d05613a4cd30eb9)(nvmlDevice\_t device, nvmlMemoryErrorType\_t errorType, nvmlEccCounterType\_t counterType, unsigned long long \*eccCounts)

Retrieves the total ECC error counts for the device.

nvmlReturn\_t [nvmlDeviceGetTotalEnergyConsumption](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga2c8b4e36db8768019d9cc3ed29419003)(nvmlDevice\_t device, unsigned long long \*energy)

Retrieves total energy consumption for this GPU in millijoules (mJ) since the driver was last reloaded.

nvmlReturn\_t [nvmlDeviceGetUUID](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga48f975443c80d0e54587675fa12ecb9d)(nvmlDevice\_t device, char \*uuid, unsigned int length)

Retrieves the globally unique immutable UUID associated with this device, as a 5 part hexadecimal string, that augments the immutable, board serial identifier.

nvmlReturn\_t [nvmlDeviceGetUtilizationRates](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga30e0516c86aa5f98196c73f05c77d4df)(nvmlDevice\_t device, nvmlUtilization\_t \*utilization)

Retrieves the current utilization rates for the device's major subsystems.

nvmlReturn\_t [nvmlDeviceGetVbiosVersion](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1547c1689cefff6dee1d18cec8a8d0d7)(nvmlDevice\_t device, char \*version, unsigned int length)

Get VBIOS version of the device.

nvmlReturn\_t [nvmlDeviceGetViolationStatus](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1a58494f2ee006b5176c4f1fce9af8b1)(nvmlDevice\_t device, nvmlPerfPolicyType\_t perfPolicyType, nvmlViolationTime\_t \*violTime)

nvmlReturn\_t [nvmlDeviceOnSameBoard](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga697e451e9f7edddc64e0f652aa997f1d)(nvmlDevice\_t device1, nvmlDevice\_t device2, int \*onSameBoard)

Check if the GPU devices are on the same physical board.

nvmlReturn\_t [nvmlDevicePerfMetricsGetSamples\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf7e076e3a02ca5c6cdfc08b3ce454a53)(nvmlDevice\_t device, nvmlPerfMetricsSamples\_v1\_t \*samples)

Get Performance Metric samples.

nvmlReturn\_t [nvmlDeviceSetAdaptiveTgpMode\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gada9c968813798f001cf813a44857e030)(nvmlDevice\_t device, nvmlEnableState\_t mode)

Request to enable or disable Adaptive TGP Mode for a GPU.

nvmlReturn\_t [nvmlDeviceSetClockOffsets](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae18e14077ea35602b8b4cc2b7b1cad3a)(nvmlDevice\_t device, nvmlClockOffset\_t \*info)

Control current clock offset of some clock domain for a given PState.

nvmlReturn\_t [nvmlDeviceSetConfComputeUnprotectedMemSize](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga899cb12e917db28f3b890aad293448b3)(nvmlDevice\_t device, unsigned long long sizeKiB)

Set Conf Computing Unprotected Memory Size.

nvmlReturn\_t [nvmlDeviceSetDramEncryptionMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac33d9be92a484ad523e33d88b6de457b)(nvmlDevice\_t device, const nvmlDramEncryptionInfo\_t \*dramEncryption)

Set the DRAM Encryption mode for the device.

nvmlReturn\_t [nvmlDeviceSetHostname\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1cc6bd2f93368207d75318101285266e)(nvmlDevice\_t device, nvmlHostname\_v1\_t \*hostname)

Set the hostname for the device.

nvmlReturn\_t [nvmlDeviceSetMemoryLimits\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1da97a6cfbce0dd4d01d4ac58f0038e5)(nvmlDevice\_t device, nvmlSetMemoryLimits\_v1\_t \*limits)

Set the memory limits of the device for the cgroup partition.

nvmlReturn\_t [nvmlDeviceSetPowerManagementLimit\_v2](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga390fbe078a1ee14eedcd715724dda1d8)(nvmlDevice\_t device, nvmlPowerValue\_v2\_t \*powerValue)

Set new power limit of this device.

nvmlReturn\_t [nvmlDeviceSetPowerMizerMode\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga0011f8f3276efb694128e8dadca98e30)(nvmlDevice\_t device, nvmlDevicePowerMizerModes\_v1\_t \*powerMizerMode)

Sets the new power mizer mode.

nvmlReturn\_t [nvmlDeviceValidateInforom](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4b890d7b2c6fab9dd17146817aaf0438)(nvmlDevice\_t device)

Reads the infoROM from the flash and verifies the checksums.

nvmlReturn\_t [nvmlSystemGetConfComputeCapabilities](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga72a362d80867a797e2b5571422995ce2)(nvmlConfComputeSystemCaps\_t \*capabilities)

Get Conf Computing System capabilities.

nvmlReturn\_t [nvmlSystemGetConfComputeGpusReadyState](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gacff7d62e7a26e273b8e78136e6a9c8b8)(unsigned int \*isAcceptingWork)

Get Conf Computing GPUs ready state.

nvmlReturn\_t [nvmlSystemGetConfComputeKeyRotationThresholdInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6fed52adef49c858349d8c23db58c234)(nvmlConfComputeGetKeyRotationThresholdInfo\_t \*pKeyRotationThrInfo)

Get Conf Computing key rotation threshold detail.

nvmlReturn\_t [nvmlSystemGetConfComputeSettings](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaff4df0388fd14806060bd7b40fe2edb0)(nvmlSystemConfComputeSettings\_t \*settings)

Get Conf Computing System Settings.

nvmlReturn\_t [nvmlSystemGetConfComputeState](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf1eb09bee2f612bc69c3682e357147ab)(nvmlConfComputeSystemState\_t \*state)

Get Conf Computing System State.

nvmlReturn\_t [nvmlSystemSetConfComputeGpusReadyState](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaee6f71c012f69d8089f696494aab70ff)(unsigned int isAcceptingWork)

Set Conf Computing GPUs ready state.

nvmlReturn\_t [nvmlSystemSetConfComputeKeyRotationThresholdInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac269bc027240309ce2280004bbdc38ca)(nvmlConfComputeSetKeyRotationThresholdInfo\_t \*pKeyRotationThrInfo)

Set Conf Computing key rotation threshold.

## Groups [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#groups "Link to this heading")

[CPU and Memory Affinity](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlAffinity.html#group__nvmlaffinity)

This chapter describes NVML operations that are associated with CPU and memory affinity.

## Structs [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#structs "Link to this heading")

[nvmlEccBankRemapperHistogram\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEccBankRemapperHistogram__v1__t.html#structnvmleccbankremapperhistogram__v1__t)

Structure to store bank remapper histogram.

[nvmlEccBankRemapperStatus\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEccBankRemapperStatus__v1__t.html#structnvmleccbankremapperstatus__v1__t)

Structure to store bank remapper status.

[nvmlTemperature\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlTemperature__v1__t.html#structnvmltemperature__v1__t)

Structure used to encapsulate temperature info.

## Typedefs [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#typedefs "Link to this heading")

[nvmlTemperature\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga0f9c4da9dce91507de02d2df588ca732)

## Macros [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#id1 "Link to this heading")

nvmlTemperature\_v1 [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#c.nvmlTemperature_v1 "Link to this definition")

Version macro for _[nvmlTemperature\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlTemperature__v1__t.html#structnvmltemperature__v1__t)_.

## Functions [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#id2 "Link to this heading")

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetAPIRestriction(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlRestrictedAPI\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv419nvmlRestrictedAPI_t "nvmlRestrictedAPI_t") apiType_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*isRestricted_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetAPIRestriction12nvmlDevice_t19nvmlRestrictedAPI_tP17nvmlEnableState_t "Link to this definition")

Retrieves the root/admin permissions on the target API.

See _nvmlRestrictedAPI\_t_ for the list of supported APIs. If an API is restricted only root users can call that API. See _nvmlDeviceSetAPIRestriction_ to change current permissions.

For all fully supported products.

See also

[nvmlRestrictedAPI\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga05bf18d5df6e163cdb8b26ce93bbf797)

Parameters:

- **device** – The identifier of the target device

- **apiType** – Target API type for this operation

- **isRestricted** – Reference in which to return the current restriction NVML\_FEATURE\_ENABLED indicates that the API is root-only NVML\_FEATURE\_DISABLED indicates that the API is accessible to all users


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _isRestricted_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _apiType_ incorrect or _isRestricted_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device or the device does not support the feature that is being queried (E.G. Enabling/disabling Auto Boosted clocks is not supported by the device)

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetAdaptiveClockInfoStatus(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*adaptiveClockStatus_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv436nvmlDeviceGetAdaptiveClockInfoStatus12nvmlDevice_tPj "Link to this definition")

Gets the device’s Adaptive Clock status.

Parameters:

- **device** – The identifier of the target device

- **adaptiveClockStatus** – The current adaptive clocking status, either NVML\_ADAPTIVE\_CLOCKING\_INFO\_STATUS\_DISABLED or NVML\_ADAPTIVE\_CLOCKING\_INFO\_STATUS\_ENABLED


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the current adaptive clocking status is successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _adaptiveClockStatus_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetAdaptiveTgpModeInfo\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlAdaptiveTgpModeInfo\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlAdaptiveTgpModeInfo__v1__t.html#_CPPv428nvmlAdaptiveTgpModeInfo_v1_t "nvmlAdaptiveTgpModeInfo_v1_t")\*info_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv435nvmlDeviceGetAdaptiveTgpModeInfo_v112nvmlDevice_tP28nvmlAdaptiveTgpModeInfo_v1_t "Link to this definition")

Retrieves Adaptive TGP Mode state and telemetry for a GPU.

RUBIN\_OR\_NEWER%

Populates _info_ with the in-band request, out-of-band enablement status, out-of-band override status, arbitrated enablement state, and adjusted base power limit. The adjusted base power is valid only when feature is enabled. See [nvmlAdaptiveTgpModeInfo\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlAdaptiveTgpModeInfo__v1__t.html#structnvmladaptivetgpmodeinfo__v1__t) for field details.

See also

[nvmlDeviceSetAdaptiveTgpMode\_v1()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gada9c968813798f001cf813a44857e030)

Parameters:

- **device** – The identifier of the target device

- **info** – Reference in which to return the Adaptive TGP Mode information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _info_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _info_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support Adaptive TGP Mode

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetApplicationsClock(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlClockType_t "nvmlClockType_t") clockType_,_unsignedint\*clockMHz_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceGetApplicationsClock12nvmlDevice_t15nvmlClockType_tPj "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000018)

Applications clocks are deprecated and will be removed in CUDA 14.0.

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetArchitecture(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDeviceArchitecture\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv424nvmlDeviceArchitecture_t "nvmlDeviceArchitecture_t")\*arch_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetArchitecture12nvmlDevice_tP24nvmlDeviceArchitecture_t "Link to this definition")

Get architecture for device.

Parameters:

- **device** – The identifier of the target device

- **arch** – Reference where architecture is returned, if call successful. Set to NVML\_DEVICE\_ARCH\_\* upon success


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) Upon success

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ or _arch_ (output refererence) are invalid


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetAttributes\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDeviceAttributes\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlDeviceAttributes__t.html#_CPPv422nvmlDeviceAttributes_t "nvmlDeviceAttributes_t")\*attributes_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv426nvmlDeviceGetAttributes_v212nvmlDevice_tP22nvmlDeviceAttributes_t "Link to this definition")

Get attributes (engine counts etc.) for the given NVML device handle.

For Ampere or newer fully supported devices. Supported on Linux only.

Note

This API currently only supports MIG device handles.

Parameters:

- **device** – NVML device handle

- **attributes** – Device attributes


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _device_ attributes were successfully retrieved

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ handle is invalid

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetAutoBoostedClocksEnabled(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*isEnabled_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*defaultIsEnabled_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv437nvmlDeviceGetAutoBoostedClocksEnabled12nvmlDevice_tP17nvmlEnableState_tP17nvmlEnableState_t "Link to this definition")

Retrieve the current state of Auto Boosted clocks on a device and store it in _isEnabled_.

For Kepler or newer fully supported devices.

Auto Boosted clocks are enabled by default on some hardware, allowing the GPU to run at higher clock rates to maximize performance as thermal limits allow.

On Pascal and newer hardware, Auto Aoosted clocks are controlled through application clocks. Use [nvmlDeviceSetApplicationsClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga57c8d28bcdb3353cc3484c88eb008df1) and [nvmlDeviceResetApplicationsClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1gaa4424c574f5aee3ab24c77ffd9b8b4fd) to control Auto Boost behavior.

Parameters:

- **device** – The identifier of the target device

- **isEnabled** – Where to store the current state of Auto Boosted clocks of the target device

- **defaultIsEnabled** – Where to store the default Auto Boosted clocks behavior of the target device that the device will revert to when no applications are using the GPU


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If _isEnabled_ has been been set with the Auto Boosted clocks state of _device_

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _isEnabled_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support Auto Boosted clocks

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBAR1MemoryInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlBAR1Memory\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlBAR1Memory__t.html#_CPPv416nvmlBAR1Memory_t "nvmlBAR1Memory_t")\*bar1Memory_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetBAR1MemoryInfo12nvmlDevice_tP16nvmlBAR1Memory_t "Link to this definition")

Gets Total, Available and Used size of BAR1 memory.

BAR1 is used to map the FB (device memory) so that it can be directly accessed by the CPU or by 3rd party devices (peer-to-peer on the PCIE bus).

For Kepler or newer fully supported devices.

Note

In MIG mode, if device handle is provided, the API returns aggregate information, only if the caller has appropriate privileges. Per-instance information can be queried by using specific MIG device handles.

Parameters:

- **device** – The identifier of the target device

- **bar1Memory** – Reference in which BAR1 memory information is returned.


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if BAR1 memory is successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _bar1Memory_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBBXTimeData\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlBBXTimeData\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlBBXTimeData__v1__t.html#_CPPv420nvmlBBXTimeData_v1_t "nvmlBBXTimeData_v1_t")\*timeData_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetBBXTimeData_v112nvmlDevice_tP20nvmlBBXTimeData_v1_t "Link to this definition")

Retrieves the cumulative number of seconds the GPU has had the driver loaded.

For all products with an inforom.

Parameters:

- **device** – The identifier of the target device

- **timeData** – Reference in which to return the cumulative number of seconds the GPU has had the driver loaded


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _timeData_ has been set

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _timeData_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBankRemapperStatus\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEccBankRemapperStatus\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEccBankRemapperStatus__v1__t.html#_CPPv430nvmlEccBankRemapperStatus_v1_t "nvmlEccBankRemapperStatus_v1_t")\*pBankRemapperStatus_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv434nvmlDeviceGetBankRemapperStatus_v112nvmlDevice_tP30nvmlEccBankRemapperStatus_v1_t "Link to this definition")

Get bank remapper status.

RUBIN\_OR\_NEWER%

Parameters:

- **device** – The identifier of the target device

- **pBankRemapperStatus** – Reference to _nvmlEccBankRemapperStatus\_t_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pBankRemapperStatus_ was populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pBankRemapperStatus_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device doesn’t support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBoardId(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*boardId_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv420nvmlDeviceGetBoardId12nvmlDevice_tPj "Link to this definition")

Retrieves the device boardId from 0-N.

Devices with the same boardId indicate GPUs connected to the same PLX. Use in conjunction with [nvmlDeviceGetMultiGpuBoard()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae5e9df768894dd5822c76cd238ecca78) to decide if they are on the same board as well. The boardId returned is a unique ID for the current configuration. Uniqueness and ordering across reboots and system configurations is not guaranteed (i.e. if a Tesla K40c returns 0x100 and the two GPUs on a Tesla K10 in the same system returns 0x200 it is not guaranteed they will always return those values but they will always be different from each other).

For Fermi or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **boardId** – Reference in which to return the device’s board ID


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _boardId_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _boardId_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBoardPartNumber(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_char\*partNumber_,_unsignedintlength_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetBoardPartNumber12nvmlDevice_tPcj "Link to this definition")

Retrieves the the device board part number which is programmed into the board’s InfoROM.

For all products.

Parameters:

- **device** – Identifier of the target device

- **partNumber** – Reference to the buffer to return

- **length** – Length of the buffer reference


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _partNumber_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the needed VBIOS fields have not been filled

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _serial_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBrand(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlBrandType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlBrandType_t "nvmlBrandType_t")\*type_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv418nvmlDeviceGetBrand12nvmlDevice_tP15nvmlBrandType_t "Link to this definition")

Retrieves the brand of this device.

For all products.

The type is a member of [nvmlBrandType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gafa6b01990b212f7b49089b7158eafd2b) defined above.

Parameters:

- **device** – The identifier of the target device

- **type** – Reference in which to return the product brand type


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _name_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _type_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBridgeChipInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlBridgeChipHierarchy\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlBridgeChipHierarchy__t.html#_CPPv425nvmlBridgeChipHierarchy_t "nvmlBridgeChipHierarchy_t")\*bridgeHierarchy_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetBridgeChipInfo12nvmlDevice_tP25nvmlBridgeChipHierarchy_t "Link to this definition")

Get Bridge Chip Information for all the bridge chips on the board.

For all fully supported products. Only applicable to multi-GPU products.

Parameters:

- **device** – The identifier of the target device

- **bridgeHierarchy** – Reference to the returned bridge chip Hierarchy


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if bridge chip exists

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _bridgeInfo_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if bridge chip not supported on the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetBusType(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlBusType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv413nvmlBusType_t "nvmlBusType_t")\*type_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv420nvmlDeviceGetBusType12nvmlDevice_tP13nvmlBusType_t "Link to this definition")

Get the type of the GPU Bus (PCIe, PCI, …)

return

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the bus _type_ is successfully retreived

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _type_ is NULL

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


Parameters:

- **device** – The identifier of the target device

- **type** – The PCI Bus type


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetC2cModeInfoV(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlC2cModeInfo\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlC2cModeInfo__v1__t.html#_CPPv420nvmlC2cModeInfo_v1_t "nvmlC2cModeInfo_v1_t")\*c2cModeInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetC2cModeInfoV12nvmlDevice_tP20nvmlC2cModeInfo_v1_t "Link to this definition")

Retrieves the Device’s C2C Mode information.

Parameters:

- **device** – The identifier of the target device

- **c2cModeInfo** – Output struct containing the device’s C2C Mode info


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _C2C_ Mode Infor query is successful

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _serial_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetClkMonStatus(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClkMonStatus\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlClkMonStatus__t.html#_CPPv418nvmlClkMonStatus_t "nvmlClkMonStatus_t")\*status_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetClkMonStatus12nvmlDevice_tP18nvmlClkMonStatus_t "Link to this definition")

Retrieves the frequency monitor fault status for the device.

For Ampere or newer fully supported devices. Requires root user.

See [nvmlClkMonStatus\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlClkMonStatus__t.html#structnvmlclkmonstatus__t) for details on decoding the status output.

See also

[nvmlDeviceGetClkMonStatus()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf2f304c0ac25886c031f3f1903638912)

Parameters:

- **device** – The identifier of the target device

- **status** – Reference in which to return the clkmon fault status


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _status_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _status_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetClock(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlClockType_t "nvmlClockType_t") clockType_,_[nvmlClockId\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv413nvmlClockId_t "nvmlClockId_t") clockId_,_unsignedint\*clockMHz_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv418nvmlDeviceGetClock12nvmlDevice_t15nvmlClockType_t13nvmlClockId_tPj "Link to this definition")

Retrieves the clock speed for the clock specified by the clock type and clock ID.

For Kepler or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **clockType** – Identify which clock domain to query

- **clockId** – Identify which clock in the domain to query

- **clockMHz** – Reference in which to return the clock in MHz


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _clockMHz_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _clockMHz_ is NULL or _clockType_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetClockInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlClockType_t "nvmlClockType_t") type_,_unsignedint\*clock_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv422nvmlDeviceGetClockInfo12nvmlDevice_t15nvmlClockType_tPj "Link to this definition")

Retrieves the current clock speeds for the device.

For Fermi or newer fully supported devices.

See [nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga805c0647be9996589fc5e3f6ff680c64) for details on available clock information.

Parameters:

- **device** – The identifier of the target device

- **type** – Identify which clock domain to query

- **clock** – Reference in which to return the clock speed in MHz


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _clock_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _clock_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device cannot report the specified clock

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetClockOffsets(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockOffset\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlClockOffset_t "nvmlClockOffset_t")\*info_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetClockOffsets12nvmlDevice_tP17nvmlClockOffset_t "Link to this definition")

Retrieve min, max and current clock offset of some clock domain for a given PState.

For Maxwell or newer fully supported devices.

Note: [nvmlDeviceGetGpcClkVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga596f6bb44703119b371d60d068010c9d), [nvmlDeviceGetMemClkVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga00ea9dfb980ae9be5f112fe444703fa4), [nvmlDeviceGetGpcClkMinMaxVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga8ac5b50a7b5d71179c706afcecca4785) and [nvmlDeviceGetMemClkMinMaxVfOffset](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6d50061e0ce011df5cec28882d9ead02) will be deprecated in a future release. Use [nvmlDeviceGetClockOffsets](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gafe8863734acf66762e98240e1b26defe) instead.

Parameters:

- **device** – The identifier of the target device

- **info** – Structure specifying the clock type (input) and the pstate (input) retrieved clock offset value (output), min clock offset (output) and max clock offset (output)


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If everything worked

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_, _type_ or _pstate_ are invalid or both _minClockOffsetMHz_ and _maxClockOffsetMHz_ are NULL

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the provided version is invalid/unsupported

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the device does not support this feature


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetComputeMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlComputeMode\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlComputeMode_t "nvmlComputeMode_t")\*mode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetComputeMode12nvmlDevice_tP17nvmlComputeMode_t "Link to this definition")

Retrieves the current compute mode for the device or MIG device.

For all products.

See [nvmlComputeMode\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gabed1b88f2e3ba39070d31d1db4340233) for details on allowed compute modes.

See also

[nvmlDeviceSetComputeMode()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga31789593a489b797cf26d112408cf1ff)

Note

If MIG is enabled on a GPU, device must be MIG device handle.

Parameters:

- **device** – The identifier of the target device handle or MIG device handle

- **mode** – Reference in which to return the current compute mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _mode_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _mode_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetComputeRunningProcesses\_v3(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*infoCount_,_[nvmlProcessInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlProcessInfo__t.html#_CPPv417nvmlProcessInfo_t "nvmlProcessInfo_t")\*infos_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv439nvmlDeviceGetComputeRunningProcesses_v312nvmlDevice_tPjP17nvmlProcessInfo_t "Link to this definition")

Get information about processes with a compute context on a device.

For Fermi or newer fully supported devices.

This function returns information only about compute running processes (e.g. CUDA application which have active context). Any graphics applications (e.g. using OpenGL, DirectX) won’t be listed by this function.

To query the current number of running compute processes, call this function with \*infoCount = 0. The return code will be NVML\_ERROR\_INSUFFICIENT\_SIZE, or NVML\_SUCCESS if none are running. For this call _infos_ is allowed to be NULL.

The usedGpuMemory field returned is all of the memory used by the application.

Keep in mind that information returned by this call is dynamic and the number of elements might change in time. Allocate more space for _infos_ table in case new compute processes are spawned.

See also

[nvmlSystemGetProcessName](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlSystemQueries.html#group__nvmlsystemqueries_1ga7e4216081013c476af55987fb755b94e)

Note

In MIG mode, if device handle is provided, the API returns aggregate information, only if the caller has appropriate privileges. Per-instance information can be queried by using specific MIG device handles. Querying per-instance information using MIG device handles is not supported if the device is in vGPU Host virtualization mode.

Parameters:

- **device** – The device handle or MIG device handle

- **infoCount** – Reference in which to provide the _infos_ array size, and to return the number of returned elements

- **infos** – Reference in which to return the process information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _infoCount_ and _infos_ have been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _infoCount_ indicates that the _infos_ array is too small _infoCount_ will contain minimal amount of space necessary for the call to complete

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, either of _infoCount_ or _infos_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by _device_

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetConfComputeGpuAttestationReport(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlConfComputeGpuAttestationReport\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlConfComputeGpuAttestationReport__t.html#_CPPv437nvmlConfComputeGpuAttestationReport_t "nvmlConfComputeGpuAttestationReport_t")\*gpuAtstReport_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv444nvmlDeviceGetConfComputeGpuAttestationReport12nvmlDevice_tP37nvmlConfComputeGpuAttestationReport_t "Link to this definition")

Get Conf Computing GPU attestation report.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

- **device** – The identifier of the target device

- **gpuAtstReport** – Reference in which to return the gpu attestation report


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _gpu_ attestation report has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _memory_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetConfComputeGpuCertificate(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlConfComputeGpuCertificate\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlConfComputeGpuCertificate__t.html#_CPPv431nvmlConfComputeGpuCertificate_t "nvmlConfComputeGpuCertificate_t")\*gpuCert_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv438nvmlDeviceGetConfComputeGpuCertificate12nvmlDevice_tP31nvmlConfComputeGpuCertificate_t "Link to this definition")

Get Conf Computing GPU certificate details.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

- **device** – The identifier of the target device

- **gpuCert** – Reference in which to return the gpu certificate information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _gpu_ certificate info has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _memory_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetConfComputeMemSizeInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlConfComputeMemSizeInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlConfComputeMemSizeInfo__t.html#_CPPv428nvmlConfComputeMemSizeInfo_t "nvmlConfComputeMemSizeInfo_t")\*memInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv435nvmlDeviceGetConfComputeMemSizeInfo12nvmlDevice_tP28nvmlConfComputeMemSizeInfo_t "Link to this definition")

Get Conf Computing Protected and Unprotected Memory Sizes.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

- **device** – Device handle

- **memInfo** – Protected/Unprotected Memory sizes


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _memInfo_ were successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _memInfo_ or _device_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetConfComputeProtectedMemoryUsage(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlMemory\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlMemory__t.html#_CPPv412nvmlMemory_t "nvmlMemory_t")\*memory_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv444nvmlDeviceGetConfComputeProtectedMemoryUsage12nvmlDevice_tP12nvmlMemory_t "Link to this definition")

Get Conf Computing protected memory usage.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

- **device** – The identifier of the target device

- **memory** – Reference in which to return the memory information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _memory_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _memory_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCoolerInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlCoolerInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv416nvmlCoolerInfo_t "nvmlCoolerInfo_t")\*coolerInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv423nvmlDeviceGetCoolerInfo12nvmlDevice_tP16nvmlCoolerInfo_t "Link to this definition")

Retrieves the cooler’s information.

Returns a cooler’s control signal characteristics. The possible types are restricted, Variable and Toggle. See [nvmlCoolerControl\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#group__nvmldevicestructs_1ga7db03bebc76ca23c07b2c55c89fdcbac) for details on available signal types. Returns objects that cooler cools. Targets may be GPU, Memory, Power Supply or All of these. See [nvmlCoolerTarget\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#group__nvmldevicestructs_1gafd756adefc82b630b3b79bfd60eb6a1a) for details on available targets.

For Maxwell or newer fully supported devices.

For all discrete products with dedicated fans.

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **coolerInfo** – **\[out\]** Structure specifying the cooler’s control signal characteristics (out) and the target that cooler cools (out)


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If everything worked

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ is invalid, _signalType_ or _target_ is NULL

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the provided version is invalid/unsupported

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the _device_ does not support this feature


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCount\_v2( _unsignedint\*deviceCount_) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv421nvmlDeviceGetCount_v2Pj "Link to this definition")

Retrieves the number of compute devices in the system.

A compute device is a single GPU.

For all products.

Note: New nvmlDeviceGetCount\_v2 (default in NVML 5.319) returns count of all devices in the system even if nvmlDeviceGetHandleByIndex\_v2 returns NVML\_ERROR\_NO\_PERMISSION for such device. Update your code to handle this error, or use NVML 4.304 or older nvml header file. For backward binary compatibility reasons \_v1 version of the API is still present in the shared library. Old \_v1 version of nvmlDeviceGetCount doesn’t count devices that NVML has no permission to talk to.

Parameters:

**deviceCount** – Reference in which to return the number of accessible devices

Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _deviceCount_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _deviceCount_ is NULL

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCudaComputeCapability(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_int\*major_,_int\*minor_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv434nvmlDeviceGetCudaComputeCapability12nvmlDevice_tPiPi "Link to this definition")

Retrieves the CUDA compute capability of the device.

For all products.

Returns the major and minor compute capability version numbers of the device. The major and minor versions are equivalent to the CU\_DEVICE\_ATTRIBUTE\_COMPUTE\_CAPABILITY\_MINOR and CU\_DEVICE\_ATTRIBUTE\_COMPUTE\_CAPABILITY\_MAJOR attributes that would be returned by CUDA’s cuDeviceGetAttribute().

Parameters:

- **device** – The identifier of the target device

- **major** – Reference in which to return the major CUDA compute capability

- **minor** – Reference in which to return the minor CUDA compute capability


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _major_ and _minor_ have been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _major_ or _minor_ are NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCurrPcieLinkGeneration(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*currLinkGen_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv435nvmlDeviceGetCurrPcieLinkGeneration12nvmlDevice_tPj "Link to this definition")

Retrieves the current PCIe link generation.

For Fermi or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **currLinkGen** – Reference in which to return the current PCIe link generation


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _currLinkGen_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _currLinkGen_ is null

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if PCIe link information is not available

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCurrPcieLinkWidth(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*currLinkWidth_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceGetCurrPcieLinkWidth12nvmlDevice_tPj "Link to this definition")

Retrieves the current PCIe link width.

For Fermi or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **currLinkWidth** – Reference in which to return the current PCIe link generation


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _currLinkWidth_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _currLinkWidth_ is null

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if PCIe link information is not available

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCurrentClockFreqs(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDeviceCurrentClockFreqs\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv429nvmlDeviceCurrentClockFreqs_t "nvmlDeviceCurrentClockFreqs_t")\*currentClockFreqs_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceGetCurrentClockFreqs12nvmlDevice_tP29nvmlDeviceCurrentClockFreqs_t "Link to this definition")

Retrieves a string with the associated current GPU Clock and Memory Clock values.

Not all tokens will be reported on all GPUs, and additional tokens may be added in the future.

Note: These clock values take into account the offset set by clients through /ref nvmlDeviceSetClockOffsets.

Clock values are returned as a comma-separated list of “token=value” pairs. Valid tokens:

Token Value “perf” unsigned int - the Performance level “nvclock” unsigned int - the GPU clocks (in MHz) for the perf level “nvclockmin” unsigned int - the GPU clocks min (in MHz) for the perf level “nvclockmax” unsigned int - the GPU clocks max (in MHz) for the perf level “nvclockeditable” unsigned int - if the GPU clock domain is editable for the perf level “memclock” unsigned int - the memory clocks (in MHz) for the perf level “memclockmin” unsigned int - the memory clocks min (in MHz) for the perf level “memclockmax” unsigned int - the memory clocks max (in MHz) for the perf level “memclockeditable” unsigned int - if the memory clock domain is editable for the perf level “memtransferrate” unsigned int - the memory transfer rate (in MHz) for the perf level “memtransferratemin” unsigned int - the memory transfer rate min (in MHz) for the perf level “memtransferratemax” unsigned int - the memory transfer rate max (in MHz) for the perf level “memtransferrateeditable” unsigned int - if the memory transfer rate is editable for the perf level

Example:

nvclock=324, nvclockmin=324, nvclockmax=324, nvclockeditable=0, memclock=324, memclockmin=324, memclockmax=324, memclockeditable=0, memtransferrate=648, memtransferratemin=648, memtransferratemax=648, memtransferrateeditable=0 ;

Parameters:

- **device** – The identifier of the target device

- **currentClockFreqs** – Reference in which to return the performance level string


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _currentClockFreqs_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _name_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCurrentClocksEventReasons(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedlonglong\*clocksEventReasons_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv438nvmlDeviceGetCurrentClocksEventReasons12nvmlDevice_tPy "Link to this definition")

Retrieves current clocks event reasons.

For all fully supported products.

See also

[NvmlClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlClocksEventReasons.html#group__nvmlclockseventreasons)

See also

[nvmlDeviceGetSupportedClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga712f3716df87ac72898939d1806f2b90)

Note

More than one bit can be enabled at the same time. Multiple reasons can be affecting clocks at once.

Parameters:

- **device** – The identifier of the target device

- **clocksEventReasons** – Reference in which to return bitmask of active clocks event reasons


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _clocksEventReasons_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _clocksEventReasons_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetCurrentClocksThrottleReasons(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedlonglong\*clocksThrottleReasons_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv441nvmlDeviceGetCurrentClocksThrottleReasons12nvmlDevice_tPy "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000021)

Use [nvmlDeviceGetCurrentClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga880d8166732d6db9f24419dbff9fee03) instead

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDecoderUtilization(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*utilization_,_unsignedint\*samplingPeriodUs_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetDecoderUtilization12nvmlDevice_tPjPj "Link to this definition")

Retrieves the current utilization and sampling size in microseconds for the Decoder.

For Kepler or newer fully supported devices.

Note

On MIG-enabled GPUs, querying decoder utilization is not currently supported.

Parameters:

- **device** – The identifier of the target device

- **utilization** – Reference to an unsigned int for decoder utilization info

- **samplingPeriodUs** – Reference to an unsigned int for the sampling period in US


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _utilization_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _utilization_ is NULL, or _samplingPeriodUs_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDefaultApplicationsClock(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlClockType_t "nvmlClockType_t") clockType_,_unsignedint\*clockMHz_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv437nvmlDeviceGetDefaultApplicationsClock12nvmlDevice_t15nvmlClockType_tPj "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000019)

Applications clocks are deprecated and will be removed in CUDA 14.0.

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDefaultEccMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*defaultMode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetDefaultEccMode12nvmlDevice_tP17nvmlEnableState_t "Link to this definition")

Retrieves the default ECC modes for the device.

For Fermi or newer fully supported devices. Only applicable to devices with ECC. Requires _NVML\_INFOROM\_ECC_ version 1.0 or higher.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on allowed modes.

See also

[nvmlDeviceSetEccMode()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1gaad2e83e10f74f010126d634ddd939607)

Parameters:

- **device** – The identifier of the target device

- **defaultMode** – Reference in which to return the default ECC mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _current_ and _pending_ have been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _default_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDetailedEccErrors(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlMemoryErrorType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv421nvmlMemoryErrorType_t "nvmlMemoryErrorType_t") errorType_,_[nvmlEccCounterType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv420nvmlEccCounterType_t "nvmlEccCounterType_t") counterType_,_[nvmlEccErrorCounts\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEccErrorCounts__t.html#_CPPv420nvmlEccErrorCounts_t "nvmlEccErrorCounts_t")\*eccCounts_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceGetDetailedEccErrors12nvmlDevice_t21nvmlMemoryErrorType_t20nvmlEccCounterType_tP20nvmlEccErrorCounts_t "Link to this definition")

Retrieves the detailed ECC error counts for the device.

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000025)

This API supports only a fixed set of ECC error locations On different GPU architectures different locations are supported See [nvmlDeviceGetMemoryErrorCounter](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga7267425aae7ad6a5e221a53549be1371)

For Fermi or newer fully supported devices. Only applicable to devices with ECC. Requires _NVML\_INFOROM\_ECC_ version 2.0 or higher to report aggregate location-based ECC counts. Requires _NVML\_INFOROM\_ECC_ version 1.0 or higher to report all other ECC counts. Requires ECC Mode to be enabled.

Detailed errors provide separate ECC counts for specific parts of the memory system.

Reports zero for unsupported ECC error counters when a subset of ECC error counters are supported.

See [nvmlMemoryErrorType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gac5469bd68b9fdcf78734471d86becb24)

for a description of available bit types.

See

[nvmlEccCounterType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga08978d1c4fb52b6a4c72b39de144f1d9)

for a description of available counter types.

See

[nvmlEccErrorCounts\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEccErrorCounts__t.html#structnvmleccerrorcounts__t) for a description of provided detailed ECC counts.

See also

[nvmlDeviceClearEccErrorCounts()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga92683374c66c6bb2fd4772262375a845)

Parameters:

- **device** – The identifier of the target device

- **errorType** – Flag that specifies the type of the errors.

- **counterType** – Flag that specifies the counter-type of the errors.

- **eccCounts** – Reference in which to return the specified ECC errors


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _eccCounts_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_, _errorType_ or _counterType_ is invalid, or _eccCounts_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDisplayActive(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*isActive_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv426nvmlDeviceGetDisplayActive12nvmlDevice_tP17nvmlEnableState_t "Link to this definition")

Retrieves the display active state for the device.

For all products.

This method indicates whether a display is initialized on the device. For example whether X Server is attached to this device and has allocated memory for the screen.

Display can be active even when no monitor is physically attached.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on allowed modes.

Parameters:

- **device** – The identifier of the target device

- **isActive** – Reference in which to return the display active state


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _isActive_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _isActive_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDisplayMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*display_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetDisplayMode12nvmlDevice_tP17nvmlEnableState_t "Link to this definition")

Retrieves the display mode for the device.

For all products.

This method indicates whether a physical display (e.g. monitor) is currently connected to any of the device’s connectors.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on allowed modes.

Parameters:

- **device** – The identifier of the target device

- **display** – Reference in which to return the display mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _display_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _display_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDramEncryptionMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDramEncryptionInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv424nvmlDramEncryptionInfo_t "nvmlDramEncryptionInfo_t")\*current_,_[nvmlDramEncryptionInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv424nvmlDramEncryptionInfo_t "nvmlDramEncryptionInfo_t")\*pending_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetDramEncryptionMode12nvmlDevice_tP24nvmlDramEncryptionInfo_tP24nvmlDramEncryptionInfo_t "Link to this definition")

Retrieves the current and pending DRAM Encryption modes for the device.

For Blackwell or newer fully supported devices. Only applicable to devices that support DRAM Encryption Requires _NVML\_INFOROM\_DEN_ version 1.0 or higher.

Changing DRAM Encryption modes requires a reboot. The “pending” DRAM Encryption mode refers to the target mode following the next reboot.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on allowed modes.

See also

[nvmlDeviceSetDramEncryptionMode()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac33d9be92a484ad523e33d88b6de457b)

Parameters:

- **device** – The identifier of the target device

- **current** – Reference in which to return the current DRAM Encryption mode

- **pending** – Reference in which to return the pending DRAM Encryption mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _current_ and _pending_ have been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or either _current_ or _pending_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) if the argument version is not supported

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDriverModel\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDriverModel\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlDriverModel_t "nvmlDriverModel_t")\*current_,_[nvmlDriverModel\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlDriverModel_t "nvmlDriverModel_t")\*pending_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetDriverModel_v212nvmlDevice_tP17nvmlDriverModel_tP17nvmlDriverModel_t "Link to this definition")

Retrieves the current and pending driver model for the device.

For Kepler or newer fully supported devices. For windows only.

On Windows platforms the device driver can run in either WDDM, MCDM or WDM (TCC) modes. If a display is attached to the device it must run in WDDM mode. MCDM mode is preferred if a display is not attached. TCC mode is deprecated. Driver-model availability is architecture-specific; attempting to set an unsupported driver model returns NVML\_ERROR\_NOT\_SUPPORTED.

See [nvmlDriverModel\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gab430456172f55466d483eb950f0f57e1) for details on available driver models.

See also

nvmlDeviceSetDriverModel\_v2()

Parameters:

- **device** – The identifier of the target device

- **current** – Reference in which to return the current driver model

- **pending** – Reference in which to return the pending driver model


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if either _current_ and/or _pending_ have been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or both _current_ and _pending_ are NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the platform is not windows

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetDynamicPstatesInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlGpuDynamicPstatesInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuDynamicPstatesInfo__t.html#_CPPv427nvmlGpuDynamicPstatesInfo_t "nvmlGpuDynamicPstatesInfo_t")\*pDynamicPstatesInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetDynamicPstatesInfo12nvmlDevice_tP27nvmlGpuDynamicPstatesInfo_t "Link to this definition")

Retrieve performance monitor samples from the associated subdevice.

Parameters:

- **device** –

- **pDynamicPstatesInfo** –


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pDynamicPstatesInfo_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pDynamicPstatesInfo_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetEccMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*current_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*pending_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv420nvmlDeviceGetEccMode12nvmlDevice_tP17nvmlEnableState_tP17nvmlEnableState_t "Link to this definition")

Retrieves the current and pending ECC modes for the device.

For Fermi or newer fully supported devices. Only applicable to devices with ECC. Requires _NVML\_INFOROM\_ECC_ version 1.0 or higher.

Changing ECC modes requires a reboot. The “pending” ECC mode refers to the target mode following the next reboot.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on allowed modes.

See also

[nvmlDeviceSetEccMode()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1gaad2e83e10f74f010126d634ddd939607)

Parameters:

- **device** – The identifier of the target device

- **current** – Reference in which to return the current ECC mode

- **pending** – Reference in which to return the pending ECC mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _current_ and _pending_ have been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or either _current_ or _pending_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetEncoderCapacity(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEncoderType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlEncoderStructs.html#_CPPv417nvmlEncoderType_t "nvmlEncoderType_t") encoderQueryType_,_unsignedint\*encoderCapacity_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetEncoderCapacity12nvmlDevice_t17nvmlEncoderType_tPj "Link to this definition")

Retrieves the current capacity of the device’s encoder, as a percentage of maximum encoder capacity with valid values in the range 0-100.

For Maxwell or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **encoderQueryType** – Type of encoder to query

- **encoderCapacity** – Reference to an unsigned int for the encoder capacity


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _encoderCapacity_ is fetched

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _encoderCapacity_ is NULL, or _device_ or _encoderQueryType_ are invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if device does not support the encoder specified in _encodeQueryType_

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetEncoderSessions(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*sessionCount_,_[nvmlEncoderSessionInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEncoderSessionInfo__t.html#_CPPv424nvmlEncoderSessionInfo_t "nvmlEncoderSessionInfo_t")\*sessionInfos_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetEncoderSessions12nvmlDevice_tPjP24nvmlEncoderSessionInfo_t "Link to this definition")

Retrieves information about active encoder sessions on a target device.

An array of active encoder sessions is returned in the caller-supplied buffer pointed at by _sessionInfos_. The array element count is passed in _sessionCount_, and _sessionCount_ is used to return the number of sessions written to the buffer.

If the supplied buffer is not large enough to accommodate the active session array, the function returns NVML\_ERROR\_INSUFFICIENT\_SIZE, with the element count of [nvmlEncoderSessionInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEncoderSessionInfo__t.html#structnvmlencodersessioninfo__t) array required in _sessionCount_. To query the number of active encoder sessions, call this function with \*sessionCount = 0. The code will return NVML\_SUCCESS with number of active encoder sessions updated in \*sessionCount.

For Maxwell or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **sessionCount** – Reference to caller supplied array size, and returns the number of sessions.

- **sessionInfos** – Reference in which to return the session information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _sessionInfos_ is fetched

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _sessionCount_ is too small, array element count is returned in _sessionCount_

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _sessionCount_ is NULL.

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by _device_

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetEncoderStats(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*sessionCount_,_unsignedint\*averageFps_,_unsignedint\*averageLatency_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetEncoderStats12nvmlDevice_tPjPjPj "Link to this definition")

Retrieves the current encoder statistics for a given device.

For Maxwell or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **sessionCount** – Reference to an unsigned int for count of active encoder sessions

- **averageFps** – Reference to an unsigned int for trailing average FPS of all active sessions

- **averageLatency** – Reference to an unsigned int for encode latency in microseconds


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _sessionCount_, _averageFps_ and _averageLatency_ is fetched

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _sessionCount_, or _device_ or _averageFps_, or _averageLatency_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetEncoderUtilization(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*utilization_,_unsignedint\*samplingPeriodUs_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetEncoderUtilization12nvmlDevice_tPjPj "Link to this definition")

Retrieves the current utilization and sampling size in microseconds for the Encoder.

For Kepler or newer fully supported devices.

Note

On MIG-enabled GPUs, querying encoder utilization is not currently supported.

Parameters:

- **device** – The identifier of the target device

- **utilization** – Reference to an unsigned int for encoder utilization info

- **samplingPeriodUs** – Reference to an unsigned int for the sampling period in US


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _utilization_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _utilization_ is NULL, or _samplingPeriodUs_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetEnforcedPowerLimit(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*limit_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetEnforcedPowerLimit12nvmlDevice_tPj "Link to this definition")

Get the effective power limit that the driver enforces after taking into account all limiters.

Note: This can be different from the [nvmlDeviceGetPowerManagementLimit](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga241efb1dd9fb32cd89ae462198311159) if other limits are set elsewhere This includes the out of band power limit interface

For Kepler or newer fully supported devices.

Parameters:

- **device** – The device to communicate with

- **limit** – Reference in which to return the power management limit in milliwatts


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _limit_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _limit_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetFBCSessions(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*sessionCount_,_[nvmlFBCSessionInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlFBCSessionInfo__t.html#_CPPv420nvmlFBCSessionInfo_t "nvmlFBCSessionInfo_t")\*sessionInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetFBCSessions12nvmlDevice_tPjP20nvmlFBCSessionInfo_t "Link to this definition")

Retrieves information about active frame buffer capture sessions on a target device.

An array of active FBC sessions is returned in the caller-supplied buffer pointed at by _sessionInfo_. The array element count is passed in _sessionCount_, and _sessionCount_ is used to return the number of sessions written to the buffer.

If the supplied buffer is not large enough to accommodate the active session array, the function returns NVML\_ERROR\_INSUFFICIENT\_SIZE, with the element count of [nvmlFBCSessionInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlFBCSessionInfo__t.html#structnvmlfbcsessioninfo__t) array required in _sessionCount_. To query the number of active FBC sessions, call this function with \*sessionCount = 0. The code will return NVML\_SUCCESS with number of active FBC sessions updated in \*sessionCount.

For Maxwell or newer fully supported devices.

Note

hResolution, vResolution, averageFPS and averageLatency data for a FBC session returned in _sessionInfo_ may be zero if there are no new frames captured since the session started.

Parameters:

- **device** – The identifier of the target device

- **sessionCount** – Reference to caller supplied array size, and returns the number of sessions.

- **sessionInfo** – Reference in which to return the session information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _sessionInfo_ is fetched

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _sessionCount_ is too small, array element count is returned in _sessionCount_

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _sessionCount_ is NULL.

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetFBCStats(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlFBCStats\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlFBCStats__t.html#_CPPv414nvmlFBCStats_t "nvmlFBCStats_t")\*fbcStats_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv421nvmlDeviceGetFBCStats12nvmlDevice_tP14nvmlFBCStats_t "Link to this definition")

Retrieves the active frame buffer capture sessions statistics for a given device.

For Maxwell or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **fbcStats** – Reference to [nvmlFBCStats\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlFBCStats__t.html#structnvmlfbcstats__t) structure containing NvFBC stats


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _fbcStats_ is fetched

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _fbcStats_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetFanControlPolicy\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedintfan_,_[nvmlFanControlPolicy\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv422nvmlFanControlPolicy_t "nvmlFanControlPolicy_t")\*policy_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv432nvmlDeviceGetFanControlPolicy_v212nvmlDevice_tjP22nvmlFanControlPolicy_t "Link to this definition")

Gets current fan control policy.

For Maxwell or newer fully supported devices.

For all cuda-capable discrete products with fans

Parameters:

- **device** – The identifier of the target _device_

- **fan** – The index of the target fan, zero indexed.

- **policy** – Reference in which to return the fan control _policy_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _policy_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _policy_ is null or the _fan_ given doesn’t reference a fan that exists.

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the _device_ is older than Maxwell

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetFanSpeed(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*speed_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv421nvmlDeviceGetFanSpeed12nvmlDevice_tPj "Link to this definition")

Retrieves the intended operating speed of the device’s fan.

Note: The reported speed is the intended fan speed. If the fan is physically blocked and unable to spin, the output will not match the actual fan speed.

For all discrete products with dedicated fans.

The fan speed is expressed as a percentage of the product’s maximum noise tolerance fan speed. This value may exceed 100% in certain cases.

Parameters:

- **device** – The identifier of the target device

- **speed** – Reference in which to return the fan speed percentage


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _speed_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _speed_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have a fan

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetFanSpeedRPM(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlFanSpeedInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv418nvmlFanSpeedInfo_t "nvmlFanSpeedInfo_t")\*fanSpeed_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetFanSpeedRPM12nvmlDevice_tP18nvmlFanSpeedInfo_t "Link to this definition")

Retrieves the intended operating speed in rotations per minute (RPM) of the device’s specified fan.

For Maxwell or newer fully supported devices.

For all discrete products with dedicated fans.

Note: The reported speed is the intended fan speed. If the fan is physically blocked and unable to spin, the output will not match the actual fan speed.

Parameters:

- **device** – The identifier of the target device

- **fanSpeed** – Structure specifying the index of the target fan (input) and retrieved fan speed value (output)


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If everything worked

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ is invalid, _fan_ is not an acceptable index, or _speed_ is NULL

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the provided version is invalid/unsupported

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the _device_ does not support this feature


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetFanSpeed\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedintfan_,_unsignedint\*speed_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetFanSpeed_v212nvmlDevice_tjPj "Link to this definition")

Retrieves the intended operating speed of the device’s specified fan.

Note: The reported speed is the intended fan speed. If the fan is physically blocked and unable to spin, the output will not match the actual fan speed.

For all discrete products with dedicated fans.

The fan speed is expressed as a percentage of the product’s maximum noise tolerance fan speed. This value may exceed 100% in certain cases.

Parameters:

- **device** – The identifier of the target device

- **fan** – The index of the target fan, zero indexed.

- **speed** – Reference in which to return the fan speed percentage


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _speed_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _fan_ is not an acceptable index, or _speed_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have a fan or is newer than Maxwell

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGpcClkMinMaxVfOffset(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_int\*minOffset_,_int\*maxOffset_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv433nvmlDeviceGetGpcClkMinMaxVfOffset12nvmlDevice_tPiPi "Link to this definition")

Retrieve the GPCCLK min max VF offset value.

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **minOffset** – **\[out\]** The retrieved GPCCLK VF min offset value

- **maxOffset** – **\[out\]** The retrieved GPCCLK VF max offset value


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _offset_ has been successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _offset_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGpcClkVfOffset(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_int\*offset_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetGpcClkVfOffset12nvmlDevice_tPi "Link to this definition")

Retrieve the GPCCLK VF offset value.

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **offset** – **\[out\]** The retrieved GPCCLK VF offset value


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _offset_ has been successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _offset_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGpuFabricInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlGpuFabricInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuFabricInfo__t.html#_CPPv419nvmlGpuFabricInfo_t "nvmlGpuFabricInfo_t")\*gpuFabricInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv426nvmlDeviceGetGpuFabricInfo12nvmlDevice_tP19nvmlGpuFabricInfo_t "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000027)

Will be deprecated in a future release. Use [nvmlDeviceGetGpuFabricInfoV](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga426d75b00e5a5ea887aabd7bb6bc82dc) instead

Get fabric information associated with the device.

For Hopper or newer fully supported devices.

On Hopper + NVSwitch systems, GPU is registered with the NVIDIA Fabric Manager Upon successful registration, the GPU is added to the NVLink fabric to enable peer-to-peer communication. This API reports the current state of the GPU in the NVLink fabric along with other useful information.

Parameters:

- **device** – The identifier of the target device

- **gpuFabricInfo** – Information about GPU fabric state


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) Upon success

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If _device_ doesn’t support gpu fabric


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGpuFabricInfoV(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlGpuFabricInfoV\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFabricDefs.html#_CPPv420nvmlGpuFabricInfoV_t "nvmlGpuFabricInfoV_t")\*gpuFabricInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetGpuFabricInfoV12nvmlDevice_tP20nvmlGpuFabricInfoV_t "Link to this definition")

Versioned wrapper around [nvmlDeviceGetGpuFabricInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae927ec21da56d96275ab10595c072a16) that accepts a versioned [nvmlGpuFabricInfo\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuFabricInfo__v2__t.html#structnvmlgpufabricinfo__v2__t) or later output structure.

For Hopper or newer fully supported devices.

Note

The caller must set the [nvmlGpuFabricInfoV\_t::version](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuFabricInfo__v3__t.html#structnvmlgpufabricinfo__v3__t_1a8fb71e9a285c7282caa9231df8426a3b) field to the appropriate version prior to calling this function. For example:

```
nvmlGpuFabricInfoV_t fabricInfo =
    { .version = nvmlGpuFabricInfo_v2 };
nvmlReturn_t result = nvmlDeviceGetGpuFabricInfoV(device,&fabricInfo);
```

Copy to clipboard

Parameters:

- **device** – The identifier of the target device

- **gpuFabricInfo** – Information about GPU fabric state


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) Upon success

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If _device_ doesn’t support gpu fabric


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGpuFabricInfo\_v4(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlGpuFabricInfo\_v4\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuFabricInfo__v4__t.html#_CPPv422nvmlGpuFabricInfo_v4_t "nvmlGpuFabricInfo_v4_t")\*gpuFabricInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetGpuFabricInfo_v412nvmlDevice_tP22nvmlGpuFabricInfo_v4_t "Link to this definition")

Retrieves GPU fabric information including per-type clique assignments.

Returns fabric clique data via [nvmlGpuFabricInfo\_v4\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuFabricInfo__v4__t.html#structnvmlgpufabricinfo__v4__t). Each entry in the _cliques_ array is a (type, id) pair representing a single clique assignment. The number of valid entries is given by _numCliques_. Entries are sorted by ascending type (NVML\_GPU\_FABRIC\_CLIQUE\_TYPE\_\*), then by ascending clique id within each type.

On Hopper systems, the driver reports Unicast Pointer and Multicast Pointer cliques. On Blackwell and Rubin, Unicast Logical Endpoint and Multicast Logical Endpoint are additionally reported.

```
nvmlGpuFabricInfo_v4_t fabricInfo = {0};
nvmlReturn_t result = nvmlDeviceGetGpuFabricInfo_v4(device, &fabricInfo);
```

Copy to clipboard

For Hopper or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **gpuFabricInfo** – Information about GPU fabric state including per-type cliques


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) Upon success

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If _device_ doesn’t support gpu fabric

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ or _gpuFabricInfo_ is invalid


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGpuMaxPcieLinkGeneration(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*maxLinkGenDevice_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv437nvmlDeviceGetGpuMaxPcieLinkGeneration12nvmlDevice_tPj "Link to this definition")

Retrieves the maximum PCIe link generation supported by this device.

For Fermi or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **maxLinkGenDevice** – Reference in which to return the max PCIe link generation


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _maxLinkGenDevice_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _maxLinkGenDevice_ is null

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if PCIe link information is not available

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGpuOperationMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlGpuOperationMode\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv422nvmlGpuOperationMode_t "nvmlGpuOperationMode_t")\*current_,_[nvmlGpuOperationMode\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv422nvmlGpuOperationMode_t "nvmlGpuOperationMode_t")\*pending_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetGpuOperationMode12nvmlDevice_tP22nvmlGpuOperationMode_tP22nvmlGpuOperationMode_t "Link to this definition")

Retrieves the current GOM and pending GOM (the one that GPU will switch to after reboot).

For GK110 M-class and X-class Tesla products from the Kepler family. Modes [NVML\_GOM\_LOW\_DP](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga2b4120e21686a4892ab27fed68026571a3133134c586b348705908a25bf1f2fa0) and [NVML\_GOM\_ALL\_ON](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga2b4120e21686a4892ab27fed68026571a704d821fd17421cde81ece69b3d6b2c7) are supported on fully supported GeForce products. Not supported on Quadro and Tesla C-class products.

See also

[nvmlGpuOperationMode\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga2b4120e21686a4892ab27fed68026571)

See also

[nvmlDeviceSetGpuOperationMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1gab7a6065152a4c5069da10a88ed34b7e2)

Parameters:

- **device** – The identifier of the target device

- **current** – Reference in which to return the current GOM

- **pending** – Reference in which to return the pending GOM


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _mode_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _current_ or _pending_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGraphicsRunningProcesses\_v3(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*infoCount_,_[nvmlProcessInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlProcessInfo__t.html#_CPPv417nvmlProcessInfo_t "nvmlProcessInfo_t")\*infos_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv440nvmlDeviceGetGraphicsRunningProcesses_v312nvmlDevice_tPjP17nvmlProcessInfo_t "Link to this definition")

Get information about processes with a graphics context on a device.

For Kepler or newer fully supported devices.

This function returns information only about graphics based processes (eg. applications using OpenGL, DirectX)

To query the current number of running graphics processes, call this function with \*infoCount = 0. The return code will be NVML\_ERROR\_INSUFFICIENT\_SIZE, or NVML\_SUCCESS if none are running. For this call _infos_ is allowed to be NULL.

The usedGpuMemory field returned is all of the memory used by the application.

Keep in mind that information returned by this call is dynamic and the number of elements might change in time. Allocate more space for _infos_ table in case new graphics processes are spawned.

See also

[nvmlSystemGetProcessName](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlSystemQueries.html#group__nvmlsystemqueries_1ga7e4216081013c476af55987fb755b94e)

Note

In MIG mode, if device handle is provided, the API returns aggregate information, only if the caller has appropriate privileges. Per-instance information can be queried by using specific MIG device handles. Querying per-instance information using MIG device handles is not supported if the device is in vGPU Host virtualization mode.

Parameters:

- **device** – The device handle or MIG device handle

- **infoCount** – Reference in which to provide the _infos_ array size, and to return the number of returned elements

- **infos** – Reference in which to return the process information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _infoCount_ and _infos_ have been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _infoCount_ indicates that the _infos_ array is too small _infoCount_ will contain minimal amount of space necessary for the call to complete

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, either of _infoCount_ or _infos_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by _device_

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGspFirmwareMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*isEnabled_,_unsignedint\*defaultMode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetGspFirmwareMode12nvmlDevice_tPjPj "Link to this definition")

Retrieve GSP firmware mode.

The caller passes in integer pointers. GSP firmware enablement and default mode information is returned with corresponding parameters. The return value in _isEnabled_ and _defaultMode_ should be treated as boolean.

Parameters:

- **device** – Device handle

- **isEnabled** – Pointer to specify if GSP firmware is enabled

- **defaultMode** – Pointer to specify if GSP firmware is supported by default on _device_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if GSP firmware mode is sucessfully retrieved

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or any of _isEnabled_ or _defaultMode_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if GSP firmware is not enabled for GPU

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetGspFirmwareVersion(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_char\*version_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetGspFirmwareVersion12nvmlDevice_tPc "Link to this definition")

Retrieve GSP firmware version.

The caller passes in buffer via _version_ and corresponding GSP firmware numbered version is returned with the same parameter in string format.

Parameters:

- **device** – Device handle

- **version** – The retrieved GSP firmware version


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if GSP firmware version is sucessfully retrieved

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or GSP _version_ pointer is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if GSP firmware is not enabled for GPU

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetHandleByIndex\_v2(_unsignedintindex_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t")\*device_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetHandleByIndex_v2jP12nvmlDevice_t "Link to this definition")

Acquire the handle for a particular device, based on its index.

For all products.

Valid indices are derived from the _accessibleDevices_ count returned by [nvmlDeviceGetCount\_v2()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf2828b5a2e93e9f4384367e1e3602f5c). For example, if _accessibleDevices_ is 2 the valid indices are 0 and 1, corresponding to GPU 0 and GPU 1.

The order in which NVML enumerates devices has no guarantees of consistency between reboots. For that reason it is recommended that devices be looked up by their PCI ids or UUID. See [nvmlDeviceGetHandleByUUID()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5f8df708abce63c37d2736674a9ab28d) and [nvmlDeviceGetHandleByPciBusId\_v2()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6d95e59c11ec96ce8bc13a6646e66660).

Note: The NVML index may not correlate with other APIs, such as the CUDA device index.

Starting from NVML 5, this API causes NVML to initialize the target GPU NVML may initialize additional GPUs if:

- The target GPU is an SLI slave


Note: New nvmlDeviceGetCount\_v2 (default in NVML 5.319) returns count of all devices in the system even if nvmlDeviceGetHandleByIndex\_v2 returns NVML\_ERROR\_NO\_PERMISSION for such device. Update your code to handle this error, or use NVML 4.304 or older nvml header file. For backward binary compatibility reasons \_v1 version of the API is still present in the shared library. Old \_v1 version of nvmlDeviceGetCount doesn’t count devices that NVML has no permission to talk to.

This means that nvmlDeviceGetHandleByIndex\_v2 and \_v1 can return different devices for the same index. If you don’t touch macros that map old (\_v1) versions to \_v2 versions at the top of the file you don’t need to worry about that.

See also

[nvmlDeviceGetIndex](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga2aecb745e547dda7fa71009d18ac0e56)

See also

nvmlDeviceGetCount

Parameters:

- **index** – The index of the target GPU, >= 0 and < _accessibleDevices_

- **device** – Reference in which to return the device handle


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _device_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _index_ is invalid or _device_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_POWER](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a13d13cc93fcac0b07c7c5291e3c9e12c) if any attached devices have improperly attached external power cables

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to talk to this device

- [NVML\_ERROR\_IRQ\_ISSUE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a48c23dd0b6b21a516010b7372054fabc) if NVIDIA kernel detected an interrupt issue with the attached GPUs

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetHandleByPciBusId\_v2(_constchar\*pciBusId_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t")\*device_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv432nvmlDeviceGetHandleByPciBusId_v2PKcP12nvmlDevice_t "Link to this definition")

Acquire the handle for a particular device, based on its PCI bus id.

For all products.

This value corresponds to the [nvmlPciInfo\_t::busId](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPciInfo__t.html#structnvmlpciinfo__t_1a223b95953fea33e634970beee251cb93) returned by [nvmlDeviceGetPciInfo\_v3()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga936b0edab70ff7323670cfe5ec4f9b79).

Starting from NVML 5, this API causes NVML to initialize the target GPU NVML may initialize additional GPUs if:

- The target GPU is an SLI slave


Note

NVML 4.304 and older version of nvmlDeviceGetHandleByPciBusId”\_v1” returns NVML\_ERROR\_NOT\_FOUND instead of NVML\_ERROR\_NO\_PERMISSION.

Parameters:

- **pciBusId** – The PCI bus id of the target GPU Accept the following formats (all numbers in hexadecimal): domain:bus:device.function in format x:x:x.x domain:bus:device in format x:x:x bus:device.function in format x:x.x

- **device** – Reference in which to return the device handle


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _device_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _pciBusId_ is invalid or _device_ is NULL

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if _pciBusId_ does not match a valid device on the system

- [NVML\_ERROR\_INSUFFICIENT\_POWER](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a13d13cc93fcac0b07c7c5291e3c9e12c) if the attached device has improperly attached external power cables

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to talk to this device

- [NVML\_ERROR\_IRQ\_ISSUE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a48c23dd0b6b21a516010b7372054fabc) if NVIDIA kernel detected an interrupt issue with the attached GPUs

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetHandleBySerial(_constchar\*serial_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t")\*device_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetHandleBySerialPKcP12nvmlDevice_t "Link to this definition")

Acquire the handle for a particular device, based on its board serial number.

For Fermi or newer fully supported devices.

This number corresponds to the value printed directly on the board, and to the value returned by [nvmlDeviceGetSerial()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga55b39fce0b84164657a0e0a62843a426).

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000017)

Since more than one GPU can exist on a single board this function is deprecated in favor of [nvmlDeviceGetHandleByUUID](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5f8df708abce63c37d2736674a9ab28d). For dual GPU boards this function will return NVML\_ERROR\_INVALID\_ARGUMENT.

Starting from NVML 5, this API causes NVML to initialize the target GPU NVML may initialize additional GPUs as it searches for the target GPU

See also

[nvmlDeviceGetSerial](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga55b39fce0b84164657a0e0a62843a426)

See also

[nvmlDeviceGetHandleByUUID](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5f8df708abce63c37d2736674a9ab28d)

Parameters:

- **serial** – The board serial number of the target GPU

- **device** – Reference in which to return the device handle


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _device_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _serial_ is invalid, _device_ is NULL or more than one device has the same serial (dual GPU boards)

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if _serial_ does not match a valid device on the system

- [NVML\_ERROR\_INSUFFICIENT\_POWER](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a13d13cc93fcac0b07c7c5291e3c9e12c) if any attached devices have improperly attached external power cables

- [NVML\_ERROR\_IRQ\_ISSUE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a48c23dd0b6b21a516010b7372054fabc) if NVIDIA kernel detected an interrupt issue with the attached GPUs

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if any GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetHandleByUUID(_constchar\*uuid_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t")\*device_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetHandleByUUIDPKcP12nvmlDevice_t "Link to this definition")

Acquire the handle for a particular device, based on its globally unique immutable UUID (in ASCII format) associated with each device.

For all products.

Starting from NVML 5, this API causes NVML to initialize the target GPU NVML may initialize additional GPUs as it searches for the target GPU

See also

[nvmlDeviceGetUUID](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga48f975443c80d0e54587675fa12ecb9d)

Parameters:

- **uuid** – The UUID of the target GPU or MIG instance

- **device** – Reference in which to return the device handle or MIG device handle


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _device_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _uuid_ is invalid or _device_ is null

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if _uuid_ does not match a valid device on the system

- [NVML\_ERROR\_INSUFFICIENT\_POWER](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a13d13cc93fcac0b07c7c5291e3c9e12c) if any attached devices have improperly attached external power cables

- [NVML\_ERROR\_IRQ\_ISSUE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a48c23dd0b6b21a516010b7372054fabc) if NVIDIA kernel detected an interrupt issue with the attached GPUs

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if any GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetHandleByUUIDV(_const [nvmlUUID\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv410nvmlUUID_t "nvmlUUID_t")\*uuid_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t")\*device_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv426nvmlDeviceGetHandleByUUIDVPK10nvmlUUID_tP12nvmlDevice_t "Link to this definition")

Acquire the handle for a particular device, based on its globally unique immutable UUID (in either ASCII or binary format) associated with each device.

See [nvmlUUID\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlUUID__v1__t.html#structnvmluuid__v1__t) for more information on the UUID struct. The caller must set the appropriate version prior to calling this API.

For all products.

This API causes NVML to initialize the target GPU NVML may initialize additional GPUs as it searches for the target GPU

Parameters:

- **uuid** – **\[in\]** The UUID of the target GPU or MIG instance

- **device** – **\[out\]** Reference in which to return the device handle or MIG device handle


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _device_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _uuid_ is invalid, _device_ is null or _uuid->type_ is invalid

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) if the provided version is invalid/unsupported

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if _uuid_ does not match a valid device on the system

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if any GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetHostname\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlHostname\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlHostname__v1__t.html#_CPPv417nvmlHostname_v1_t "nvmlHostname_v1_t")\*hostname_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetHostname_v112nvmlDevice_tP17nvmlHostname_v1_t "Link to this definition")

Get the hostname for the device.

For Blackwell or newer fully supported devices. Supported on Linux only.

Retrieves the hostname string for the GPU device that was set using [nvmlDeviceSetHostname\_v1()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1cc6bd2f93368207d75318101285266e).

See also

[nvmlDeviceSetHostname\_v1()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1cc6bd2f93368207d75318101285266e)

Parameters:

- **device** – The identifier of the target device

- **hostname** – Reference to the caller-provided nvmlHostname\_v1\_t struct to return the hostname


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the hostname was retrieved successfully

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _hostname_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetIndex(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*index_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv418nvmlDeviceGetIndex12nvmlDevice_tPj "Link to this definition")

Retrieves the NVML index of this device.

For all products.

Valid indices are derived from the _accessibleDevices_ count returned by [nvmlDeviceGetCount\_v2()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaf2828b5a2e93e9f4384367e1e3602f5c). For example, if _accessibleDevices_ is 2 the valid indices are 0 and 1, corresponding to GPU 0 and GPU 1.

The order in which NVML enumerates devices has no guarantees of consistency between reboots. For that reason it is recommended that devices be looked up by their PCI ids or GPU UUID. See [nvmlDeviceGetHandleByPciBusId\_v2()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6d95e59c11ec96ce8bc13a6646e66660) and [nvmlDeviceGetHandleByUUID()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5f8df708abce63c37d2736674a9ab28d).

When used with MIG device handles this API returns indices that can be passed to [nvmlDeviceGetMigDeviceHandleByIndex](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlMultiInstanceGPU.html#group__nvmlmultiinstancegpu_1gafbb353ca7a8eb77a65ffef5b30a72610) to retrieve an identical handle. MIG device indices are unique within a device.

Note: The NVML index may not correlate with other APIs, such as the CUDA device index.

See also

nvmlDeviceGetHandleByIndex()

See also

nvmlDeviceGetCount()

Parameters:

- **device** – The identifier of the target device

- **index** – Reference in which to return the NVML index of the device


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _index_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _index_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetInforomConfigurationChecksum(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*checksum_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv441nvmlDeviceGetInforomConfigurationChecksum12nvmlDevice_tPj "Link to this definition")

Retrieves the checksum of the configuration stored in the device’s infoROM.

For all products with an inforom.

Can be used to make sure that two GPUs have the exact same configuration. Current checksum takes into account configuration stored in PWR and ECC infoROM objects. Checksum can change between driver releases or when user changes configuration (e.g. disable/enable ECC)

Parameters:

- **device** – The identifier of the target device

- **checksum** – Reference in which to return the infoROM configuration checksum


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _checksum_ has been set

- [NVML\_ERROR\_CORRUPTED\_INFOROM](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a1feb6170c875e85346fc167c5725663a) if the device’s checksum couldn’t be retrieved due to infoROM corruption

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _checksum_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetInforomImageVersion(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_char\*version_,_unsignedintlength_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv432nvmlDeviceGetInforomImageVersion12nvmlDevice_tPcj "Link to this definition")

Retrieves the global infoROM image version.

For all products with an inforom.

Image version just like VBIOS version uniquely describes the exact version of the infoROM flashed on the board in contrast to infoROM object version which is only an indicator of supported features. Version string will not exceed 16 characters in length (including the NULL terminator). See nvmlConstants::NVML\_DEVICE\_INFOROM\_VERSION\_BUFFER\_SIZE.

See also

[nvmlDeviceGetInforomVersion](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae72d874ef25a5bb259d7e3d528935c5a)

Parameters:

- **device** – The identifier of the target device

- **version** – Reference in which to return the infoROM image version

- **length** – The maximum allowed length of the string returned in _version_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _version_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _version_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have an infoROM

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetInforomVersion(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlInforomObject\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv419nvmlInforomObject_t "nvmlInforomObject_t") object_,_char\*version_,_unsignedintlength_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetInforomVersion12nvmlDevice_t19nvmlInforomObject_tPcj "Link to this definition")

Retrieves the version information for the device’s infoROM object.

For all products with an inforom.

Fermi and higher parts have non-volatile on-board memory for persisting device info, such as aggregate ECC counts. The version of the data structures in this memory may change from time to time. It will not exceed 16 characters in length (including the NULL terminator). See nvmlConstants::NVML\_DEVICE\_INFOROM\_VERSION\_BUFFER\_SIZE.

See [nvmlInforomObject\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga10116b75eb019498c27c0b070461723c) for details on the available infoROM objects.

See also

[nvmlDeviceGetInforomImageVersion](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga1df61c76389e2619f416554d7990361b)

Parameters:

- **device** – The identifier of the target device

- **object** – The target infoROM object

- **version** – Reference in which to return the infoROM version

- **length** – The maximum allowed length of the string returned in _version_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _version_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _version_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have an infoROM

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetIrqNum(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*irqNum_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv419nvmlDeviceGetIrqNum12nvmlDevice_tPj "Link to this definition")

Gets the device’s interrupt number.

Parameters:

- **device** – The identifier of the target device

- **irqNum** – The interrupt number associated with the specified device


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if irq number is successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _irqNum_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetJpgUtilization(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*utilization_,_unsignedint\*samplingPeriodUs_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetJpgUtilization12nvmlDevice_tPjPj "Link to this definition")

Retrieves the current utilization and sampling size in microseconds for the JPG.

For Turing or newer fully supported devices.

Note

On MIG-enabled GPUs, querying decoder utilization is not currently supported.

Parameters:

- **device** – The identifier of the target device

- **utilization** – Reference to an unsigned int for jpg utilization info

- **samplingPeriodUs** – Reference to an unsigned int for the sampling period in US


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _utilization_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _utilization_ is NULL, or _samplingPeriodUs_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetLastBBXFlushTime(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedlonglong\*timestamp_,_unsignedlong\*durationUs_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetLastBBXFlushTime12nvmlDevice_tPyPm "Link to this definition")

Retrieves the timestamp and the duration of the last flush of the BBX (blackbox) infoROM object during the current run.

For all products with an inforom.

See also

[nvmlDeviceGetInforomVersion](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gae72d874ef25a5bb259d7e3d528935c5a)

Parameters:

- **device** – The identifier of the target device

- **timestamp** – The start timestamp of the last BBX Flush

- **durationUs** – The duration (us) of the last BBX Flush


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _timestamp_ and _durationUs_ are successfully retrieved

- [NVML\_ERROR\_NOT\_READY](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa3462e3c349eefa2d3d544258dac5c15) if the BBX object has not been flushed yet

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have an infoROM

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMPSComputeRunningProcesses\_v3(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*infoCount_,_[nvmlProcessInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlProcessInfo__t.html#_CPPv417nvmlProcessInfo_t "nvmlProcessInfo_t")\*infos_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv442nvmlDeviceGetMPSComputeRunningProcesses_v312nvmlDevice_tPjP17nvmlProcessInfo_t "Link to this definition")

Get information about processes with a Multi-Process Service (MPS) compute context on a device.

For Volta or newer fully supported devices.

This function returns information only about compute running processes (e.g. CUDA application which have active context) utilizing MPS. Any graphics applications (e.g. using OpenGL, DirectX) won’t be listed by this function.

To query the current number of running compute processes, call this function with \*infoCount = 0. The return code will be NVML\_ERROR\_INSUFFICIENT\_SIZE, or NVML\_SUCCESS if none are running. For this call _infos_ is allowed to be NULL.

The usedGpuMemory field returned is all of the memory used by the application.

Keep in mind that information returned by this call is dynamic and the number of elements might change in time. Allocate more space for _infos_ table in case new compute processes are spawned.

See also

[nvmlSystemGetProcessName](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlSystemQueries.html#group__nvmlsystemqueries_1ga7e4216081013c476af55987fb755b94e)

Note

In MIG mode, if device handle is provided, the API returns aggregate information, only if the caller has appropriate privileges. Per-instance information can be queried by using specific MIG device handles. Querying per-instance information using MIG device handles is not supported if the device is in vGPU Host virtualization mode.

Parameters:

- **device** – The device handle or MIG device handle

- **infoCount** – Reference in which to provide the _infos_ array size, and to return the number of returned elements

- **infos** – Reference in which to return the process information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _infoCount_ and _infos_ have been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _infoCount_ indicates that the _infos_ array is too small _infoCount_ will contain minimal amount of space necessary for the call to complete

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, either of _infoCount_ or _infos_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by _device_

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMarginTemperature(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlMarginTemperature\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv423nvmlMarginTemperature_t "nvmlMarginTemperature_t")\*marginTempInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceGetMarginTemperature12nvmlDevice_tP23nvmlMarginTemperature_t "Link to this definition")

Retrieves the thermal margin temperature (distance to nearest slowdown threshold).

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **marginTempInfo** – **\[inout\]** Versioned structure in which to return the temperature reading


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the margin temperature was retrieved successfully

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if request is not supported on the current platform

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _temperature_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) if the right versioned structure is not used

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMaxClockInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlClockType_t "nvmlClockType_t") type_,_unsignedint\*clock_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetMaxClockInfo12nvmlDevice_t15nvmlClockType_tPj "Link to this definition")

Retrieves the maximum clock speeds for the device.

For Fermi or newer fully supported devices.

See [nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga805c0647be9996589fc5e3f6ff680c64) for details on available clock information.

Note

Current P0 clocks (reported by [nvmlDeviceGetClockInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga6c718e0df86350ce27fcd279b3e482d1)) can differ from max clocks by a few MHz.

Parameters:

- **device** – The identifier of the target device

- **type** – Identify which clock domain to query

- **clock** – Reference in which to return the clock speed in MHz


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _clock_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _clock_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device cannot report the specified clock

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMaxCustomerBoostClock(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlClockType_t "nvmlClockType_t") clockType_,_unsignedint\*clockMHz_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv434nvmlDeviceGetMaxCustomerBoostClock12nvmlDevice_t15nvmlClockType_tPj "Link to this definition")

Retrieves the customer defined maximum boost clock speed specified by the given clock type.

For Pascal or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **clockType** – Identify which clock domain to query

- **clockMHz** – Reference in which to return the clock in MHz


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _clockMHz_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _clockMHz_ is NULL or _clockType_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device or the _clockType_ on this device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMaxPcieLinkGeneration(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*maxLinkGen_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv434nvmlDeviceGetMaxPcieLinkGeneration12nvmlDevice_tPj "Link to this definition")

Retrieves the maximum PCIe link generation possible with this device and system.

I.E. for a generation 2 PCIe device attached to a generation 1 PCIe bus the max link generation this function will report is generation 1.

For Fermi or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **maxLinkGen** – Reference in which to return the max PCIe link generation


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _maxLinkGen_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _maxLinkGen_ is null

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if PCIe link information is not available

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMaxPcieLinkWidth(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*maxLinkWidth_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetMaxPcieLinkWidth12nvmlDevice_tPj "Link to this definition")

Retrieves the maximum PCIe link width possible with this device and system.

I.E. for a device with a 16x PCIe bus width attached to a 8x PCIe system bus this function will report a max link width of 8.

For Fermi or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **maxLinkWidth** – Reference in which to return the max PCIe link generation


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _maxLinkWidth_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _maxLinkWidth_ is null

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if PCIe link information is not available

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMemClkMinMaxVfOffset(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_int\*minOffset_,_int\*maxOffset_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv433nvmlDeviceGetMemClkMinMaxVfOffset12nvmlDevice_tPiPi "Link to this definition")

Retrieve the MemClk (Memory Clock) min max VF offset value.

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **minOffset** – **\[out\]** The retrieved MemClk VF min offset value

- **maxOffset** – **\[out\]** The retrieved MemClk VF max offset value


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _offset_ has been successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _offset_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMemClkVfOffset(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_int\*offset_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetMemClkVfOffset12nvmlDevice_tPi "Link to this definition")

Retrieve the MemClk (Memory Clock) VF offset value.

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **offset** – **\[out\]** The retrieved MemClk VF offset value


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _offset_ has been successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _offset_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMemoryBusWidth(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*busWidth_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetMemoryBusWidth12nvmlDevice_tPj "Link to this definition")

Gets the device’s memory bus width.

Parameters:

- **device** – The identifier of the target device

- **busWidth** – The devices’s memory bus width


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the memory bus width is successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _busWidth_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMemoryErrorCounter(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlMemoryErrorType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv421nvmlMemoryErrorType_t "nvmlMemoryErrorType_t") errorType_,_[nvmlEccCounterType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv420nvmlEccCounterType_t "nvmlEccCounterType_t") counterType_,_[nvmlMemoryLocation\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv420nvmlMemoryLocation_t "nvmlMemoryLocation_t") locationType_,_unsignedlonglong\*count_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetMemoryErrorCounter12nvmlDevice_t21nvmlMemoryErrorType_t20nvmlEccCounterType_t20nvmlMemoryLocation_tPy "Link to this definition")

Retrieves the requested memory error counter for the device.

For Fermi or newer fully supported devices. Requires _NVML\_INFOROM\_ECC_ version 2.0 or higher to report aggregate location-based memory error counts. Requires _NVML\_INFOROM\_ECC_ version 1.0 or higher to report all other memory error counts.

Only applicable to devices with ECC.

Requires ECC Mode to be enabled.

See [nvmlMemoryErrorType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gac5469bd68b9fdcf78734471d86becb24)

for a description of available memory error types.

See

[nvmlEccCounterType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga08978d1c4fb52b6a4c72b39de144f1d9)

for a description of available counter types.

See

[nvmlMemoryLocation\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga9bcbee49054a953d333d4aa11e8b9c25) for a description of available counter locations.

Note

On MIG-enabled GPUs, per instance information can be queried using specific MIG device handles. Per instance information is currently only supported for non-DRAM uncorrectable volatile errors. Querying volatile errors using device handles is currently not supported.

Parameters:

- **device** – The identifier of the target device

- **errorType** – Flag that specifies the type of error.

- **counterType** – Flag that specifies the counter-type of the errors.

- **locationType** – Specifies the location of the counter.

- **count** – Reference in which to return the ECC counter


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _count_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_, _bitTyp_,e _counterType_ or _locationType_ is invalid, or _count_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support ECC error reporting in the specified memory

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMemoryInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlMemory\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlMemory__t.html#_CPPv412nvmlMemory_t "nvmlMemory_t")\*memory_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv423nvmlDeviceGetMemoryInfo12nvmlDevice_tP12nvmlMemory_t "Link to this definition")

Retrieves the amount of used, free, reserved and total memory available on the device, in bytes.

The reserved amount is supported on version 2 only.

For all products.

Enabling ECC reduces the amount of total available memory, due to the extra required parity bits. Under WDDM most device memory is allocated and managed on startup by Windows.

Under Linux and Windows TCC, the reported amount of used memory is equal to the sum of memory allocated by all active channels on the device.

See [nvmlMemory\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlMemory__v2__t.html#structnvmlmemory__v2__t) for details on available memory info.

Note

In MIG mode, if device handle is provided, the API returns aggregate information, only if the caller has appropriate privileges. Per-instance information can be queried by using specific MIG device handles.

Note

nvmlDeviceGetMemoryInfo\_v2 adds additional memory information.

Note

On systems where GPUs are NUMA nodes, the accuracy of FB memory utilization provided by this API depends on the memory accounting of the operating system. This is because FB memory is managed by the operating system instead of the NVIDIA GPU driver. Typically, pages allocated from FB memory are not released even after the process terminates to enhance performance. In scenarios where the operating system is under memory pressure, it may resort to utilizing FB memory. Such actions can result in discrepancies in the accuracy of memory reporting.

Note

On certain SOC platforms, the integrated GPU (iGPU) does not use a dedicated framebuffer but instead shares memory with the system. As a result, [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) will be returned in this case.

Parameters:

- **device** – The identifier of the target device

- **memory** – Reference in which to return the memory information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _memory_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _memory_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if video memory is unsupported on the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMemoryInfo\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlMemory\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlMemory__v2__t.html#_CPPv415nvmlMemory_v2_t "nvmlMemory_v2_t")\*memory_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv426nvmlDeviceGetMemoryInfo_v212nvmlDevice_tP15nvmlMemory_v2_t "Link to this definition")

Retrieves the amount of used, free, reserved and total memory available on the device, in bytes.

nvmlDeviceGetMemoryInfo\_v2 accounts separately for reserved memory and includes it in the used memory amount.

For all products.

Enabling ECC reduces the amount of total available memory, due to the extra required parity bits. Under WDDM most device memory is allocated and managed on startup by Windows.

Under Linux and Windows TCC, the reported amount of used memory is equal to the sum of memory allocated by all active channels on the device.

Note

In MIG mode, if device handle is provided, the API returns aggregate information, only if the caller has appropriate privileges. Per-instance information can be queried by using specific MIG device handles.

Note

On systems where GPUs are NUMA nodes, the accuracy of FB memory utilization provided by this API depends on the memory accounting of the operating system. This is because FB memory is managed by the operating system instead of the NVIDIA GPU driver. Typically, pages allocated from FB memory are not released even after the process terminates to enhance performance. In scenarios where the operating system is under memory pressure, it may resort to utilizing FB memory. Such actions can result in discrepancies in the accuracy of memory reporting.

Note

On certain SOC platforms, the integrated GPU (iGPU) does not use a dedicated framebuffer but instead shares memory with the system. As a result, [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) will be returned in this case.

Parameters:

- **device** – The identifier of the target device

- **memory** – Reference in which to return the memory information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _memory_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _memory_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if video memory is unsupported on the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMemoryLimits\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlGetMemoryLimits\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGetMemoryLimits__v1__t.html#_CPPv424nvmlGetMemoryLimits_v1_t "nvmlGetMemoryLimits_v1_t")\*limits_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetMemoryLimits_v112nvmlDevice_tP24nvmlGetMemoryLimits_v1_t "Link to this definition")

Get the memory limits of the device for the cgroup partition.

This method will get the current memory limits of the device for the specified cgroup partition, as well as the current memory used against the limits.

For all products. For Linux only.

Note

MIG handles are not supported

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **limits** – **\[inout\]** A pointer to [nvmlGetMemoryLimits\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGetMemoryLimits__v1__t.html#structnvmlgetmemorylimits__v1__t)


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the operation was successful

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _limits_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if the limits were not found for this device and cgroup

- [NVML\_ERROR\_OPERATING\_SYSTEM](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aea1f781a65537a95b031adffdfbebf9c) if the cgroup path cannot be opened

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMinMaxClockOfPState(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv415nvmlClockType_t "nvmlClockType_t") type_,_[nvmlPstates\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv413nvmlPstates_t "nvmlPstates_t") pstate_,_unsignedint\*minClockMHz_,_unsignedint\*maxClockMHz_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv432nvmlDeviceGetMinMaxClockOfPState12nvmlDevice_t15nvmlClockType_t13nvmlPstates_tPjPj "Link to this definition")

Retrieve min and max clocks of some clock domain for a given PState.

Parameters:

- **device** – The identifier of the target device

- **type** – Clock domain

- **pstate** – PState to query

- **minClockMHz** – Reference in which to return min clock frequency

- **maxClockMHz** – Reference in which to return max clock frequency


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if everything worked

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_, _type_ or _minClockMHz_ and _maxClockMHz_ are NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) if _type_ or _pstate_ are invalid or any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMinMaxFanSpeed(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*minSpeed_,_unsignedint\*maxSpeed_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetMinMaxFanSpeed12nvmlDevice_tPjPj "Link to this definition")

Retrieves the min and max fan speed that user can set for the GPU fan.

For all cuda-capable discrete products with fans

Parameters:

- **device** – The identifier of the target device

- **minSpeed** – The minimum speed allowed to set

- **maxSpeed** – The maximum speed allowed to set


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if speed has been adjusted

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if device is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this (doesn’t have fans)

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMinorNumber(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*minorNumber_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetMinorNumber12nvmlDevice_tPj "Link to this definition")

Retrieves minor number for the device.

The minor number for the device is such that the Nvidia device node file for each GPU will have the form /dev/nvidia\[minor number\].

For all products. Supported only for Linux

Parameters:

- **device** – The identifier of the target device

- **minorNumber** – Reference in which to return the minor number for the device


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the minor number is successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _minorNumber_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetModuleId(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*moduleId_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv421nvmlDeviceGetModuleId12nvmlDevice_tPj "Link to this definition")

Get a unique identifier for the device module on the baseboard.

This API retrieves a unique identifier for each GPU module that exists on a given baseboard. For non-baseboard products, this ID would always be 0.

Parameters:

- **device** – The identifier of the target device

- **moduleId** – Unique identifier for the GPU module


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _moduleId_ has been successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ or _moduleId_ is invalid

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetMultiGpuBoard(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*multiGpuBool_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv426nvmlDeviceGetMultiGpuBoard12nvmlDevice_tPj "Link to this definition")

Retrieves whether the device is on a Multi-GPU Board Devices that are on multi-GPU boards will set _multiGpuBool_ to a non-zero value.

For Fermi or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **multiGpuBool** – Reference in which to return a zero or non-zero value to indicate whether the device is on a multi GPU board


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _multiGpuBool_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _multiGpuBool_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetName(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_char\*name_,_unsignedintlength_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv417nvmlDeviceGetName12nvmlDevice_tPcj "Link to this definition")

Retrieves the name of this device.

For all products.

The name is an alphanumeric string that denotes a particular product, e.g. Tesla C2070. It will not exceed 96 characters in length (including the NULL terminator). See nvmlConstants::NVML\_DEVICE\_NAME\_V2\_BUFFER\_SIZE.

When used with MIG device handles the API returns MIG device names which can be used to identify devices based on their attributes.

Parameters:

- **device** – The identifier of the target device

- **name** – Reference in which to return the product name

- **length** – The maximum allowed length of the string returned in _name_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _name_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _name_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetNumFans(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*numFans_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv420nvmlDeviceGetNumFans12nvmlDevice_tPj "Link to this definition")

Retrieves the number of fans on the device.

For all discrete products with dedicated fans.

Parameters:

- **device** – The identifier of the target device

- **numFans** – The number of fans


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _fan_ number query was successful

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _numFans_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have a fan

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetNumGpuCores(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*numCores_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetNumGpuCores12nvmlDevice_tPj "Link to this definition")

Gets the device’s core count.

Note

On MIG-enabled GPUs, querying the device’s core count is currently not supported using this API. Please use [nvmlDeviceGetGpuInstanceProfileInfo](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlMultiInstanceGPU.html#group__nvmlmultiinstancegpu_1ga1611f0e6286feaaeea557126f460883f) to fetch the MIG device’s core count.

Parameters:

- **device** – The identifier of the target device

- **numCores** – The number of cores for the specified device


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if GPU core count is successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _numCores_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device or a mig device.

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetOfaUtilization(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*utilization_,_unsignedint\*samplingPeriodUs_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetOfaUtilization12nvmlDevice_tPjPj "Link to this definition")

Retrieves the current utilization and sampling size in microseconds for the OFA (Optical Flow Accelerator)

For Turing or newer fully supported devices.

Note

On MIG-enabled GPUs, querying decoder utilization is not currently supported.

Parameters:

- **device** – The identifier of the target device

- **utilization** – Reference to an unsigned int for ofa utilization info

- **samplingPeriodUs** – Reference to an unsigned int for the sampling period in US


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _utilization_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _utilization_ is NULL, or _samplingPeriodUs_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetP2PStatus(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device1_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device2_,_[nvmlGpuP2PCapsIndex\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv421nvmlGpuP2PCapsIndex_t "nvmlGpuP2PCapsIndex_t") p2pIndex_,_[nvmlGpuP2PStatus\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv418nvmlGpuP2PStatus_t "nvmlGpuP2PStatus_t")\*p2pStatus_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv422nvmlDeviceGetP2PStatus12nvmlDevice_t12nvmlDevice_t21nvmlGpuP2PCapsIndex_tP18nvmlGpuP2PStatus_t "Link to this definition")

Retrieve the status for a given p2p capability index between a given pair of GPU.

Parameters:

- **device1** – The first device

- **device2** – The second device

- **p2pIndex** – p2p Capability Index being looked for between _device1_ and _device2_

- **p2pStatus** – Reference in which to return the status of the _p2pIndex_ between _device1_ and _device2_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _p2pStatus_ has been populated

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device1_ or _device2_ or _p2pIndex_ is invalid or _p2pStatus_ is NULL

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPciInfoExt(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPciInfoExt\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv416nvmlPciInfoExt_t "nvmlPciInfoExt_t")\*pci_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv423nvmlDeviceGetPciInfoExt12nvmlDevice_tP16nvmlPciInfoExt_t "Link to this definition")

Retrieves PCI attributes of this device.

For all products.

See [nvmlPciInfoExt\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPciInfoExt__v1__t.html#structnvmlpciinfoext__v1__t) for details on the available PCI info.

Parameters:

- **device** – The identifier of the target device

- **pci** – Reference in which to return the PCI info


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pci_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pci_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPciInfo\_v3(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPciInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPciInfo__t.html#_CPPv413nvmlPciInfo_t "nvmlPciInfo_t")\*pci_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv423nvmlDeviceGetPciInfo_v312nvmlDevice_tP13nvmlPciInfo_t "Link to this definition")

Retrieves the PCI attributes of this device.

For all products.

See [nvmlPciInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPciInfo__t.html#structnvmlpciinfo__t) for details on the available PCI info.

Parameters:

- **device** – The identifier of the target device

- **pci** – Reference in which to return the PCI info


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pci_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pci_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPcieLinkMaxSpeed(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*maxSpeed_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetPcieLinkMaxSpeed12nvmlDevice_tPj "Link to this definition")

Gets the device’s PCIE Max Link speed in MBPS.

Parameters:

- **device** – The identifier of the target device

- **maxSpeed** – The devices’s PCIE Max Link speed in MBPS


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if PCIe Max Link Speed is successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _maxSpeed_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPcieReplayCounter(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*value_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceGetPcieReplayCounter12nvmlDevice_tPj "Link to this definition")

Retrieve the PCIe replay counter.

For Kepler or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **value** – Reference in which to return the counter’s value


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _value_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _value_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPcieSpeed(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*pcieSpeed_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv422nvmlDeviceGetPcieSpeed12nvmlDevice_tPj "Link to this definition")

Gets the device’s PCIe Link speed in Mbps.

Parameters:

- **device** – The identifier of the target device

- **pcieSpeed** – The devices’s PCIe Max Link speed in Mbps


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pcieSpeed_ has been retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pcieSpeed_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support PCIe speed getting

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPcieThroughput(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPcieUtilCounter\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv421nvmlPcieUtilCounter_t "nvmlPcieUtilCounter_t") counter_,_unsignedint\*value_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetPcieThroughput12nvmlDevice_t21nvmlPcieUtilCounter_tPj "Link to this definition")

Retrieve PCIe utilization information.

This function is querying a byte counter over a 20ms interval and thus is the PCIe throughput over that interval.

For Maxwell or newer fully supported devices.

This method is not supported in virtual machines running virtual GPU (vGPU).

Parameters:

- **device** – The identifier of the target device

- **counter** – The specific counter that should be queried [nvmlPcieUtilCounter\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#group__nvmldevicestructs_1ga0840d5d019555b267b45609c5568ced5)

- **value** – Reference in which to return throughput in KB/s


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _value_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ or _counter_ is invalid, or _value_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPdi( _[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_, _[nvmlPdi\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv49nvmlPdi_t "nvmlPdi_t")\*pdi_) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv416nvmlDeviceGetPdi12nvmlDevice_tP9nvmlPdi_t "Link to this definition")

Retrieves the Per Device Identifier (PDI) associated with this device.

For Pascal or newer fully supported devices.

See [nvmlPdi\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPdi__v1__t.html#structnvmlpdi__v1__t) for more information on the struct.

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **pdi** – **\[out\]** Reference to the caller-provided structure to return the GPU PDI


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pdi_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _pdi_ is NULL

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) if the version is invalid/unsupported

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPerformanceModes(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDevicePerfModes\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv421nvmlDevicePerfModes_t "nvmlDevicePerfModes_t")\*perfModes_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetPerformanceModes12nvmlDevice_tP21nvmlDevicePerfModes_t "Link to this definition")

Retrieves a performance mode string with all the performance modes defined for this device along with their associated GPU Clock and Memory Clock values.

Not all tokens will be reported on all GPUs, and additional tokens may be added in the future. For backwards compatibility we still provide nvclock and memclock; those are the same as nvclockmin and memclockmin.

Note: These clock values take into account the offset set by clients through /ref nvmlDeviceSetClockOffsets.

Maximum available Pstate (P15) shows the minimum performance level (0) and vice versa.

Each performance modes are returned as a comma-separated list of “token=value” pairs. Each set of performance mode tokens are separated by a “;”. Valid tokens:

Token Value “perf” unsigned int - the Performance level “nvclock” unsigned int - the GPU clocks (in MHz) for the perf level “nvclockmin” unsigned int - the GPU clocks min (in MHz) for the perf level “nvclockmax” unsigned int - the GPU clocks max (in MHz) for the perf level “nvclockeditable” unsigned int - if the GPU clock domain is editable for the perf level “memclock” unsigned int - the memory clocks (in MHz) for the perf level “memclockmin” unsigned int - the memory clocks min (in MHz) for the perf level “memclockmax” unsigned int - the memory clocks max (in MHz) for the perf level “memclockeditable” unsigned int - if the memory clock domain is editable for the perf level “memtransferrate” unsigned int - the memory transfer rate (in MHz) for the perf level “memtransferratemin” unsigned int - the memory transfer rate min (in MHz) for the perf level “memtransferratemax” unsigned int - the memory transfer rate max (in MHz) for the perf level “memtransferrateeditable” unsigned int - if the memory transfer rate is editable for the perf level

Example:

perf=0, nvclock=324, nvclockmin=324, nvclockmax=324, nvclockeditable=0, memclock=324, memclockmin=324, memclockmax=324, memclockeditable=0, memtransferrate=648, memtransferratemin=648, memtransferratemax=648, memtransferrateeditable=0 ; perf=1, nvclock=324, nvclockmin=324, nvclockmax=640, nvclockeditable=0, memclock=810, memclockmin=810, memclockmax=810, memclockeditable=0, memtransferrate=1620, memtransferrate=1620, memtransferrate=1620, memtransferrateeditable=0 ;

Parameters:

- **device** – The identifier of the target device

- **perfModes** – Reference in which to return the performance level string


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _perfModes_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _name_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPerformanceState(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPstates\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv413nvmlPstates_t "nvmlPstates_t")\*pState_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetPerformanceState12nvmlDevice_tP13nvmlPstates_t "Link to this definition")

Retrieves the current performance state for the device.

For Fermi or newer fully supported devices.

See [nvmlPstates\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga9de0cdfc67dfc2704b86344a7d5dc4fb) for details on allowed performance states.

Parameters:

- **device** – The identifier of the target device

- **pState** – Reference in which to return the performance state reading


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pState_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pState_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPersistenceMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*mode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetPersistenceMode12nvmlDevice_tP17nvmlEnableState_t "Link to this definition")

Retrieves the persistence mode associated with this device.

For all products. For Linux only.

When driver persistence mode is enabled the driver software state is not torn down when the last client disconnects. By default this feature is disabled.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on allowed modes.

See also

[nvmlDeviceSetPersistenceMode()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga9fbd09d11dbef81366ed545a0833595d)

Parameters:

- **device** – The identifier of the target device

- **mode** – Reference in which to return the current driver persistence mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _mode_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _mode_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPlatformInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPlatformInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv418nvmlPlatformInfo_t "nvmlPlatformInfo_t")\*platformInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetPlatformInfo12nvmlDevice_tP18nvmlPlatformInfo_t "Link to this definition")

Get platform information of this device.

For Blackwell or newer fully supported devices.

See [nvmlPlatformInfo\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPlatformInfo__v2__t.html#structnvmlplatforminfo__v2__t) for more information on the struct.

Parameters:

- **device** – The identifier of the target device

- **platformInfo** – Pointer to the caller-provided structure of nvmlPlatformInfo\_t.


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If _platformInfo_ has been retrieved

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ is invalid or _platformInfo_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the device does not support this feature

- [NVML\_ERROR\_MEMORY](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a0fc4fe3b647ffbd98240d57b9e11256c) if system memory is insufficient

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the version of _nvmlPlatformInfo\_t_ is invalid

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) On any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerManagementDefaultLimit(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*defaultLimit_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv440nvmlDeviceGetPowerManagementDefaultLimit12nvmlDevice_tPj "Link to this definition")

Retrieves default power management limit on this device, in milliwatts.

Default power management limit is a power management limit that the device boots with.

For Kepler or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **defaultLimit** – Reference in which to return the default power management limit in milliwatts


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _defaultLimit_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _defaultLimit_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerManagementLimit(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*limit_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv433nvmlDeviceGetPowerManagementLimit12nvmlDevice_tPj "Link to this definition")

Retrieves the power management limit associated with this device.

For Fermi or newer fully supported devices.

The power limit defines the upper boundary for the card’s power draw. If the card’s total power draw reaches this limit the power management algorithm kicks in.

This reading is only available if power management mode is supported. See [nvmlDeviceGetPowerManagementMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5576e74f8666b7e73ba851fceaea44a7).

Parameters:

- **device** – The identifier of the target device

- **limit** – Reference in which to return the power management limit in milliwatts


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _limit_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _limit_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerManagementLimitConstraints(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*minLimit_,_unsignedint\*maxLimit_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv444nvmlDeviceGetPowerManagementLimitConstraints12nvmlDevice_tPjPj "Link to this definition")

Retrieves information about possible values of power management limits on this device.

For Kepler or newer fully supported devices.

See also

[nvmlDeviceSetPowerManagementLimit](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga088d21d27c22ca9608c8f276bc812211)

Parameters:

- **device** – The identifier of the target device

- **minLimit** – Reference in which to return the minimum power management limit in milliwatts

- **maxLimit** – Reference in which to return the maximum power management limit in milliwatts


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _minLimit_ and _maxLimit_ have been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _minLimit_ or _maxLimit_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerManagementMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*mode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv432nvmlDeviceGetPowerManagementMode12nvmlDevice_tP17nvmlEnableState_t "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000024)

This API has been deprecated.

Retrieves the power management mode associated with this device.

For products from the Fermi family.

- Requires _NVML\_INFOROM\_POWER_ version 3.0 or higher.


For from the Kepler or newer families.

- Does not require _NVML\_INFOROM\_POWER_ object.


This flag indicates whether any power management algorithm is currently active on the device. An enabled state does not necessarily mean the device is being actively throttled &#8212; only that that the driver will do so if the appropriate conditions are met.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on allowed modes.

Parameters:

- **device** – The identifier of the target device

- **mode** – Reference in which to return the current power management mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _mode_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _mode_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerMizerMode\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDevicePowerMizerModes\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlDevicePowerMizerModes__v1__t.html#_CPPv430nvmlDevicePowerMizerModes_v1_t "nvmlDevicePowerMizerModes_v1_t")\*powerMizerMode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceGetPowerMizerMode_v112nvmlDevice_tP30nvmlDevicePowerMizerModes_v1_t "Link to this definition")

Retrieves current power mizer mode on this device.

PowerMizerMode provides a hint to the driver as to how to manage the performance of the GPU.

For Maxwell or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **powerMizerMode** – Reference in which to return the power mizer mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _powerMizerMode_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _powerMizerMode_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support powerMizerMode readings

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerSource(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPowerSource\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlPowerSource_t "nvmlPowerSource_t")\*powerSource_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetPowerSource12nvmlDevice_tP17nvmlPowerSource_t "Link to this definition")

Gets the devices power source.

Parameters:

- **device** – The identifier of the target device

- **powerSource** – The power source of the device


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the current power source was successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _powerSource_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerState(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPstates\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv413nvmlPstates_t "nvmlPstates_t")\*pState_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv423nvmlDeviceGetPowerState12nvmlDevice_tP13nvmlPstates_t "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000023)

Use [nvmlDeviceGetPerformanceState](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga83a309f33edeb1ad287c720e316155b4). This function exposes an incorrect generalization.

Retrieve the current performance state for the device.

For Fermi or newer fully supported devices.

See [nvmlPstates\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga9de0cdfc67dfc2704b86344a7d5dc4fb) for details on allowed performance states.

Parameters:

- **device** – The identifier of the target device

- **pState** – Reference in which to return the performance state reading


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pState_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pState_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetPowerUsage(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*power_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv423nvmlDeviceGetPowerUsage12nvmlDevice_tPj "Link to this definition")

Retrieves power usage for this GPU in milliwatts and its associated circuitry (e.g.

memory)

For Fermi or newer fully supported devices.

On Fermi and Kepler GPUs the reading is accurate to within +/- 5% of current power draw. On Ampere (except GA100) or newer GPUs, the API returns power averaged over 1 sec interval. On GA100 and older architectures, instantaneous power is returned.

See [NVML\_FI\_DEV\_POWER\_AVERAGE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueEnums.html#group__nvmlfieldvalueenums_1ga19935a0f62fc5469f8753c2192f0d00e) and [NVML\_FI\_DEV\_POWER\_INSTANT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueEnums.html#group__nvmlfieldvalueenums_1gabdb189dbfd524efbe7cfa82c7f35f843) to query specific power values.

It is only available if power management mode is supported. See [nvmlDeviceGetPowerManagementMode](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga5576e74f8666b7e73ba851fceaea44a7).

Parameters:

- **device** – The identifier of the target device

- **power** – Reference in which to return the power usage information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _power_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _power_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support power readings

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetProcessUtilization(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlProcessUtilizationSample\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlProcessUtilizationSample__t.html#_CPPv430nvmlProcessUtilizationSample_t "nvmlProcessUtilizationSample_t")\*utilization_,_unsignedint\*processSamplesCount_,_unsignedlonglonglastSeenTimeStamp_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetProcessUtilization12nvmlDevice_tP30nvmlProcessUtilizationSample_tPjy "Link to this definition")

Retrieves the current utilization and process ID.

For Maxwell or newer fully supported devices.

Reads recent utilization of GPU SM (3D/Compute), framebuffer, video encoder, and video decoder for processes running. Utilization values are returned as an array of utilization sample structures in the caller-supplied buffer pointed at by _utilization_. One utilization sample structure is returned per process running, that had some non-zero utilization during the last sample period. It includes the CPU timestamp at which the samples were recorded. Individual utilization values are returned as “unsigned int” values. If no valid sample entries are found since the lastSeenTimeStamp, NVML\_ERROR\_NOT\_FOUND is returned.

To read utilization values, first determine the size of buffer required to hold the samples by invoking the function with _utilization_ set to NULL. The caller should allocate a buffer of size processSamplesCount \* sizeof(nvmlProcessUtilizationSample\_t). Invoke the function again with the allocated buffer passed in _utilization_, and _processSamplesCount_ set to the number of entries the buffer is sized for.

On successful return, the function updates _processSamplesCount_ with the number of process utilization sample structures that were actually written. This may differ from a previously read value as instances are created or destroyed.

lastSeenTimeStamp represents the CPU timestamp in microseconds at which utilization samples were last read. Set it to 0 to read utilization based on all the samples maintained by the driver’s internal sample buffer. Set lastSeenTimeStamp to a timeStamp retrieved from a previous query to read utilization since the previous query.

Note

On MIG-enabled GPUs, querying process utilization is not currently supported.

Parameters:

- **device** – The identifier of the target device

- **utilization** – Pointer to caller-supplied buffer in which guest process utilization samples are returned

- **processSamplesCount** – Pointer to caller-supplied array size, and returns number of processes running

- **lastSeenTimeStamp** – Return only samples with timestamp greater than lastSeenTimeStamp.


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _utilization_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _utilization_ is NULL, or _samplingPeriodUs_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if sample entries are not found

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetProcessesUtilizationInfo(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlProcessesUtilizationInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv430nvmlProcessesUtilizationInfo_t "nvmlProcessesUtilizationInfo_t")\*procesesUtilInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv437nvmlDeviceGetProcessesUtilizationInfo12nvmlDevice_tP30nvmlProcessesUtilizationInfo_t "Link to this definition")

Retrieves the recent utilization and process ID for all running processes.

For Maxwell or newer fully supported devices.

Reads recent utilization of GPU SM (3D/Compute), framebuffer, video encoder, and video decoder, jpeg decoder, OFA (Optical Flow Accelerator) for all running processes. Utilization values are returned as an array of utilization sample structures in the caller-supplied buffer pointed at by _procesesUtilInfo->procUtilArray_. One utilization sample structure is returned per process running, that had some non-zero utilization during the last sample period. It includes the CPU timestamp at which the samples were recorded. Individual utilization values are returned as “unsigned int” values.

The caller should allocate a buffer of size processSamplesCount \* sizeof(nvmlProcessUtilizationInfo\_t). If the buffer is too small, the API will return _NVML\_ERROR\_INSUFFICIENT\_SIZE_, with the recommended minimal buffer size at _procesesUtilInfo->processSamplesCount_. The caller should invoke the function again with the allocated buffer passed in _procesesUtilInfo->procUtilArray_, and _procesesUtilInfo->processSamplesCount_ set to the number no less than the recommended value by the previous API return.

On successful return, the function updates _procesesUtilInfo->processSamplesCount_ with the number of process utilization info structures that were actually written. This may differ from a previously read value as instances are created or destroyed.

_procesesUtilInfo->lastSeenTimeStamp_ represents the CPU timestamp in microseconds at which utilization samples were last read. Set it to 0 to read utilization based on all the samples maintained by the driver’s internal sample buffer. Set _procesesUtilInfo->lastSeenTimeStamp_ to a timeStamp retrieved from a previous query to read utilization since the previous query.

_procesesUtilInfo->version_ is the version number of the structure nvmlProcessesUtilizationInfo\_t, the caller should set the correct version number to retrieve the specific version of processes utilization information.

Note

On MIG-enabled GPUs, querying process utilization is not currently supported.

Parameters:

- **device** – The identifier of the target device

- **procesesUtilInfo** – Pointer to the caller-provided structure of nvmlProcessesUtilizationInfo\_t.


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If _procesesUtilInfo->procUtilArray_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ is invalid, or _procesesUtilInfo_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the device does not support this feature

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) If sample entries are not found

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) If the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the version of _procesesUtilInfo_ is invalid

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) If _procesesUtilInfo->procUtilArray_ is NULL, or the buffer size of procesesUtilInfo->procUtilArray is too small. The caller should check the minimul array size from the returned procesesUtilInfo->processSamplesCount, and call the function again with a buffer no smaller than procesesUtilInfo->processSamplesCount \* sizeof(nvmlProcessUtilizationInfo\_t)

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) On any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetRemappedRows(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*corrRows_,_unsignedint\*uncRows_,_unsignedint\*isPending_,_unsignedint\*failureOccurred_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetRemappedRows12nvmlDevice_tPjPjPjPj "Link to this definition")

Get number of remapped rows.

The number of rows reported will be based on the cause of the remapping. isPending indicates whether or not there are pending remappings. A reset will be required to actually remap the row. failureOccurred will be set if a row remapping ever failed in the past. A pending remapping won’t affect future work on the GPU since error-containment and dynamic page blacklisting will take care of that.

For Ampere or newer fully supported devices.

Note

On MIG-enabled GPUs with active instances, querying the number of remapped rows is not supported

Parameters:

- **device** – The identifier of the target device

- **corrRows** – Reference for number of rows remapped due to correctable errors

- **uncRows** – Reference for number of rows remapped due to uncorrectable errors

- **isPending** – Reference for whether or not remappings are pending

- **failureOccurred** – Reference that is set when a remapping has failed in the past


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) Upon success

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _corrRows_, _uncRows_, _isPending_ or _failureOccurred_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If MIG is enabled or if the device doesn’t support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) Unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetRemappedRows\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlRemappedRowsInfo\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlRemappedRowsInfo__v2__t.html#_CPPv425nvmlRemappedRowsInfo_v2_t "nvmlRemappedRowsInfo_v2_t")\*info_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetRemappedRows_v212nvmlDevice_tP25nvmlRemappedRowsInfo_v2_t "Link to this definition")

Get the status of row remapper.

For Ampere or newer fully supported devices.

Note

On MIG-enabled GPUs with active instances, querying the number of remapped rows is not supported

Parameters:

- **device** – The identifier of the target device

- **info** – Reference for _nvmlRemappedRowsInfo\_v2\_t_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) Upon success

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _info_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If MIG is enabled or if the device doesn’t support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) Unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetRetiredPages(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPageRetirementCause\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv425nvmlPageRetirementCause_t "nvmlPageRetirementCause_t") cause_,_unsignedint\*pageCount_,_unsignedlonglong\*addresses_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetRetiredPages12nvmlDevice_t25nvmlPageRetirementCause_tPjPy "Link to this definition")

Returns the list of retired pages by source, including pages that are pending retirement The address information provided from this API is the hardware address of the page that was retired.

Note that this does not match the virtual address used in CUDA, but will match the address information in Xid 63

For Kepler or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **cause** – Filter page addresses by cause of retirement

- **pageCount** – Reference in which to provide the _addresses_ buffer size, and to return the number of retired pages that match _cause_ Set to 0 to query the size without allocating an _addresses_ buffer

- **addresses** – Buffer to write the page addresses into


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pageCount_ was populated and _addresses_ was filled

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _pageCount_ indicates the buffer is not large enough to store all the matching page addresses. _pageCount_ is set to the needed size.

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _pageCount_ is NULL, _cause_ is invalid, or _addresses_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device doesn’t support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetRetiredPagesPendingStatus(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t")\*isPending_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv438nvmlDeviceGetRetiredPagesPendingStatus12nvmlDevice_tP17nvmlEnableState_t "Link to this definition")

Check if any pages are pending retirement and need a reboot to fully retire.

For Kepler or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **isPending** – Reference in which to return the pending status


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _isPending_ was populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _isPending_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device doesn’t support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetRetiredPages\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPageRetirementCause\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv425nvmlPageRetirementCause_t "nvmlPageRetirementCause_t") cause_,_unsignedint\*pageCount_,_unsignedlonglong\*addresses_,_unsignedlonglong\*timestamps_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetRetiredPages_v212nvmlDevice_t25nvmlPageRetirementCause_tPjPyPy "Link to this definition")

Returns the list of retired pages by source, including pages that are pending retirement The address information provided from this API is the hardware address of the page that was retired.

Note that this does not match the virtual address used in CUDA, but will match the address information in Xid 63

For Kepler or newer fully supported devices.

Note

nvmlDeviceGetRetiredPages\_v2 adds an additional timestamps parameter to return the time of each page’s retirement. This is supported for Pascal and newer architecture.

Parameters:

- **device** – The identifier of the target device

- **cause** – Filter page addresses by cause of retirement

- **pageCount** – Reference in which to provide the _addresses_ buffer size, and to return the number of retired pages that match _cause_ Set to 0 to query the size without allocating an _addresses_ buffer

- **addresses** – Buffer to write the page addresses into

- **timestamps** – Buffer to write the timestamps of page retirement, additional for \_v2


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pageCount_ was populated and _addresses_ was filled

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _pageCount_ indicates the buffer is not large enough to store all the matching page addresses. _pageCount_ is set to the needed size.

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _pageCount_ is NULL, _cause_ is invalid, or _addresses_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device doesn’t support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetRowRemapperHistogram(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlRowRemapperHistogramValues\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlRowRemapperHistogramValues__t.html#_CPPv432nvmlRowRemapperHistogramValues_t "nvmlRowRemapperHistogramValues_t")\*values_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv433nvmlDeviceGetRowRemapperHistogram12nvmlDevice_tP32nvmlRowRemapperHistogramValues_t "Link to this definition")

Get the row remapper histogram.

Returns the remap availability for each bank on the GPU.

Parameters:

- **device** – Device handle

- **values** – Histogram values


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) On success

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) On any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetRunningProcessDetailList(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlProcessDetailList\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv423nvmlProcessDetailList_t "nvmlProcessDetailList_t")\*plist_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv437nvmlDeviceGetRunningProcessDetailList12nvmlDevice_tP23nvmlProcessDetailList_t "Link to this definition")

Get information about running processes on a device for input context.

For Hopper or newer fully supported devices.

This function returns information only about running processes (e.g. CUDA application which have active context).

To determine the size of the _plist->procArray_ array to allocate, call the function with _plist->numProcArrayEntries_ set to zero and _plist->procArray_ set to NULL. The return code will be either NVML\_ERROR\_INSUFFICIENT\_SIZE (if there are valid processes of type _plist->mode_ to report on, in which case the _plist->numProcArrayEntries_ field will indicate the required number of entries in the array) or NVML\_SUCCESS (if no processes of type _plist->mode_ exist).

The usedGpuMemory field returned is all of the memory used by the application. The usedGpuCcProtectedMemory field returned is all of the protected memory used by the application.

Keep in mind that information returned by this call is dynamic and the number of elements might change in time. Allocate more space for _plist->procArray_ table in case new processes are spawned.

Note

In MIG mode, if device handle is provided, the API returns aggregate information, only if the caller has appropriate privileges. Per-instance information can be queried by using specific MIG device handles. Querying per-instance information using MIG device handles is not supported if the device is in vGPU Host virtualization mode. Protected memory usage is currently not available in MIG mode and in windows.

Parameters:

- **device** – The device handle or MIG device handle

- **plist** – Reference in which to process detail list _plist->version_ The api version _plist->mode_ The process mode _plist->procArray_ Reference in which to return the process information _plist->numProcArrayEntries_ Proc array size of returned entries


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _plist->numprocArrayEntries_ and _plist->procArray_ have been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _plist->numprocArrayEntries_ indicates that the _plist->procArray_ is too small _plist->numprocArrayEntries_ will contain minimal amount of space necessary for the call to complete

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _plist_ is NULL, _plist->version_ is invalid, _plist->mode_ is invalid,

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by _device_

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSamples(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlSamplingType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv418nvmlSamplingType_t "nvmlSamplingType_t") type_,_unsignedlonglonglastSeenTimeStamp_,_[nvmlValueType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv415nvmlValueType_t "nvmlValueType_t")\*sampleValType_,_unsignedint\*sampleCount_,_[nvmlSample\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlSample__t.html#_CPPv412nvmlSample_t "nvmlSample_t")\*samples_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv420nvmlDeviceGetSamples12nvmlDevice_t18nvmlSamplingType_tyP15nvmlValueType_tPjP12nvmlSample_t "Link to this definition")

Gets recent samples for the GPU.

For Kepler or newer fully supported devices.

Based on type, this method can be used to fetch the power, utilization or clock samples maintained in the buffer by the driver.

Power, Utilization and Clock samples are returned as type “unsigned int” for the union [nvmlValue\_t](https://docs.nvidia.com/deploy/nvml-api/api/unionnvmlValue__t.html#unionnvmlvalue__t).

To get the size of samples that user needs to allocate, the method is invoked with samples set to NULL. The returned samplesCount will provide the number of samples that can be queried. The user needs to allocate the buffer with size as samplesCount \* sizeof(nvmlSample\_t).

lastSeenTimeStamp represents CPU timestamp in microseconds. Set it to 0 to fetch all the samples maintained by the underlying buffer. Set lastSeenTimeStamp to one of the timeStamps retrieved from the date of the previous query to get more recent samples.

This method fetches the number of entries which can be accommodated in the provided samples array, and the reference samplesCount is updated to indicate how many samples were actually retrieved. The advantage of using this method for samples in contrast to polling via existing methods is to get get higher frequency data at lower polling cost.

Note

On MIG-enabled GPUs, querying the following sample types, NVML\_GPU\_UTILIZATION\_SAMPLES, NVML\_MEMORY\_UTILIZATION\_SAMPLES NVML\_ENC\_UTILIZATION\_SAMPLES and NVML\_DEC\_UTILIZATION\_SAMPLES, is not currently supported.

Parameters:

- **device** – The identifier for the target device

- **type** – Type of sampling event

- **lastSeenTimeStamp** – Return only samples with timestamp greater than lastSeenTimeStamp.

- **sampleValType** – Output parameter to represent the type of sample value as described in nvmlSampleVal\_t

- **sampleCount** – Reference to provide the number of elements which can be queried in samples array

- **samples** – Reference in which samples are returned


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if samples are successfully retrieved

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _samplesCount_ is NULL or reference to _sampleCount_ is 0 for non null _samples_

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if sample entries are not found

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSerial(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_char\*serial_,_unsignedintlength_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv419nvmlDeviceGetSerial12nvmlDevice_tPcj "Link to this definition")

Retrieves the globally unique board serial number associated with this device’s board.

For all products with an inforom.

The serial number is an alphanumeric string that will not exceed 30 characters (including the NULL terminator). This number matches the serial number tag that is physically attached to the board. See nvmlConstants::NVML\_DEVICE\_SERIAL\_BUFFER\_SIZE.

Parameters:

- **device** – The identifier of the target device

- **serial** – Reference in which to return the board/module serial number

- **length** – The maximum allowed length of the string returned in _serial_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _serial_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _serial_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSramEccErrorStatus(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEccSramErrorStatus\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv424nvmlEccSramErrorStatus_t "nvmlEccSramErrorStatus_t")\*status_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceGetSramEccErrorStatus12nvmlDevice_tP24nvmlEccSramErrorStatus_t "Link to this definition")

Get SRAM ECC error status of this device.

For Ampere or newer fully supported devices. Requires root/admin permissions.

See [nvmlEccSramErrorStatus\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlEccSramErrorStatus__v1__t.html#structnvmleccsramerrorstatus__v1__t) for more information on the struct.

Parameters:

- **device** – The identifier of the target device

- **status** – Returns SRAM ECC error status


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If _limit_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ is invalid or _counters_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) If the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the version of _nvmlEccSramErrorStatus\_t_ is invalid

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) On any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSramUniqueUncorrectedEccErrorCounts(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEccSramUniqueUncorrectedErrorCounts\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv441nvmlEccSramUniqueUncorrectedErrorCounts_t "nvmlEccSramUniqueUncorrectedErrorCounts_t")\*errorCounts_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv448nvmlDeviceGetSramUniqueUncorrectedEccErrorCounts12nvmlDevice_tP41nvmlEccSramUniqueUncorrectedErrorCounts_t "Link to this definition")

Retrieves the counts of SRAM unique uncorrected ECC errors.

For Blackwell or newer fully supported devices.

Reads SRAM unique uncorrected ECC error counts. The total number of unique errors is returned by _errorCounts->entryCount_. Error counts are returned as an array of in the caller-supplied buffer pointed at by _errorCounts->entries_. Each error count entry holds the location/address of the unique error, the error count and whether the error is parity or not.

To read SRAM unique uncorrected ECC error counts, first determine the size of buffer required to hold the error counts by invoking the function with _errorCounts->entries_ set to NULL. The required array size is returned in _errorCounts->entryCount_

. The caller should allocate a buffer of size “errorCounts->entryCount \*

sizeof(nvmlEccSramUniqueUncorrectedErrorCounts\_t)”. Invoke the function again with the allocated buffer passed in

_errorCounts->entries_. This time _errorCounts->entryCount_ will be taken as the entry array size that caller allocates for _errorCounts->entries_.

On successful return of the second query, the function updates _errorCounts->entries_ with all unique errors. This may fail if _errorCounts->entryCount_ is smaller than the actual number of unique errors. This can happen in cases like new errors occur since the previous query of _errorCounts->entryCount_. No matter the query succeeds or not, the latest number of unique errors will be returned in _errorCounts->entryCount_.

Note

The query is only supported when ECC mode is enabled.

Parameters:

- **device** – The identifier of the target device

- **errorCounts** – Pointer to caller-supplied array which returns the unique error count entries


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _utilization_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _errorCounts->entryCount_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature or ECC mods is not enabled

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if the allocated error entry array is not big enough

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSupportedClocksEventReasons(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedlonglong\*supportedClocksEventReasons_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv440nvmlDeviceGetSupportedClocksEventReasons12nvmlDevice_tPy "Link to this definition")

Retrieves bitmask of supported clocks event reasons that can be returned by [nvmlDeviceGetCurrentClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga880d8166732d6db9f24419dbff9fee03).

For all fully supported products.

This method is not supported in virtual machines running virtual GPU (vGPU).

See also

[NvmlClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlClocksEventReasons.html#group__nvmlclockseventreasons)

See also

[nvmlDeviceGetCurrentClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga880d8166732d6db9f24419dbff9fee03)

Parameters:

- **device** – The identifier of the target device

- **supportedClocksEventReasons** – Reference in which to return bitmask of supported clocks event reasons


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _supportedClocksEventReasons_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _supportedClocksEventReasons_ is NULL

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSupportedClocksThrottleReasons(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedlonglong\*supportedClocksThrottleReasons_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv443nvmlDeviceGetSupportedClocksThrottleReasons12nvmlDevice_tPy "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000022)

Use [nvmlDeviceGetSupportedClocksEventReasons](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga712f3716df87ac72898939d1806f2b90) instead

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSupportedGraphicsClocks(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedintmemoryClockMHz_,_unsignedint\*count_,_unsignedint\*clocksMHz_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv436nvmlDeviceGetSupportedGraphicsClocks12nvmlDevice_tjPjPj "Link to this definition")

Retrieves the list of possible graphics clocks that can be used as an argument for [nvmlDeviceSetGpuLockedClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga93b815f72dda73104e00decd878e416a).

For Kepler or newer fully supported devices.

See also

[nvmlDeviceSetGpuLockedClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga93b815f72dda73104e00decd878e416a)

Parameters:

- **device** – The identifier of the target device

- **memoryClockMHz** – Memory clock for which to return possible graphics clocks

- **count** – Reference in which to provide the _clocksMHz_ array size, and to return the number of elements

- **clocksMHz** – Reference in which to return the clocks in MHz


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _count_ and _clocksMHz_ have been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_NOT\_FOUND](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa1bfb13c6d0f00249b20f556c2d5d23f) if the specified _memoryClockMHz_ is not a supported frequency

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _clock_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _count_ is too small

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSupportedMemoryClocks(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedint\*count_,_unsignedint\*clocksMHz_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv434nvmlDeviceGetSupportedMemoryClocks12nvmlDevice_tPjPj "Link to this definition")

Retrieves the list of possible memory clocks that can be used as an argument for [nvmlDeviceSetMemoryLockedClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1gaa4d0070f514e8ffd06270970897b18fa).

For Kepler or newer fully supported devices.

See also

[nvmlDeviceSetMemoryLockedClocks](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1gaa4d0070f514e8ffd06270970897b18fa)

Parameters:

- **device** – The identifier of the target device

- **count** – Reference in which to provide the _clocksMHz_ array size, and to return the number of elements

- **clocksMHz** – Reference in which to return the clock in MHz


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _count_ and _clocksMHz_ have been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _count_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _count_ is too small ( _count_ is set to the number of required elements)

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetSupportedPerformanceStates(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPstates\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv413nvmlPstates_t "nvmlPstates_t")\*pstates_,_unsignedintsize_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv439nvmlDeviceGetSupportedPerformanceStates12nvmlDevice_tP13nvmlPstates_tj "Link to this definition")

Get all supported Performance States (P-States) for the device.

The returned array would contain a contiguous list of valid P-States supported by the device. If the number of supported P-States is fewer than the size of the array supplied missing elements would contain _NVML\_PSTATE\_UNKNOWN_.

The number of elements in the returned list will never exceed _NVML\_MAX\_GPU\_PERF\_PSTATES_.

Parameters:

- **device** – The identifier of the target device

- **pstates** – Container to return the list of performance states supported by device

- **size** – Size of the supplied _pstates_ array in bytes


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pstates_ array has been retrieved

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if the the container supplied was not large enough to hold the resulting list

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ or _pstates_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support performance state readings

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTargetFanSpeed(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedintfan_,_unsignedint\*targetSpeed_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetTargetFanSpeed12nvmlDevice_tjPj "Link to this definition")

Retrieves the intended target speed of the device’s specified fan.

Normally, the driver dynamically adjusts the fan based on the needs of the GPU. But when user set fan speed using nvmlDeviceSetFanSpeed\_v2, the driver will attempt to make the fan achieve the setting in nvmlDeviceSetFanSpeed\_v2. The actual current speed of the fan is reported in nvmlDeviceGetFanSpeed\_v2.

For all discrete products with dedicated fans.

The fan speed is expressed as a percentage of the product’s maximum noise tolerance fan speed. This value may exceed 100% in certain cases.

Parameters:

- **device** – The identifier of the target device

- **fan** – The index of the target fan, zero indexed.

- **targetSpeed** – Reference in which to return the fan speed percentage


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _speed_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _fan_ is not an acceptable index, or _speed_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have a fan or is newer than Maxwell

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTemperature(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlTemperatureSensors\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv424nvmlTemperatureSensors_t "nvmlTemperatureSensors_t") sensorType_,_unsignedint\*temp_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceGetTemperature12nvmlDevice_t24nvmlTemperatureSensors_tPj "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000020)

Use [nvmlDeviceGetTemperatureV](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac178b1164f60fa7ef7eeaec33dfb492c) instead

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTemperatureThreshold(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlTemperatureThresholds\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv427nvmlTemperatureThresholds_t "nvmlTemperatureThresholds_t") thresholdType_,_unsignedint\*temp_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv433nvmlDeviceGetTemperatureThreshold12nvmlDevice_t27nvmlTemperatureThresholds_tPj "Link to this definition")

Retrieves the temperature threshold for the GPU with the specified threshold type in degrees C.

For Kepler or newer fully supported devices.

See [nvmlTemperatureThresholds\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga78b44c4aca06cb6cd28f0444b91d3027) for details on available temperature thresholds.

Note: This API is no longer the preferred interface for retrieving the following temperature thresholds on Ada and later architectures: NVML\_TEMPERATURE\_THRESHOLD\_SHUTDOWN, NVML\_TEMPERATURE\_THRESHOLD\_SLOWDOWN, NVML\_TEMPERATURE\_THRESHOLD\_MEM\_MAX and NVML\_TEMPERATURE\_THRESHOLD\_GPU\_MAX.

Support for reading these temperature thresholds for Ada and later architectures would be removed from this API in future releases. Please use [nvmlDeviceGetFieldValues](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueQueries.html#group__nvmlfieldvaluequeries_1gab27cb6757098beca20fd7d9ca41cb422) with NVML\_FI\_DEV\_TEMPERATURE\_\* fields to retrieve temperature thresholds on these architectures.

Parameters:

- **device** – The identifier of the target device

- **thresholdType** – The type of threshold value queried

- **temp** – Reference in which to return the temperature reading


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _temp_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _thresholdType_ is invalid or _temp_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have a temperature sensor or is unsupported

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTemperatureV(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlTemperature\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv417nvmlTemperature_t "nvmlTemperature_t")\*temperature_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetTemperatureV12nvmlDevice_tP17nvmlTemperature_t "Link to this definition")

Retrieves the current temperature readings (in degrees C) for the given device.

For all products.

Parameters:

- **device** – **\[in\]** Target device identifier.

- **temperature** – **\[inout\]** Structure specifying the sensor type (input) and retrieved temperature value (output).


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _temp_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _sensorType_ is invalid or _temp_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not have the specified sensor

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetThermalSettings(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedintsensorIndex_,_[nvmlGpuThermalSettings\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlGpuThermalSettings__t.html#_CPPv424nvmlGpuThermalSettings_t "nvmlGpuThermalSettings_t")\*pThermalSettings_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetThermalSettings12nvmlDevice_tjP24nvmlGpuThermalSettings_t "Link to this definition")

Used to execute a list of thermal system instructions.

Parameters:

- **device** – The identifier of the target device

- **sensorIndex** – The index of the thermal sensor

- **pThermalSettings** – Reference in which to return the thermal sensor information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pThermalSettings_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _pThermalSettings_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTopologyCommonAncestor(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device1_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device2_,_[nvmlGpuTopologyLevel\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv422nvmlGpuTopologyLevel_t "nvmlGpuTopologyLevel_t")\*pathInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv435nvmlDeviceGetTopologyCommonAncestor12nvmlDevice_t12nvmlDevice_tP22nvmlGpuTopologyLevel_t "Link to this definition")

Retrieve the common ancestor for two devices For all products.

Supported on Linux only.

Parameters:

- **device1** – The identifier of the first device

- **device2** – The identifier of the second device

- **pathInfo** – A [nvmlGpuTopologyLevel\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#group__nvmldevicestructs_1ga5fd9890987e4b5768817dd64438e24f4) that gives the path type


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _pathInfo_ has been set

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device1_, or _device2_ is invalid, or _pathInfo_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device or OS does not support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) an error has occurred in underlying topology discovery


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTopologyNearestGpus(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlGpuTopologyLevel\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv422nvmlGpuTopologyLevel_t "nvmlGpuTopologyLevel_t") level_,_unsignedint\*count_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t")\*deviceArray_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv432nvmlDeviceGetTopologyNearestGpus12nvmlDevice_t22nvmlGpuTopologyLevel_tPjP12nvmlDevice_t "Link to this definition")

Retrieve the set of GPUs that are nearest to a given device at a specific interconnectivity level For all products.

Supported on Linux only.

Parameters:

- **device** – The identifier of the first device

- **level** – The [nvmlGpuTopologyLevel\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#group__nvmldevicestructs_1ga5fd9890987e4b5768817dd64438e24f4) level to search for other GPUs

- **count** – When zero, is set to the number of matching GPUs such that _deviceArray_ can be malloc’d. When non-zero, _deviceArray_ will be filled with _count_ number of device handles.

- **deviceArray** – An array of device handles for GPUs found at _level_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _deviceArray_ or _count_ (if initially zero) has been set

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_, _level_, or _count_ is invalid, or _deviceArray_ is NULL with a non-zero _count_

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device or OS does not support this feature

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) an error has occurred in underlying topology discovery


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTotalEccErrors(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlMemoryErrorType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv421nvmlMemoryErrorType_t "nvmlMemoryErrorType_t") errorType_,_[nvmlEccCounterType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv420nvmlEccCounterType_t "nvmlEccCounterType_t") counterType_,_unsignedlonglong\*eccCounts_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv427nvmlDeviceGetTotalEccErrors12nvmlDevice_t21nvmlMemoryErrorType_t20nvmlEccCounterType_tPy "Link to this definition")

Retrieves the total ECC error counts for the device.

For Fermi or newer fully supported devices. Only applicable to devices with ECC. Requires _NVML\_INFOROM\_ECC_ version 1.0 or higher. Requires ECC Mode to be enabled.

The total error count is the sum of errors across each of the separate memory systems, i.e. the total set of errors across the entire device.

See [nvmlMemoryErrorType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gac5469bd68b9fdcf78734471d86becb24)

for a description of available error types.

See

[nvmlEccCounterType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga08978d1c4fb52b6a4c72b39de144f1d9) for a description of available counter types.

See also

[nvmlDeviceClearEccErrorCounts()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceCommands.html#group__nvmldevicecommands_1ga92683374c66c6bb2fd4772262375a845)

Parameters:

- **device** – The identifier of the target device

- **errorType** – Flag that specifies the type of the errors.

- **counterType** – Flag that specifies the counter-type of the errors.

- **eccCounts** – Reference in which to return the specified ECC errors


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _eccCounts_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_, _errorType_ or _counterType_ is invalid, or _eccCounts_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetTotalEnergyConsumption(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedlonglong\*energy_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv435nvmlDeviceGetTotalEnergyConsumption12nvmlDevice_tPy "Link to this definition")

Retrieves total energy consumption for this GPU in millijoules (mJ) since the driver was last reloaded.

For Volta or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **energy** – Reference in which to return the energy consumption information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _energy_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _energy_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support energy readings

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetUUID(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_char\*uuid_,_unsignedintlength_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv417nvmlDeviceGetUUID12nvmlDevice_tPcj "Link to this definition")

Retrieves the globally unique immutable UUID associated with this device, as a 5 part hexadecimal string, that augments the immutable, board serial identifier.

For all products.

The UUID is a globally unique identifier. It is the only available identifier for pre-Fermi-architecture products. It does NOT correspond to any identifier printed on the board. It will not exceed 96 characters in length (including the NULL terminator). See nvmlConstants::NVML\_DEVICE\_UUID\_V2\_BUFFER\_SIZE.

When used with MIG device handles the API returns globally unique UUIDs which can be used to identify MIG devices across both GPU and MIG devices. UUIDs are immutable for the lifetime of a MIG device.

Parameters:

- **device** – The identifier of the target device

- **uuid** – Reference in which to return the GPU UUID

- **length** – The maximum allowed length of the string returned in _uuid_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _uuid_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _uuid_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetUtilizationRates(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlUtilization\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlUtilization__t.html#_CPPv417nvmlUtilization_t "nvmlUtilization_t")\*utilization_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlDeviceGetUtilizationRates12nvmlDevice_tP17nvmlUtilization_t "Link to this definition")

Retrieves the current utilization rates for the device’s major subsystems.

For Fermi or newer fully supported devices.

See [nvmlUtilization\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlUtilization__t.html#structnvmlutilization__t) for details on available utilization rates.

Note

During driver initialization when ECC is enabled one can see high GPU and Memory Utilization readings. This is caused by ECC Memory Scrubbing mechanism that is performed during driver initialization.

Note

On MIG-enabled GPUs, querying device utilization rates is not currently supported.

Parameters:

- **device** – The identifier of the target device

- **utilization** – Reference in which to return the utilization information


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _utilization_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _utilization_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetVbiosVersion(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_char\*version_,_unsignedintlength_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceGetVbiosVersion12nvmlDevice_tPcj "Link to this definition")

Get VBIOS version of the device.

For all products.

The VBIOS version may change from time to time. It will not exceed 32 characters in length (including the NULL terminator). See nvmlConstants::NVML\_DEVICE\_VBIOS\_VERSION\_BUFFER\_SIZE.

Parameters:

- **device** – The identifier of the target device

- **version** – Reference to which to return the VBIOS version

- **length** – The maximum allowed length of the string returned in _version_


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _version_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, or _version_ is NULL

- [NVML\_ERROR\_INSUFFICIENT\_SIZE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af7e0eae06744556cc832b7569489051f) if _length_ is too small

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceGetViolationStatus(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPerfPolicyType\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv420nvmlPerfPolicyType_t "nvmlPerfPolicyType_t") perfPolicyType_,_[nvmlViolationTime\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlViolationTime__t.html#_CPPv419nvmlViolationTime_t "nvmlViolationTime_t")\*violTime_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceGetViolationStatus12nvmlDevice_t20nvmlPerfPolicyType_tP19nvmlViolationTime_t "Link to this definition")

[Deprecated:](https://docs.nvidia.com/deploy/nvml-api/api/deprecated.html#deprecated_1_deprecated000026)

Use [nvmlDeviceGetFieldValues](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueQueries.html#group__nvmlfieldvaluequeries_1gab27cb6757098beca20fd7d9ca41cb422) to query this data. This API will be removed in CUDA 14.0.

Translations are as follows:

NVML\_PERF\_POLICY\_POWER -> NVML\_FI\_DEV\_CLOCKS\_EVENT\_REASON\_SW\_POWER\_CAP NVML\_PERF\_POLICY\_THERMAL -> NVML\_FI\_DEV\_CLOCKS\_EVENT\_REASON\_SW\_THERM\_SLOWDOWN NVML\_PERF\_POLICY\_SYNC\_BOOST -> NVML\_FI\_DEV\_CLOCKS\_EVENT\_REASON\_SYNC\_BOOST NVML\_PERF\_POLICY\_BOARD\_LIMIT -> NVML\_FI\_DEV\_PERF\_POLICY\_BOARD\_LIMIT NVML\_PERF\_POLICY\_LOW\_UTILIZATION -> NVML\_FI\_DEV\_PERF\_POLICY\_LOW\_UTILIZATION NVML\_PERF\_POLICY\_RELIABILITY -> NVML\_FI\_DEV\_PERF\_POLICY\_RELIABILITY NVML\_PERF\_POLICY\_TOTAL\_APP\_CLOCKS -> DEPRECATED, Do not use NVML\_PERF\_POLICY\_TOTAL\_BASE\_CLOCKS -> NVML\_FI\_DEV\_PERF\_POLICY\_TOTAL\_BASE\_CLOCKS

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceOnSameBoard(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device1_,_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device2_,_int\*onSameBoard_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv421nvmlDeviceOnSameBoard12nvmlDevice_t12nvmlDevice_tPi "Link to this definition")

Check if the GPU devices are on the same physical board.

For all fully supported products.

Parameters:

- **device1** – The first GPU device

- **device2** – The second GPU device

- **onSameBoard** – Reference in which to return the status. Non-zero indicates that the GPUs are on the same board.


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _onSameBoard_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _dev1_ or _dev2_ are invalid or _onSameBoard_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this check is not supported by the device

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the either GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDevicePerfMetricsGetSamples\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPerfMetricsSamples\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPerfMetricsSamples__v1__t.html#_CPPv427nvmlPerfMetricsSamples_v1_t "nvmlPerfMetricsSamples_v1_t")\*samples_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv434nvmlDevicePerfMetricsGetSamples_v112nvmlDevice_tP27nvmlPerfMetricsSamples_v1_t "Link to this definition")

Get Performance Metric samples.

See [nvmlPerfMetricsSamples\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPerfMetricsSamples__v1__t.html#structnvmlperfmetricssamples__v1__t) for more information on the struct.

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **samples** – **\[out\]** Reference to _[nvmlPerfMetricsSamples\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPerfMetricsSamples__v1__t.html#structnvmlperfmetricssamples__v1__t)_.


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the query is successful

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetAdaptiveTgpMode\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlEnableState_t "nvmlEnableState_t") mode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceSetAdaptiveTgpMode_v112nvmlDevice_t17nvmlEnableState_t "Link to this definition")

Request to enable or disable Adaptive TGP Mode for a GPU.

RUBIN\_OR\_NEWER% Requires root/admin privileges.

Adaptive TGP Mode assigns tailored power budgets to two binned GPU parts within the same module, reducing node-to-node and rack-to-rack performance variation. An out-of-band administrator policy may override the in-band request; use [nvmlDeviceGetAdaptiveTgpModeInfo\_v1](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac47e7e50af086ef87af288395c960cfe) to query the arbitrated state.

See also

[nvmlDeviceGetAdaptiveTgpModeInfo\_v1()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gac47e7e50af086ef87af288395c960cfe)

Parameters:

- **device** – The identifier of the target device

- **mode** – NVML\_FEATURE\_ENABLED or NVML\_FEATURE\_DISABLED


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the request was accepted

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _mode_ is not a valid [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86)

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support Adaptive TGP Mode

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the caller lacks root/admin privileges

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetClockOffsets(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlClockOffset\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv417nvmlClockOffset_t "nvmlClockOffset_t")\*info_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceSetClockOffsets12nvmlDevice_tP17nvmlClockOffset_t "Link to this definition")

Control current clock offset of some clock domain for a given PState.

For Maxwell or newer fully supported devices.

Requires privileged user.

Parameters:

- **device** – The identifier of the target device

- **info** – Structure specifying the clock type (input), the pstate (input) and clock offset value (input)


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If everything worked

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If the library has not been successfully initialized

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) If the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_, _type_ or _pstate_ are invalid or both _clockOffsetMHz_ is out of allowed range.

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the provided version is invalid/unsupported

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the device does not support this feature


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetConfComputeUnprotectedMemSize(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_unsignedlonglongsizeKiB_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv442nvmlDeviceSetConfComputeUnprotectedMemSize12nvmlDevice_ty "Link to this definition")

Set Conf Computing Unprotected Memory Size.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

- **device** – Device Handle

- **sizeKiB** – Unprotected Memory size to be set in KiB


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _sizeKiB_ successfully set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetDramEncryptionMode(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_const [nvmlDramEncryptionInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv424nvmlDramEncryptionInfo_t "nvmlDramEncryptionInfo_t")\*dramEncryption_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv431nvmlDeviceSetDramEncryptionMode12nvmlDevice_tPK24nvmlDramEncryptionInfo_t "Link to this definition")

Set the DRAM Encryption mode for the device.

For Kepler or newer fully supported devices. Only applicable to devices that support DRAM Encryption. Requires _NVML\_INFOROM\_DEN_ version 1.0 or higher. Requires root/admin permissions.

The DRAM Encryption mode determines whether the GPU enables its DRAM Encryption support.

This operation takes effect after the next reboot.

See [nvmlEnableState\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1ga11160f9605a87d03a59f987cccbd7b86) for details on available modes.

See also

[nvmlDeviceGetDramEncryptionMode()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gafd315fa191c49cc8c7f09fc77012bd16)

Parameters:

- **device** – The identifier of the target device

- **dramEncryption** – The target DRAM Encryption mode


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the DRAM Encryption mode was set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _DRAM_ Encryption is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) if the argument version is not supported

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetHostname\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlHostname\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlHostname__v1__t.html#_CPPv417nvmlHostname_v1_t "nvmlHostname_v1_t")\*hostname_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv424nvmlDeviceSetHostname_v112nvmlDevice_tP17nvmlHostname_v1_t "Link to this definition")

Set the hostname for the device.

For Blackwell or newer fully supported devices. Requires root/admin permissions. Supported on Linux only.

Sets a hostname string for the GPU device. This operation takes effect immediately.

The hostname is not stored persistently across GPU resets or driver reloads.

See also

[nvmlDeviceGetHostname\_v1()](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1gaabc5d886ae01b94218e1db022b067695)

Parameters:

- **device** – The identifier of the target device

- **hostname** – Reference to the caller-provided nvmlHostname\_v1\_t struct containing the hostname


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the hostname was set successfully

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _hostname_ is NULL or contains invalid characters

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetMemoryLimits\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlSetMemoryLimits\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlSetMemoryLimits__v1__t.html#_CPPv424nvmlSetMemoryLimits_v1_t "nvmlSetMemoryLimits_v1_t")\*limits_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv428nvmlDeviceSetMemoryLimits_v112nvmlDevice_tP24nvmlSetMemoryLimits_v1_t "Link to this definition")

Set the memory limits of the device for the cgroup partition.

This method will set the memory limits of the device for the specified cgroup partition. The limits will indicate the amount of memory that can be allocated for the device for use of an application in that cgroup.

For all products. For Linux only. Requires root/admin permissions.

Note

MIG handles are not supported

Parameters:

- **device** – **\[in\]** The identifier of the target device

- **limits** – **\[in\]** A pointer to [nvmlSetMemoryLimits\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlSetMemoryLimits__v1__t.html#structnvmlsetmemorylimits__v1__t) where the limits can be set


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if the operation was successful

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_NO\_PERMISSION](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a4be33cb660536c94725ef79cae0c277c) if the user doesn’t have permission to perform this operation

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid, _limits_ is NULL, the softLimit exceeds the hardLimit, or a limit exceeds total device memory

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_OPERATING\_SYSTEM](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aea1f781a65537a95b031adffdfbebf9c) if the cgroup path cannot be opened

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetPowerManagementLimit\_v2(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlPowerValue\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPowerValue__v2__t.html#_CPPv419nvmlPowerValue_v2_t "nvmlPowerValue_v2_t")\*powerValue_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv436nvmlDeviceSetPowerManagementLimit_v212nvmlDevice_tP19nvmlPowerValue_v2_t "Link to this definition")

Set new power limit of this device.

For Kepler or newer fully supported devices. Requires root/admin permissions.

See [nvmlDeviceGetPowerManagementLimitConstraints](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#group__nvmldevicequeries_1ga4a3abfe1a2bda62d409d7da96785b22b) to check the allowed ranges of values.

See [nvmlPowerValue\_v2\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlPowerValue__v2__t.html#structnvmlpowervalue__v2__t) for more information on the struct.

This API replaces nvmlDeviceSetPowerManagementLimit. It can be used as a drop-in replacement for the older version.

See also

[NVML\_FI\_DEV\_POWER\_AVERAGE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueEnums.html#group__nvmlfieldvalueenums_1ga19935a0f62fc5469f8753c2192f0d00e)

See also

[NVML\_FI\_DEV\_POWER\_INSTANT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueEnums.html#group__nvmlfieldvalueenums_1gabdb189dbfd524efbe7cfa82c7f35f843)

See also

[NVML\_FI\_DEV\_POWER\_MIN\_LIMIT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueEnums.html#group__nvmlfieldvalueenums_1gad0578fb933bbcfca54069e004883711e)

See also

[NVML\_FI\_DEV\_POWER\_MAX\_LIMIT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueEnums.html#group__nvmlfieldvalueenums_1ga2ec9c4ec8c573fc993c7e8921e0a88a9)

See also

[NVML\_FI\_DEV\_POWER\_CURRENT\_LIMIT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlFieldValueEnums.html#group__nvmlfieldvalueenums_1ga1540cbf42b17850b01c6eee814cc9160)

Note

Limit is not persistent across reboots or driver unloads. Enable persistent mode to prevent driver from unloading when no application is using the device.

Parameters:

- **device** – The identifier of the target device

- **powerValue** – Power management limit in milliwatts to set


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _limit_ has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _powerValue_ is NULL or contains invalid values

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceSetPowerMizerMode\_v1(_[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_,_[nvmlDevicePowerMizerModes\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlDevicePowerMizerModes__v1__t.html#_CPPv430nvmlDevicePowerMizerModes_v1_t "nvmlDevicePowerMizerModes_v1_t")\*powerMizerMode_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv430nvmlDeviceSetPowerMizerMode_v112nvmlDevice_tP30nvmlDevicePowerMizerModes_v1_t "Link to this definition")

Sets the new power mizer mode.

For Maxwell or newer fully supported devices.

Parameters:

- **device** – The identifier of the target device

- **powerMizerMode** – Reference in which to set the power mizer mode.


Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _powerMizerMode_ has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _powerMizerMode_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support powerMizerMode readings

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlDeviceValidateInforom( _[nvmlDevice\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceStructs.html#_CPPv412nvmlDevice_t "nvmlDevice_t") device_) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv425nvmlDeviceValidateInforom12nvmlDevice_t "Link to this definition")

Reads the infoROM from the flash and verifies the checksums.

For all products with an inforom.

Parameters:

**device** – The identifier of the target device

Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if infoROM is not corrupted

- [NVML\_ERROR\_CORRUPTED\_INFOROM](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a1feb6170c875e85346fc167c5725663a) if the device’s infoROM is corrupted

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) if the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlSystemGetConfComputeCapabilities(_[nvmlConfComputeSystemCaps\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlConfComputeSystemCaps__t.html#_CPPv427nvmlConfComputeSystemCaps_t "nvmlConfComputeSystemCaps_t")\*capabilities_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv436nvmlSystemGetConfComputeCapabilitiesP27nvmlConfComputeSystemCaps_t "Link to this definition")

Get Conf Computing System capabilities.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

**capabilities** – System CC capabilities

Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _capabilities_ were successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _capabilities_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlSystemGetConfComputeGpusReadyState(_unsignedint\*isAcceptingWork_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv438nvmlSystemGetConfComputeGpusReadyStatePj "Link to this definition")

Get Conf Computing GPUs ready state.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

return

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _current_ GPUs ready state were successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _isAcceptingWork_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device


Parameters:

**isAcceptingWork** – Returns GPU current work accepting state, NVML\_CC\_ACCEPTING\_CLIENT\_REQUESTS\_TRUE or NVML\_CC\_ACCEPTING\_CLIENT\_REQUESTS\_FALSE

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlSystemGetConfComputeKeyRotationThresholdInfo(_[nvmlConfComputeGetKeyRotationThresholdInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlConfidentialComputingDefs.html#_CPPv444nvmlConfComputeGetKeyRotationThresholdInfo_t "nvmlConfComputeGetKeyRotationThresholdInfo_t")\*pKeyRotationThrInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv448nvmlSystemGetConfComputeKeyRotationThresholdInfoP44nvmlConfComputeGetKeyRotationThresholdInfo_t "Link to this definition")

Get Conf Computing key rotation threshold detail.

For Hopper or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

**pKeyRotationThrInfo** – Reference in which to return the key rotation threshold data

Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _gpu_ key rotation threshold info has been populated

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _memory_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlSystemGetConfComputeSettings(_[nvmlSystemConfComputeSettings\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlConfidentialComputingDefs.html#_CPPv431nvmlSystemConfComputeSettings_t "nvmlSystemConfComputeSettings_t")\*settings_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv432nvmlSystemGetConfComputeSettingsP31nvmlSystemConfComputeSettings_t "Link to this definition")

Get Conf Computing System Settings.

For Hopper or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

**settings** – System CC settings

Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) If the query is success

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) If the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) If _device_ is invalid or _counters_ is NULL

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) If the device does not support this feature

- [NVML\_ERROR\_GPU\_IS\_LOST](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aeeab290c4ad003602d90e105a7fec88a) If the target GPU has fallen off the bus or is otherwise inaccessible

- [NVML\_ERROR\_ARGUMENT\_VERSION\_MISMATCH](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af162575a2487b7bc6429cdc19608562d) If the provided version is invalid/unsupported

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) On any unexpected error


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlSystemGetConfComputeState(_[nvmlConfComputeSystemState\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlConfComputeSystemState__t.html#_CPPv428nvmlConfComputeSystemState_t "nvmlConfComputeSystemState_t")\*state_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv429nvmlSystemGetConfComputeStateP28nvmlConfComputeSystemState_t "Link to this definition")

Get Conf Computing System State.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

Parameters:

**state** – System CC State

Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _state_ were successfully queried

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _state_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device


[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlSystemSetConfComputeGpusReadyState(_unsignedintisAcceptingWork_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv438nvmlSystemSetConfComputeGpusReadyStatej "Link to this definition")

Set Conf Computing GPUs ready state.

For Ampere or newer fully supported devices. Supported on Linux, Windows TCC.

return

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _current_ GPUs ready state is successfully set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _isAcceptingWork_ is invalid

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device


Parameters:

**isAcceptingWork** – GPU accepting new work, NVML\_CC\_ACCEPTING\_CLIENT\_REQUESTS\_TRUE or NVML\_CC\_ACCEPTING\_CLIENT\_REQUESTS\_FALSE

[nvmlReturn\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#_CPPv412nvmlReturn_t "nvmlReturn_t") nvmlSystemSetConfComputeKeyRotationThresholdInfo(_[nvmlConfComputeSetKeyRotationThresholdInfo\_t](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlConfidentialComputingDefs.html#_CPPv444nvmlConfComputeSetKeyRotationThresholdInfo_t "nvmlConfComputeSetKeyRotationThresholdInfo_t")\*pKeyRotationThrInfo_,) [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv448nvmlSystemSetConfComputeKeyRotationThresholdInfoP44nvmlConfComputeSetKeyRotationThresholdInfo_t "Link to this definition")

Set Conf Computing key rotation threshold.

For Hopper or newer fully supported devices. Supported on Linux, Windows TCC.

This function is to set the confidential compute key rotation threshold parameters. _pKeyRotationThrInfo->maxAttackerAdvantage_ should be in the range from NVML\_CC\_KEY\_ROTATION\_THRESHOLD\_ATTACKER\_ADVANTAGE\_MIN to NVML\_CC\_KEY\_ROTATION\_THRESHOLD\_ATTACKER\_ADVANTAGE\_MAX. Default value is 60.

Parameters:

**pKeyRotationThrInfo** – Reference to the key rotation threshold data

Returns:

- [NVML\_SUCCESS](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0aa24d587db29324840a89a40c00c727f3) if _key_ rotation threashold max attacker advantage has been set

- [NVML\_ERROR\_UNINITIALIZED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae054644f6612bf2ffb3f0e68379ec612) if the library has not been successfully initialized

- [NVML\_ERROR\_INVALID\_ARGUMENT](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a9658b0b4a4ced32a9148abb63d234aff) if _device_ is invalid or _memory_ is NULL

- [NVML\_ERROR\_INVALID\_STATE](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0a3f2afdcf44ad4c4fc8dcc6e8e87ec69f) if confidential compute GPU ready state is enabled

- [NVML\_ERROR\_NOT\_SUPPORTED](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0af9e8a97d37f2e4efdf330ef938663e81) if this query is not supported by the device

- [NVML\_ERROR\_UNKNOWN](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceEnums.html#group__nvmldeviceenums_1gga06fa9b5de08c6cc716fbf565e93dd3d0ae08ac94f623461b8f5156bbb2c1eeb2a) on any unexpected error


## Typedefs [\#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html\#id3 "Link to this heading")

typedef [nvmlTemperature\_v1\_t](https://docs.nvidia.com/deploy/nvml-api/api/structnvmlTemperature__v1__t.html#_CPPv420nvmlTemperature_v1_t "nvmlTemperature_v1_t") nvmlTemperature\_t [#](https://docs.nvidia.com/deploy/nvml-api/api/group__nvmlDeviceQueries.html#_CPPv417nvmlTemperature_t "Link to this definition")

On this page
