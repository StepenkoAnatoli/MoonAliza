#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <dxgi.h>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include "hardware.hpp"

namespace {
constexpr unsigned int MAX_ADAPTERS = 32;
static_assert(sizeof(SIZE_T) == 8, "Hardware capacity probing requires a 64-bit helper");

std::string quote(const std::wstring& value) {
  // Windows descriptions are bounded before conversion; invalid UTF-16 becomes U+FFFD.
  const int size = WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), nullptr, 0, nullptr, nullptr);
  std::string utf8(size, '\0');
  if (size) WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), utf8.data(), size, nullptr, nullptr);
  std::string result = "\"";
  constexpr char hex[] = "0123456789abcdef";
  for (unsigned char byte : utf8) {
    if (byte == '"' || byte == '\\') { result += '\\'; result += byte; }
    else if (byte < 32) { result += "\\u00"; result += hex[byte >> 4]; result += hex[byte & 15]; }
    else result += byte;
  }
  return result + "\"";
}

std::wstring registryString(const wchar_t* key, const wchar_t* name, size_t maximum) {
  std::vector<wchar_t> value(maximum + 1, L'\0');
  DWORD bytes = static_cast<DWORD>(value.size() * sizeof(wchar_t));
  if (RegGetValueW(HKEY_LOCAL_MACHINE, key, name, RRF_RT_REG_SZ | RRF_SUBKEY_WOW6464KEY,
      nullptr, value.data(), &bytes) != ERROR_SUCCESS || !bytes || bytes % sizeof(wchar_t)) return {};
  size_t length = 0;
  while (length < maximum && value[length]) ++length;
  return std::wstring(value.data(), length);
}

std::wstring systemDirectory() {
  wchar_t directory[32768]{};
  const UINT length = GetSystemDirectoryW(directory, 32768);
  return length && length < 32768 ? std::wstring(directory, length) : std::wstring();
}

// Only absolute, non-reparse paths beneath the OS/installer-owned locations are used.
// The caller obtains these locations from Windows APIs/HKLM, never PATH or cwd.
bool ordinaryAbsolutePath(const std::wstring& path) {
  if (path.size() < 4 || path[1] != L':' || path[2] != L'\\') return false;
  for (size_t end = 3; end <= path.size(); ++end) {
    if (end != path.size() && path[end] != L'\\') continue;
    const DWORD attributes = GetFileAttributesW(path.substr(0, end).c_str());
    if (attributes == INVALID_FILE_ATTRIBUTES || (attributes & FILE_ATTRIBUTE_REPARSE_POINT)) return false;
    if (end != path.size() && !(attributes & FILE_ATTRIBUTE_DIRECTORY)) return false;
    if (end == path.size() && (attributes & FILE_ATTRIBUTE_DIRECTORY)) return false;
  }
  return true;
}

HMODULE loadTrustedLibrary(const std::wstring& path, bool requireSignedTarget = true) {
  if (!ordinaryAbsolutePath(path)) return nullptr;
  // Restrict dependency resolution as well as the top-level DLL. Third-party
  // telemetry requires signature enforcement. The Windows DXGI library is loaded
  // only from System32: REQUIRE_SIGNED_TARGET rejects its valid catalog signature
  // on some supported installations (observed ERROR_INVALID_IMAGE_HASH).
  return LoadLibraryExW(path.c_str(), nullptr, LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR |
      LOAD_LIBRARY_SEARCH_SYSTEM32 | (requireSignedTarget ? LOAD_LIBRARY_REQUIRE_SIGNED_TARGET : 0));
}

struct Library {
  HMODULE handle;
  explicit Library(HMODULE value) : handle(value) {}
  ~Library() { if (handle) FreeLibrary(handle); }
  Library(const Library&) = delete;
  Library& operator=(const Library&) = delete;
};

// Current public NVML has no documented LUID lookup. Initialization is detected
// dynamically, but memory is intentionally not assigned by enumeration order or
// model name. Exact DXGI-to-NVML mapping must be implemented before using it.
std::string nvidiaTelemetryStatus(const std::wstring& system) {
  HMODULE handle = system.empty() ? nullptr : loadTrustedLibrary(system + L"\\nvml.dll");
  if (!handle) {
    const auto programFiles = registryString(L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion", L"ProgramFilesDir", 32760);
    if (!programFiles.empty()) handle = loadTrustedLibrary(programFiles + L"\\NVIDIA Corporation\\NVSMI\\nvml.dll");
  }
  Library library(handle);
  if (!handle) return "NVML_UNAVAILABLE";
  using Lifecycle = int (__cdecl*)();
  const auto initialize = reinterpret_cast<Lifecycle>(GetProcAddress(handle, "nvmlInit_v2"));
  const auto shutdown = reinterpret_cast<Lifecycle>(GetProcAddress(handle, "nvmlShutdown"));
  if (!initialize || !shutdown || initialize() != 0) return "NVML_UNAVAILABLE";
  shutdown();
  return "NVML_ADAPTER_IDENTITY_UNAVAILABLE";
}

std::string adapterId(const DXGI_ADAPTER_DESC1& descriptor) {
  // LUID is a local identity, not a permanent hardware serial. It can change on
  // reboot; qualification fingerprints therefore safely invalidate in that case.
  std::ostringstream id;
  id << "dxgi:" << std::hex << std::setfill('0') << std::setw(8) << descriptor.VendorId
     << ':' << std::setw(8) << descriptor.DeviceId << ':' << std::setw(8) << descriptor.SubSysId
     << ':' << std::setw(8) << descriptor.Revision << ':' << std::setw(8)
     << static_cast<uint32_t>(descriptor.AdapterLuid.HighPart) << std::setw(8) << descriptor.AdapterLuid.LowPart;
  return id.str();
}

const char* architecture(WORD value) {
  switch (value) {
    case PROCESSOR_ARCHITECTURE_AMD64: return "x64";
    case PROCESSOR_ARCHITECTURE_ARM64: return "arm64";
    case PROCESSOR_ARCHITECTURE_INTEL: return "x86";
    case PROCESSOR_ARCHITECTURE_ARM: return "arm";
    default: return "unknown";
  }
}
}

