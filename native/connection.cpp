#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <winsock2.h>
#include <windows.h>
#include <iphlpapi.h>
#include <cstdint>
#include <limits>
#include <vector>
#include <iostream>
#include "connection.hpp"

static bool number(const wchar_t* text, uint64_t maximum, uint64_t& result) {
  result = 0; if (!*text) return false;
  for (; *text; ++text) {
    if (*text < L'0' || *text > L'9') return false;
    uint64_t digit = *text - L'0'; if (result > (maximum - digit) / 10) return false;
    result = result * 10 + digit;
  }
  return result > 0 && result <= maximum;
}
static bool ownedConnection(DWORD pid, uint64_t birth, DWORD serverPort, DWORD clientPort) {
  HANDLE process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION | SYNCHRONIZE, FALSE, pid);
  if (!process) return false;
  FILETIME created{}, exited{}, kernel{}, user{};
  bool identity = GetProcessTimes(process, &created, &exited, &kernel, &user)
    && ((uint64_t(created.dwHighDateTime) << 32) | created.dwLowDateTime) == birth
    && WaitForSingleObject(process, 0) == WAIT_TIMEOUT;
  bool found = false;
  if (identity) {
    DWORD size = 0;
    DWORD status = GetExtendedTcpTable(nullptr, &size, FALSE, AF_INET, TCP_TABLE_OWNER_PID_CONNECTIONS, 0);
    for (unsigned attempt = 0; attempt < 3 && status == ERROR_INSUFFICIENT_BUFFER && size >= sizeof(DWORD) && size <= 8 * 1024 * 1024; ++attempt) {
      std::vector<unsigned char> bytes(size);
      status = GetExtendedTcpTable(bytes.data(), &size, FALSE, AF_INET, TCP_TABLE_OWNER_PID_CONNECTIONS, 0);
      if (status != NO_ERROR) continue;
      auto table = reinterpret_cast<MIB_TCPTABLE_OWNER_PID*>(bytes.data());
      if (table->dwNumEntries > (bytes.size() - sizeof(DWORD)) / sizeof(MIB_TCPROW_OWNER_PID)) break;
      for (DWORD i = 0; i < table->dwNumEntries; ++i) {
        const auto& row = table->table[i];
        if (row.dwState == MIB_TCP_STATE_ESTAB && row.dwOwningPid == pid
            && ntohl(row.dwLocalAddr) == INADDR_LOOPBACK && ntohl(row.dwRemoteAddr) == INADDR_LOOPBACK
            && ntohs(static_cast<u_short>(row.dwLocalPort)) == serverPort
            && ntohs(static_cast<u_short>(row.dwRemotePort)) == clientPort) { found = true; break; }
      }
    }
  }
  found = found && WaitForSingleObject(process, 0) == WAIT_TIMEOUT;
  CloseHandle(process); return found;
}
int inspectConnection(int argc, wchar_t** argv) {
  uint64_t pid, birth, serverPort, clientPort;
  if (argc != 6 || !number(argv[2], UINT32_MAX, pid) || !number(argv[3], std::numeric_limits<uint64_t>::max(), birth)
      || !number(argv[4], 65535, serverPort) || !number(argv[5], 65535, clientPort)) return 2;
  std::cout << "{\"owned\":" << (ownedConnection(static_cast<DWORD>(pid), birth, static_cast<DWORD>(serverPort), static_cast<DWORD>(clientPort)) ? "true" : "false") << "}" << std::endl;
  return 0;
}
