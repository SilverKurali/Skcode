export function useRemoteConnectionEntryVisibility(): boolean {
  // 产品决策：暂时隐藏「远程连接」全部入口。
  // 原因：远程运行时资源目前无自有下载源，连接流程会在部署运行时一步必然失败。
  // 恢复条件：接入自有远程资源源后改回 true。见 specs/remote-connection.md。
  return false;
}