int inspectHardware() {
  MEMORYSTATUSEX memory{};
  memory.dwLength = sizeof(memory);
  if (!GlobalMemoryStatusEx(&memory) || !memory.ullTotalPhys || memory.ullAvailPhys > memory.ullTotalPhys) {
    std::cerr << "{\"status\":\"failed\",\"error\":\"HARDWARE_MEMORY_UNAVAILABLE\"}" << std::endl;
    return 2;
  }
  SYSTEM_INFO cpu{};
  GetNativeSystemInfo(&cpu);
  // Include all processor groups on large machines, not only this process's group.
  DWORD logicalProcessors = GetActiveProcessorCount(ALL_PROCESSOR_GROUPS);
  if (!logicalProcessors) logicalProcessors = cpu.dwNumberOfProcessors;
  auto name = registryString(L"HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", L"ProcessorNameString", 256);
  std::vector<std::string> warnings;
  if (name.empty()) { name = L"Unknown CPU"; warnings.push_back("CPU_NAME_UNAVAILABLE"); }
  const auto system = systemDirectory();
  Library dxgi(system.empty() ? nullptr : loadTrustedLibrary(system + L"\\dxgi.dll", false));
  using CreateFactory = HRESULT (WINAPI*)(REFIID, void**);
  const auto createFactory = dxgi.handle ? reinterpret_cast<CreateFactory>(GetProcAddress(dxgi.handle, "CreateDXGIFactory1")) : nullptr;
  IDXGIFactory1* factory = nullptr;
  std::ostringstream adapters;
  bool first = true;
  bool nvidia = false;
  if (!createFactory || FAILED(createFactory(__uuidof(IDXGIFactory1), reinterpret_cast<void**>(&factory)))) {
    warnings.push_back("DXGI_UNAVAILABLE");
  } else {
    for (unsigned int index = 0; index <= MAX_ADAPTERS; ++index) {
      IDXGIAdapter1* adapter = nullptr;
      const HRESULT result = factory->EnumAdapters1(index, &adapter);
      if (result == DXGI_ERROR_NOT_FOUND) break;
      if (FAILED(result) || !adapter) { warnings.push_back("DXGI_ENUMERATION_INCOMPLETE"); break; }
      if (index == MAX_ADAPTERS) { adapter->Release(); warnings.push_back("ADAPTER_LIMIT_REACHED"); break; }
      DXGI_ADAPTER_DESC1 descriptor{};
      if (FAILED(adapter->GetDesc1(&descriptor))) { adapter->Release(); warnings.push_back("ADAPTER_DESCRIPTION_UNAVAILABLE"); continue; }
      LARGE_INTEGER driver{};
      const bool hasDriver = SUCCEEDED(adapter->CheckInterfaceSupport(__uuidof(IDXGIDevice), &driver));
      adapter->Release();
      size_t descriptionLength = 0;
      while (descriptionLength < 128 && descriptor.Description[descriptionLength]) ++descriptionLength;
      if (!first) adapters << ',';
      first = false;
      const bool software = (descriptor.Flags & DXGI_ADAPTER_FLAG_SOFTWARE) != 0;
      nvidia = nvidia || (!software && descriptor.VendorId == 0x10de);
      adapters << "{\"id\":\"" << adapterId(descriptor) << "\",\"name\":"
        << quote(descriptionLength ? std::wstring(descriptor.Description, descriptionLength) : L"Unknown adapter")
        << ",\"vendorId\":" << descriptor.VendorId << ",\"deviceId\":" << descriptor.DeviceId
        << ",\"dedicatedBytes\":" << static_cast<uint64_t>(descriptor.DedicatedVideoMemory)
        << ",\"availableBytes\":null,\"driver\":";
      if (hasDriver) adapters << '"' << HIWORD(driver.HighPart) << '.' << LOWORD(driver.HighPart) << '.'
                              << HIWORD(driver.LowPart) << '.' << LOWORD(driver.LowPart) << '"';
      else adapters << "null";
      adapters << ",\"software\":" << (software ? "true" : "false") << '}';
    }
    factory->Release();
  }
  if (nvidia) warnings.push_back(nvidiaTelemetryStatus(system));
  // DXGI process budgets and shared system RAM cannot stand in for global free VRAM.
  if (!first) warnings.push_back("GLOBAL_FREE_VRAM_UNAVAILABLE");
  std::cout << "{\"schemaVersion\":1,\"totalRamBytes\":" << memory.ullTotalPhys
    << ",\"availableRamBytes\":" << memory.ullAvailPhys << ",\"cpu\":{\"architecture\":\""
    << architecture(cpu.wProcessorArchitecture) << "\",\"name\":" << quote(name)
    << ",\"logicalProcessors\":" << logicalProcessors << "},\"adapters\":[" << adapters.str() << "],\"warnings\":[";
  // The enumeration can report a failure per adapter. Keep the public bound even then.
  for (size_t index = 0; index < warnings.size() && index < 32; ++index) {
    if (index) std::cout << ',';
    std::cout << '"' << warnings[index] << '"';
  }
  std::cout << "]}" << std::endl;
  return 0;
}
