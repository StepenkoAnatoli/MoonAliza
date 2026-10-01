#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <string>
#include <vector>
#include <thread>
#include <atomic>
#include <iostream>
#include <cstdint>
#include <map>
#include "hardware.hpp"
#include "connection.hpp"

static bool readExact(HANDLE handle, void* value, DWORD size) {
  auto bytes = static_cast<unsigned char*>(value);
  while (size) { DWORD received = 0; if (!ReadFile(handle, bytes, size, &received, nullptr) || !received) return false; bytes += received; size -= received; }
  return true;
}
static bool readString(HANDLE handle, std::wstring& result) {
  uint32_t bytes = 0; if (!readExact(handle, &bytes, 4) || bytes > 262144 || bytes % 2) return false;
  result.resize(bytes / 2); return !bytes || readExact(handle, result.data(), bytes);
}
static std::string utf8(const std::wstring& value) {
  int length = WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), nullptr, 0, nullptr, nullptr);
  std::string result(length, 0); WideCharToMultiByte(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), result.data(), length, nullptr, nullptr); return result;
}
static std::string json(const std::wstring& value) {
  std::string result = "\"";
  for (unsigned char byte : utf8(value)) {
    if (byte == '"' || byte == '\\') { result += '\\'; result += byte; }
    else if (byte < 32) { const char* hex = "0123456789abcdef"; result += "\\u00"; result += hex[byte >> 4]; result += hex[byte & 15]; }
    else result += byte;
  }
  return result + "\"";
}
static int inspect(const wchar_t* path) {
  HANDLE file = CreateFileW(path, 0, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nullptr, OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS, nullptr);
  if (file == INVALID_HANDLE_VALUE) return 2;
  BY_HANDLE_FILE_INFORMATION info{};
  if (!GetFileInformationByHandle(file, &info) || !(info.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) { CloseHandle(file); return 2; }
  std::vector<wchar_t> buffer(32768);
  DWORD length = GetFinalPathNameByHandleW(file, buffer.data(), static_cast<DWORD>(buffer.size()), FILE_NAME_NORMALIZED | VOLUME_NAME_DOS); CloseHandle(file);
  if (!length || length >= buffer.size()) return 2;
  std::wstring finalPath(buffer.data(), length);
  std::vector<wchar_t> volume(32768);
  bool fixed = GetVolumePathNameW(finalPath.c_str(), volume.data(), static_cast<DWORD>(volume.size())) && GetDriveTypeW(volume.data()) == DRIVE_FIXED;
  if (finalPath.rfind(L"\\\\?\\UNC\\", 0) == 0) { finalPath = L"\\\\" + finalPath.substr(8); fixed = false; }
  else if (finalPath.rfind(L"\\\\?\\", 0) == 0) finalPath = finalPath.substr(4);
  std::cout << "{\"rootPath\":" << json(finalPath) << ",\"localFixed\":" << (fixed ? "true" : "false") << "}" << std::endl;
  return 0;
}
static int fail(const char* code) { std::cerr << "{\"status\":\"failed\",\"error\":\"" << code << "\"}" << std::endl; return 2; }

// Guard both the leaf and each ancestor against replacement until this owned host exits.
// A directory may still accept temporary files; it cannot be renamed or replaced by a junction.
struct ReadGuards {
  std::vector<HANDLE> handles;
  std::map<std::wstring, bool> names;
  ~ReadGuards() { for (HANDLE handle : handles) CloseHandle(handle); }
  bool take(const std::wstring& path, bool directory) {
    std::wstring key = path; CharLowerBuffW(key.data(), static_cast<DWORD>(key.size()));
    if (names.count(key)) return names.at(key) == directory;
    HANDLE handle = CreateFileW((L"\\\\?\\" + path).c_str(), directory ? FILE_READ_ATTRIBUTES : GENERIC_READ,
      directory ? FILE_SHARE_READ | FILE_SHARE_WRITE : FILE_SHARE_READ, nullptr, OPEN_EXISTING,
      FILE_FLAG_OPEN_REPARSE_POINT | (directory ? FILE_FLAG_BACKUP_SEMANTICS : 0), nullptr);
    if (handle == INVALID_HANDLE_VALUE) return false;
    BY_HANDLE_FILE_INFORMATION info{};
    if (!GetFileInformationByHandle(handle, &info) || (info.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT)
      || bool(info.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != directory || (!directory && info.nNumberOfLinks != 1)) {
      CloseHandle(handle); return false;
    }
    handles.push_back(handle); names.emplace(key, directory); return true;
  }
  bool file(const std::wstring& value) {
    // Only normalized local drive paths are admitted; no device paths or network shares.
    if (value.size() < 4 || !((value[0] >= L'A' && value[0] <= L'Z') || (value[0] >= L'a' && value[0] <= L'z'))
      || value[1] != L':' || value[2] != L'\\' || value.find(L'/') != std::wstring::npos || value.find(L'\0') != std::wstring::npos
      || GetDriveTypeW(value.substr(0, 3).c_str()) != DRIVE_FIXED) return false;
    if (!take(value.substr(0, 3), true)) return false;
    size_t start = 3;
    while (start < value.size()) {
      const size_t slash = value.find(L'\\', start);
      const std::wstring part = value.substr(start, slash == std::wstring::npos ? slash : slash - start);
      if (part.empty() || part == L"." || part == L".." || part.back() == L'.' || part.back() == L' ' || part.find_first_of(L":*?\"<>|") != std::wstring::npos) return false;
      if (slash == std::wstring::npos) return take(value, false);
      if (!take(value.substr(0, slash), true)) return false;
      start = slash + 1;
    }
    return false;
  }
};

int wmain(int argc, wchar_t** argv) {
  if (argc == 2 && std::wstring(argv[1]) == L"--hardware") return inspectHardware();
  if (argc == 3 && std::wstring(argv[1]) == L"--inspect-path") return inspect(argv[2]);
  if (argc > 1 && std::wstring(argv[1]) == L"--inspect-connection") return inspectConnection(argc, argv);
  bool reportStart = false, guarded = false;
  for (int i = 1; i < argc; ++i) {
    if (std::wstring(argv[i]) == L"--report-start" && !reportStart) reportStart = true;
    else if (std::wstring(argv[i]) == L"--guarded" && !guarded) guarded = true;
    else return fail("INVALID_MODE");
  }
  HANDLE owner = GetStdHandle(STD_INPUT_HANDLE);
  uint32_t timeout = 0; std::wstring executable, commandLine, cwd, environment;
  if (!readExact(owner, &timeout, 4) || !readString(owner, executable) || !readString(owner, commandLine) || !readString(owner, cwd) || !readString(owner, environment)) return fail("INVALID_PROTOCOL");
  if (timeout == 0 || timeout > 3600000 || executable.empty() || cwd.empty()) return fail("INVALID_REQUEST");
  ReadGuards guards;
  if (guarded) {
    uint32_t count = 0;
    if (!readExact(owner, &count, 4) || count == 0 || count > 2048) return fail("INVALID_GUARDS");
    for (uint32_t i = 0; i < count; ++i) {
      std::wstring path;
      if (!readString(owner, path) || !guards.file(path)) return fail("GUARD_FAILED");
    }
    std::cerr << "{\"event\":\"locked\"}" << std::endl;
    unsigned char admitted = 0;
    if (!readExact(owner, &admitted, 1) || admitted != 1) return fail("ADMISSION_CANCELLED");
  }
  HANDLE job = CreateJobObjectW(nullptr, nullptr);
  if (!job) return fail("JOB_CREATE_FAILED");
  JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits{}; limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
  if (!SetInformationJobObject(job, JobObjectExtendedLimitInformation, &limits, sizeof(limits))) { CloseHandle(job); return fail("JOB_CONFIG_FAILED"); }
  SECURITY_ATTRIBUTES attributes{ sizeof(SECURITY_ATTRIBUTES), nullptr, TRUE };
  HANDLE outputRead = nullptr, outputWrite = nullptr;
  if (!CreatePipe(&outputRead, &outputWrite, &attributes, 0)) { CloseHandle(job); return fail("PIPE_FAILED"); }
  SetHandleInformation(outputRead, HANDLE_FLAG_INHERIT, 0);
  HANDLE input = CreateFileW(L"NUL", GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, &attributes, OPEN_EXISTING, 0, nullptr);
  if (input == INVALID_HANDLE_VALUE) { CloseHandle(outputRead); CloseHandle(outputWrite); CloseHandle(job); return fail("STDIN_FAILED"); }
  SIZE_T attributeBytes = 0; InitializeProcThreadAttributeList(nullptr, 1, 0, &attributeBytes);
  std::vector<unsigned char> attributeBuffer(attributeBytes);
  STARTUPINFOEXW startup{}; startup.StartupInfo.cb = sizeof(startup);
  startup.lpAttributeList = reinterpret_cast<PPROC_THREAD_ATTRIBUTE_LIST>(attributeBuffer.data());
  if (!InitializeProcThreadAttributeList(startup.lpAttributeList, 1, 0, &attributeBytes)) return fail("HANDLE_LIST_FAILED");
  HANDLE inherited[] = { input, outputWrite };
  if (!UpdateProcThreadAttribute(startup.lpAttributeList, 0, PROC_THREAD_ATTRIBUTE_HANDLE_LIST, inherited, sizeof(inherited), nullptr, nullptr)) return fail("HANDLE_LIST_FAILED");
  startup.StartupInfo.dwFlags = STARTF_USESTDHANDLES;
  startup.StartupInfo.hStdInput = input; startup.StartupInfo.hStdOutput = outputWrite; startup.StartupInfo.hStdError = outputWrite;
  PROCESS_INFORMATION process{};
  environment.push_back(L'\0'); if (environment.size() == 1) environment.push_back(L'\0');
  BOOL created = CreateProcessW(executable.c_str(), commandLine.data(), nullptr, nullptr, TRUE, CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT | EXTENDED_STARTUPINFO_PRESENT | CREATE_NO_WINDOW, environment.data(), cwd.c_str(), &startup.StartupInfo, &process);
  DeleteProcThreadAttributeList(startup.lpAttributeList); CloseHandle(input); CloseHandle(outputWrite);
  if (!created) { CloseHandle(outputRead); CloseHandle(job); return fail("SPAWN_FAILED"); }
  if (!AssignProcessToJobObject(job, process.hProcess)) {
    TerminateProcess(process.hProcess, 1); WaitForSingleObject(process.hProcess, INFINITE); CloseHandle(process.hThread); CloseHandle(process.hProcess); CloseHandle(outputRead); CloseHandle(job); return fail("JOB_ASSIGN_FAILED");
  }
  if (reportStart) {
    FILETIME created{}, exited{}, kernel{}, user{};
    if (!GetProcessTimes(process.hProcess, &created, &exited, &kernel, &user)) {
      TerminateJobObject(job, 1); WaitForSingleObject(process.hProcess, INFINITE);
      CloseHandle(process.hThread); CloseHandle(process.hProcess); CloseHandle(outputRead); CloseHandle(job); return fail("PROCESS_IDENTITY_FAILED");
    }
    uint64_t birth = (uint64_t(created.dwHighDateTime) << 32) | created.dwLowDateTime;
    std::cerr << "{\"event\":\"started\",\"pid\":" << process.dwProcessId << ",\"createdAt\":\"" << birth << "\"}" << std::endl;
  }
  std::atomic<bool> cancelled{ false };
  std::thread control([owner, &cancelled]() { char byte; DWORD received; ReadFile(owner, &byte, 1, &received, nullptr); cancelled = true; }); control.detach();
  HANDLE destination = GetStdHandle(STD_OUTPUT_HANDLE);
  std::thread output([outputRead, destination]() {
    char bytes[16384]; DWORD count;
    while (ReadFile(outputRead, bytes, sizeof(bytes), &count, nullptr) && count) {
      DWORD position = 0;
      while (position < count) { DWORD written = 0; if (!WriteFile(destination, bytes + position, count - position, &written, nullptr) || !written) break; position += written; }
    }
    CloseHandle(outputRead);
  });
  bool timedOut = false; ULONGLONG start = GetTickCount64();
  if (ResumeThread(process.hThread) == static_cast<DWORD>(-1)) cancelled = true;
  CloseHandle(process.hThread);
  for (;;) {
    if (WaitForSingleObject(process.hProcess, 10) == WAIT_OBJECT_0) break;
    timedOut = GetTickCount64() - start >= timeout;
    if (cancelled || timedOut) { TerminateJobObject(job, 1); WaitForSingleObject(process.hProcess, INFINITE); break; }
  }
  DWORD code = 1; GetExitCodeProcess(process.hProcess, &code); CloseHandle(process.hProcess);
  // A root command may leave background descendants; end the entire owned job before reporting exit.
  TerminateJobObject(job, 1);
  for (;;) { JOBOBJECT_BASIC_ACCOUNTING_INFORMATION info{}; if (!QueryInformationJobObject(job, JobObjectBasicAccountingInformation, &info, sizeof(info), nullptr)) { CloseHandle(job); output.join(); return fail("JOB_QUERY_FAILED"); } if (!info.ActiveProcesses) break; Sleep(5); }
  CloseHandle(job); output.join();
  std::cerr << "{\"status\":\"exited\",\"code\":" << code << ",\"cancelled\":" << (cancelled ? "true" : "false") << ",\"timedOut\":" << (timedOut ? "true" : "false") << "}" << std::endl;
  // The process exit closes the blocking control thread and all remaining handles.
  ExitProcess(0);
}
